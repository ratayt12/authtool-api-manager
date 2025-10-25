import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, X, Monitor } from "lucide-react";

interface DeviceSession {
  id: string;
  device_fingerprint: string;
  device_info: any;
  ip_address: string;
  is_approved: boolean;
  created_at: string;
  last_active: string;
}

export const DeviceAuthPanel = () => {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('device-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_sessions'
        },
        () => loadSessions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSessions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("device_sessions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      toast.error("Failed to load device sessions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const pendingSessions = sessions.filter(s => !s.is_approved);
  const approvedSessions = sessions.filter(s => s.is_approved);

  return (
    <div className="space-y-4">
      {pendingSessions.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Pending Device Authorizations
            </CardTitle>
            <CardDescription>
              New devices require approval before accessing your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingSessions.map((session) => (
              <div key={session.id} className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Pending Approval</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>IP Address:</strong> {session.ip_address || "Unknown"}</p>
                  <p><strong>Device ID:</strong> <code className="text-xs">{session.device_fingerprint.substring(0, 20)}...</code></p>
                  {session.device_info && Object.keys(session.device_info).length > 0 && (
                    <p><strong>Device Info:</strong> {JSON.stringify(session.device_info).substring(0, 50)}...</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {approvedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-success" />
              Authorized Devices
            </CardTitle>
            <CardDescription>
              Devices that are currently authorized to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedSessions.map((session) => (
              <div key={session.id} className="p-4 bg-card rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="default">
                    <Check className="h-3 w-3 mr-1" />
                    Authorized
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Last active: {new Date(session.last_active).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>IP Address:</strong> {session.ip_address || "Unknown"}</p>
                  <p><strong>Device ID:</strong> <code className="text-xs">{session.device_fingerprint.substring(0, 20)}...</code></p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {sessions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No device sessions found
          </CardContent>
        </Card>
      )}
    </div>
  );
};
