import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Monitor, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  approval_status: string;
}

interface UserDeviceData {
  profile: UserProfile;
  devices: DeviceSession[];
}

export const UserDeviceInfoPanel = () => {
  const [userData, setUserData] = useState<UserDeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUserDeviceData();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('user-device-info-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_sessions'
        },
        () => loadUserDeviceData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUserDeviceData = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, approval_status")
        .order("username");

      if (profilesError) throw profilesError;

      // Get all device sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("device_sessions")
        .select("*")
        .order("last_active", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Group devices by user
      const userDeviceMap: Record<string, DeviceSession[]> = {};
      sessions?.forEach(session => {
        if (!userDeviceMap[session.user_id]) {
          userDeviceMap[session.user_id] = [];
        }
        userDeviceMap[session.user_id].push(session);
      });

      // Combine data
      const combinedData: UserDeviceData[] = profiles?.map(profile => ({
        profile,
        devices: userDeviceMap[profile.id] || []
      })) || [];

      setUserData(combinedData);
    } catch (error) {
      toast.error("Failed to load user device data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
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

  return (
    <Card className="shadow-xl border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          User Device Information
        </CardTitle>
        <CardDescription>
          View all users with their IPs, device info, and session details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {userData.map((user) => (
            <Collapsible
              key={user.profile.id}
              open={expandedUsers.has(user.profile.id)}
              onOpenChange={() => toggleUserExpanded(user.profile.id)}
            >
              <Card className={user.devices.length > 0 ? "border-primary/20" : "border-muted"}>
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          {expandedUsers.has(user.profile.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="font-semibold">{user.profile.username}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {user.devices.length} device{user.devices.length !== 1 ? 's' : ''}
                        </Badge>
                        <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          ID: {user.profile.id.substring(0, 8)}...
                        </code>
                      </div>
                      {user.devices.length > 0 && (
                        <div className="flex gap-2">
                          {user.devices.some(d => !d.is_approved) && (
                            <Badge variant="secondary">Pending Approval</Badge>
                          )}
                          {user.devices.some(d => d.is_approved) && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    {user.devices.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No devices registered for this user
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead>IP Address</TableHead>
                              <TableHead>Device Info</TableHead>
                              <TableHead>Last Active</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {user.devices.map((device) => (
                              <TableRow key={device.id}>
                                <TableCell>
                                  <Badge variant={device.is_approved ? "default" : "secondary"}>
                                    {device.is_approved ? "Approved" : "Pending"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs bg-muted px-2 py-1 rounded">
                                    {device.ip_address || "Unknown"}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  <details className="text-xs">
                                    <summary className="cursor-pointer text-primary hover:underline">
                                      View Details
                                    </summary>
                                    <div className="mt-2 space-y-1 text-muted-foreground">
                                      <p><strong>User Agent:</strong> {device.device_info?.userAgent || 'N/A'}</p>
                                      <p><strong>Platform:</strong> {device.device_info?.platform || 'N/A'}</p>
                                      <p><strong>Language:</strong> {device.device_info?.language || 'N/A'}</p>
                                      <p><strong>Screen:</strong> {device.device_info?.screenResolution || 'N/A'}</p>
                                      <p><strong>Fingerprint:</strong> {device.device_fingerprint.substring(0, 12)}...</p>
                                    </div>
                                  </details>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {new Date(device.last_active).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {new Date(device.created_at).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
          
          {userData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
