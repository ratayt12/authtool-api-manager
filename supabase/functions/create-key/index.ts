import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authtoolApiKey = Deno.env.get('AUTHTOOL_API_KEY');

    if (!authtoolApiKey) {
      throw new Error('AuthTool API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the JWT token from the authorization header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user profile and check credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch profile');
    }

    if (profile.approval_status !== 'approved') {
      return new Response(
        JSON.stringify({ error: 'Your account is pending approval' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { duration } = await req.json();

    // Map duration to days, unit, and credit cost
    const durationMap: Record<string, { duration: number; unit: string; credits: number }> = {
      '1day': { duration: 1, unit: 'day', credits: 1 },
      '1week': { duration: 7, unit: 'day', credits: 3 },
      '25days': { duration: 25, unit: 'day', credits: 5 }
    };

    const durationConfig = durationMap[duration];
    if (!durationConfig) {
      throw new Error('Invalid duration');
    }

    if (profile.credits < durationConfig.credits) {
      return new Response(
        JSON.stringify({ error: `Insufficient credits. You need ${durationConfig.credits} credits for this duration.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call AuthTool API to create key (without isCleanable)
    console.log('Creating key with AuthTool API...');
    const authtoolResponse = await fetch('https://api.authtool.app/public/v1/key/single-activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': authtoolApiKey
      },
      body: JSON.stringify({
        quantity: 1,
        packageIds: [3915],
        duration: durationConfig.duration,
        unit: durationConfig.unit
      })
    });

    if (!authtoolResponse.ok) {
      const errorText = await authtoolResponse.text();
      console.error('AuthTool API error:', authtoolResponse.status, errorText);
      throw new Error(`AuthTool API error: ${errorText}`);
    }

    const authtoolData = await authtoolResponse.json();
    const keyCode = authtoolData.data[0];

    console.log('Key created successfully:', keyCode);

    // Calculate expiry time (1 hour from now for pending keys)
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 1);

    // Store key in database with "pending" status
    const { error: keyInsertError } = await supabase
      .from('keys')
      .insert({
        user_id: user.id,
        key_code: keyCode,
        duration: duration,
        package_ids: [3915],
        is_cleanable: false,
        status: 'pending',
        expired_at: expiryTime.toISOString()
      });

    if (keyInsertError) {
      console.error('Failed to store key:', keyInsertError);
      throw new Error('Failed to store key in database');
    }

    // Deduct credits based on duration
    const newCredits = profile.credits - durationConfig.credits;
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id);

    if (creditError) {
      console.error('Failed to deduct credits:', creditError);
      throw new Error('Failed to deduct credits');
    }

    return new Response(
      JSON.stringify({ success: true, keyCode, creditsRemaining: newCredits }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-key function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Determine appropriate status code
    let statusCode = 500;
    if (errorMessage.includes('Insufficient credits')) {
      statusCode = 400;
    } else if (errorMessage.includes('pending approval') || errorMessage.includes('Unauthorized')) {
      statusCode = 403;
    } else if (errorMessage.includes('Package not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('not configured')) {
      statusCode = 500;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
