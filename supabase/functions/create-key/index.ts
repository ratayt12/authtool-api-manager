import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    if (profile.credits < 1) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { duration, packageIds } = await req.json();

    // Map duration to days and unit
    const durationMap: Record<string, { duration: number; unit: string }> = {
      '1day': { duration: 1, unit: 'day' },
      '1week': { duration: 7, unit: 'day' },
      '25days': { duration: 25, unit: 'day' }
    };

    const durationConfig = durationMap[duration];
    if (!durationConfig) {
      throw new Error('Invalid duration');
    }

    // Call AuthTool API to create key
    console.log('Creating key with AuthTool API...');
    const authtoolResponse = await fetch('https://api.authtool.app/public/v1/key/single-activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': authtoolApiKey
      },
      body: JSON.stringify({
        quantity: 1,
        packageIds: packageIds || [1],
        duration: durationConfig.duration,
        unit: durationConfig.unit,
        isCleanable: true
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

    // Store key in database
    const { error: keyInsertError } = await supabase
      .from('keys')
      .insert({
        user_id: user.id,
        key_code: keyCode,
        duration: duration,
        package_ids: packageIds || [1],
        is_cleanable: true,
        status: 'active'
      });

    if (keyInsertError) {
      console.error('Failed to store key:', keyInsertError);
      throw new Error('Failed to store key in database');
    }

    // Deduct credit
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    if (creditError) {
      console.error('Failed to deduct credit:', creditError);
      throw new Error('Failed to deduct credit');
    }

    return new Response(
      JSON.stringify({ success: true, keyCode, creditsRemaining: profile.credits - 1 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-key function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
