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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authtoolApiKey = Deno.env.get('AUTHTOOL_API_KEY');

    if (!authtoolApiKey) {
      throw new Error('AuthTool API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking pending keys and updating status...');

    // Get all pending keys older than 1 hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: keys, error: keysError } = await supabase
      .from('keys')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo.toISOString());

    if (keysError) throw keysError;

    console.log(`Found ${keys?.length || 0} pending keys to check`);

    if (keys && keys.length > 0) {
      for (const key of keys) {
        try {
          // Check key status with AuthTool API
          const response = await fetch(`https://api.authtool.app/public/v1/key/${key.key_code}`, {
            method: 'GET',
            headers: {
              'X-API-Key': authtoolApiKey
            }
          });

          if (response.ok) {
            const data = await response.json();
            const activateCount = data.key?.activateCount || 0;
            
            // If activated, update to active status
            if (activateCount > 0) {
              await supabase
                .from('keys')
                .update({ 
                  status: 'active',
                  activate_count: activateCount 
                })
                .eq('id', key.id);
              
              console.log(`Updated key ${key.key_code} to active status`);
            } else {
              // Still pending but expired time limit, mark as deleted
              await supabase
                .from('keys')
                .update({ status: 'deleted' })
                .eq('id', key.id);
              
              console.log(`Marked key ${key.key_code} as deleted (expired pending)`);
            }
          }
        } catch (error) {
          console.error(`Error checking key ${key.key_code}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, checked: keys?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-key-status function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
