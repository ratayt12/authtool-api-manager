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
    const authtoolApiKey = Deno.env.get('AUTHTOOL_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user');
    }

    console.log(`Syncing keys for user: ${user.id}`);

    // Get all keys for this user from database
    const { data: dbKeys, error: dbError } = await supabase
      .from('keys')
      .select('id, key_code')
      .eq('user_id', user.id);

    if (dbError) {
      throw dbError;
    }

    if (!dbKeys || dbKeys.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No keys to sync', deletedCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let deletedCount = 0;

    // Check each key in AuthTool API
    for (const key of dbKeys) {
      try {
        const response = await fetch(
          `https://api.authtool.cc/api/v1/keydetails?key=${key.key_code}`,
          {
            method: 'GET',
            headers: {
              'API-KEY': authtoolApiKey,
              'Content-Type': 'application/json',
            },
          }
        );

        // If key doesn't exist in AuthTool (404 or error), delete it from database
        if (!response.ok) {
          console.log(`Key ${key.key_code} not found in AuthTool, deleting from database`);
          
          const { error: deleteError } = await supabase
            .from('keys')
            .delete()
            .eq('id', key.id);

          if (deleteError) {
            console.error(`Error deleting key ${key.key_code}:`, deleteError);
          } else {
            deletedCount++;
          }
        }
      } catch (error) {
        console.error(`Error checking key ${key.key_code}:`, error);
        // If there's an error checking the key, assume it doesn't exist and delete it
        const { error: deleteError } = await supabase
          .from('keys')
          .delete()
          .eq('id', key.id);

        if (!deleteError) {
          deletedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Keys synced successfully', 
        deletedCount,
        totalChecked: dbKeys.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error syncing keys:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});