import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sonic-reseller.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
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

    const { keyCode, udid } = await req.json();

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

    // Ban UDID in AuthTool API
    const authToolApiKey = Deno.env.get('AUTHTOOL_API_KEY');
    if (!authToolApiKey) {
      console.error('AUTHTOOL_API_KEY not configured');
      throw new Error('API configuration error');
    }

    try {
      const authToolResponse = await fetch('https://api.auth.gg/v1/deleteudid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'deleteudid',
          authorization: authToolApiKey,
          key: keyCode,
          udid: udid,
        }),
      });

      const authToolResult = await authToolResponse.json();
      
      if (authToolResult.status !== 'success') {
        console.error('AuthTool API error:', authToolResult);
        throw new Error(authToolResult.message || 'Failed to ban UDID in AuthTool');
      }
    } catch (error) {
      console.error('Error calling AuthTool API:', error);
      throw new Error('Failed to ban UDID in AuthTool API');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ban-udid function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
