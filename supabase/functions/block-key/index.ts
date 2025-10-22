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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { keyCode } = await req.json();

    // Verify the key belongs to the user
    const { data: keyData, error: keyError } = await supabase
      .from('keys')
      .select('*')
      .eq('key_code', keyCode)
      .eq('user_id', user.id)
      .single();

    if (keyError || !keyData) {
      throw new Error('Key not found or unauthorized');
    }

    // Block key in AuthTool API using correct endpoint
    const authToolApiKey = Deno.env.get('AUTHTOOL_API_KEY');
    if (!authToolApiKey) {
      console.error('AUTHTOOL_API_KEY not configured');
      throw new Error('API configuration error');
    }

    try {
      const authToolResponse = await fetch(`https://api.authtool.app/public/v1/key/${keyCode}/change-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': authToolApiKey,
        },
        body: JSON.stringify({
          status: 0, // 0 = Disabled/Blocked
        }),
      });

      if (!authToolResponse.ok) {
        const errorText = await authToolResponse.text();
        console.error('AuthTool API error:', errorText);
        throw new Error('Failed to block key in AuthTool');
      }

      const authToolResult = await authToolResponse.json();
      console.log('AuthTool block response:', authToolResult);
    } catch (error) {
      console.error('Error calling AuthTool API:', error);
      throw new Error('Failed to block key in AuthTool API');
    }

    // Update status in database
    const { error: updateError } = await supabase
      .from('keys')
      .update({ status: 'blocked' })
      .eq('key_code', keyCode)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update key status:', updateError);
      throw new Error('Failed to update key status in database');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in block-key function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
