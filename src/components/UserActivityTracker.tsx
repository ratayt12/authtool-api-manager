import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserActivity {
  id: string;
  username: string;
  total_keys: number;
  last_activity: string;
}

export const UserActivityTracker = ({ onViewUserKeys }: { onViewUserKeys: (userId: string, username: string) => void }) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username");

      if (profilesError) throw profilesError;

      const activitiesData: UserActivity[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from("keys")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id);

          const { data: lastAction } = await supabase
            .from("user_actions")
            .select("created_at")
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: profile.id,
            username: profile.username,
            total_keys: count || 0,
            last_activity: lastAction?.created_at || "Never",
          };
        })
      );

      setActivities(activitiesData);
    } catch (error) {
      console.error("Failed to load activities:", error);
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

  return (
    <Card className="shadow-xl border-border/50">
      <CardHeader>
        <CardTitle>User Activity</CardTitle>
        <CardDescription>Monitor all user actions and key creation</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Total Keys</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.username}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{activity.total_keys}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {activity.last_activity !== "Never"
                    ? new Date(activity.last_activity).toLocaleString()
                    : "Never"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewUserKeys(activity.id, activity.username)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Keys
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
