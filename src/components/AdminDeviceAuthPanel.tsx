import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, X, Monitor, Ban } from "lucide-react";

interface DeviceSession {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_info: any;
  ip_address: string;
  is_approved: boolean;
  created_at: string;
  last_active: string;
}

interface UserProfile {
  id: string;
  username: string;
}

export const AdminDeviceAuthPanel = () => {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('admin-device-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_sessions'
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("device_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username");

      if (profilesError) throw profilesError;

      const profilesMap: Record<string, UserProfile> = {};
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      setSessions(sessionsData || []);
      setProfiles(profilesMap);
    } catch (error) {
      toast.error("Failed to load device sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sessionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("device_sessions")
        .update({ 
          is_approved: true,
          approved_by: session.user.id
        })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Device approved successfully");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve device");
    }
  };

  const handleBan = async (sessionId: string) => {
    if (!confirm("Are you sure you want to ban this device?")) return;

    try {
      const { error } = await supabase
        .from("device_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Device banned successfully");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to ban device");
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
              Pending Device Authorizations ({pendingSessions.length})
            </CardTitle>
            <CardDescription>
              Review and approve or ban device access requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingSessions.map((session) => (
              <div key={session.id} className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline">Pending</Badge>
                    <p className="text-sm font-medium mt-1">
                      User: {profiles[session.user_id]?.username || "Unknown"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>IP Address:</strong> {session.ip_address || "Unknown"}</p>
                  <p><strong>Device ID:</strong> <code className="text-xs bg-background p-1 rounded">{session.device_fingerprint.substring(0, 40)}...</code></p>
                  {session.device_info && Object.keys(session.device_info).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground">Device Info</summary>
                      <pre className="text-xs bg-background p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(session.device_info, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(session.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBan(session.id)}
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Ban
                  </Button>
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
              Authorized Devices ({approvedSessions.length})
            </CardTitle>
            <CardDescription>
              All approved device sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedSessions.map((session) => (
              <div key={session.id} className="p-4 bg-card rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="default">
                      <Check className="h-3 w-3 mr-1" />
                      Authorized
                    </Badge>
                    <p className="text-sm font-medium mt-1">
                      User: {profiles[session.user_id]?.username || "Unknown"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Last active: {new Date(session.last_active).toLocaleString()}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1"
                      onClick={() => handleBan(session.id)}
                    >
                      <Ban className="h-3 w-3 mr-1" />
                      Ban
                    </Button>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>IP:</strong> {session.ip_address || "Unknown"}</p>
                  <p><strong>Device ID:</strong> <code className="text-xs">{session.device_fingerprint.substring(0, 30)}...</code></p>
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
