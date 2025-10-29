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

    // Delete from AuthTool API first using new API
    const authToolApiKey = Deno.env.get('AUTHTOOL_API_KEY');
    if (!authToolApiKey) {
      console.error('AUTHTOOL_API_KEY not configured');
      throw new Error('API configuration error');
    }

    try {
      const authToolResponse = await fetch(`https://api.authtool.app/public/v1/key/${keyCode}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': authToolApiKey,
        },
      });

      if (!authToolResponse.ok) {
        const errorText = await authToolResponse.text();
        console.error('AuthTool API error:', authToolResponse.status, errorText);
        throw new Error(`Failed to delete key from AuthTool: ${errorText}`);
      }

      const authToolResult = await authToolResponse.json();
      console.log('Key deleted from AuthTool:', authToolResult);
    } catch (error) {
      console.error('Error calling AuthTool API:', error);
      throw new Error('Failed to delete key from AuthTool API');
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('keys')
      .delete()
      .eq('key_code', keyCode)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to delete key from database:', deleteError);
      throw new Error('Failed to delete key from database');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-key function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
