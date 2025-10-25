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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin or owner
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "owner"]);

    if (!roleData || roleData.length === 0) {
      throw new Error('Unauthorized: Admin or Owner privileges required');
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      throw new Error('Target user ID is required');
    }

    // Instead of trying to invalidate JWT tokens (which Supabase doesn't support directly),
    // we'll delete all their device sessions, forcing them to re-authenticate and re-authorize
    const { error: deleteError } = await supabase
      .from('device_sessions')
      .delete()
      .eq('user_id', targetUserId);

    if (deleteError) {
      console.error('Error deleting device sessions:', deleteError);
      throw new Error(`Failed to remove device sessions: ${deleteError.message}`);
    }

    // Also temporarily ban them for 1 minute to force immediate logout
    const banUntil = new Date();
    banUntil.setMinutes(banUntil.getMinutes() + 1);

    const { error: banError } = await supabase
      .from('profiles')
      .update({
        ban_until: banUntil.toISOString(),
        ban_message: 'Session invalidated by administrator. Please log in again.'
      })
      .eq('id', targetUserId);

    if (banError) {
      console.error('Error applying temporary ban:', banError);
    }

    console.log(`User ${targetUserId} has been logged out by ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'User has been logged out' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in force-logout function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
