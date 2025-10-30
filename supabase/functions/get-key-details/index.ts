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
      return new Response(
        JSON.stringify({ error: 'Key not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call AuthTool API to get key details
    console.log('Getting key details:', keyCode);
    const authtoolResponse = await fetch(`https://api.authtool.app/public/v1/key/${keyCode}/detail`, {
      method: 'GET',
      headers: {
        'X-API-Key': authtoolApiKey
      }
    });

    if (!authtoolResponse.ok) {
      const errorText = await authtoolResponse.text();
      console.error('AuthTool API error:', authtoolResponse.status, errorText);
      throw new Error(`AuthTool API error: ${errorText}`);
    }

    const authtoolData = await authtoolResponse.json();

    return new Response(
      JSON.stringify(authtoolData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-key-details function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
