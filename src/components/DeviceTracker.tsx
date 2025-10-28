import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Utility to generate device fingerprint
const getDeviceFingerprint = () => {
  const nav = navigator as any;
  const screen = window.screen;
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hardwareConcurrency: nav.hardwareConcurrency || 'unknown',
    deviceMemory: nav.deviceMemory || 'unknown',
  };

  // Create a simple hash of the fingerprint
  const fingerprintString = JSON.stringify(fingerprint);
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
};

// Utility to get IP address
const getIpAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP address:', error);
    return 'unknown';
  }
};

// Function to check device authorization and auto-login
export const checkDeviceAuth = async (): Promise<boolean> => {
  try {
    const deviceFingerprint = getDeviceFingerprint();
    const ipAddress = await getIpAddress();

    // Check if device is already approved
    const { data: approvedSession } = await supabase
      .from('device_sessions')
      .select('user_id, is_approved')
      .eq('device_fingerprint', deviceFingerprint)
      .eq('ip_address', ipAddress)
      .eq('is_approved', true)
      .maybeSingle();

    if (approvedSession) {
      // Device is approved, we can auto-login
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking device auth:', error);
    return false;
  }
};

export const DeviceTracker = () => {
  useEffect(() => {
    const trackDevice = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const deviceFingerprint = getDeviceFingerprint();
        const ipAddress = await getIpAddress();
        const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
        };

        // Check if this device already exists
        const { data: existingSession } = await supabase
          .from('device_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('device_fingerprint', deviceFingerprint)
          .maybeSingle();

        if (existingSession) {
          // Check if device is approved
          if (!existingSession.is_approved) {
            // Device not approved, sign out
            await supabase.auth.signOut();
            window.location.href = '/auth?error=device_not_approved';
            return;
          }

          // Update last active time
          await supabase
            .from('device_sessions')
            .update({
              last_active: new Date().toISOString(),
              ip_address: ipAddress,
            })
            .eq('id', existingSession.id);
        } else {
          // Insert new device session
          // First device is automatically approved, subsequent devices need approval
          const { data: allSessions } = await supabase
            .from('device_sessions')
            .select('id')
            .eq('user_id', session.user.id);

          const isFirstDevice = !allSessions || allSessions.length === 0;

          await supabase
            .from('device_sessions')
            .insert({
              user_id: session.user.id,
              device_fingerprint: deviceFingerprint,
              device_info: deviceInfo,
              ip_address: ipAddress,
              is_approved: isFirstDevice, // Auto-approve first device
            });

          // If not first device and not approved, sign out
          if (!isFirstDevice) {
            await supabase.auth.signOut();
            window.location.href = '/auth?error=device_requires_approval';
            return;
          }
        }
      } catch (error) {
        console.error('Device tracking error:', error);
      }
    };

    trackDevice();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        trackDevice();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null; // This is a tracking component, no UI
};
