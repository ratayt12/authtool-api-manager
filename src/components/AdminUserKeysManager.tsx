import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Trash2, Loader2 } from "lucide-react";

interface Key {
  id: string;
  key_code: string;
  duration: string;
  created_at: string;
  status: string;
  activate_count: number;
}

export const AdminUserKeysManager = () => {
  const [username, setUsername] = useState("");
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchUserKeys = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Find user by username
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("username", username)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        toast.error("User not found");
        setKeys([]);
        return;
      }

      // Get user's keys
      const { data: userKeys, error: keysError } = await supabase
        .from("keys")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (keysError) throw keysError;

      setKeys(userKeys || []);
      
      if (!userKeys || userKeys.length === 0) {
        toast.info(`No keys found for user: ${profile.username}`);
      } else {
        toast.success(`Found ${userKeys.length} keys for user: ${profile.username}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to search user keys");
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (keyId: string, keyCode: string) => {
    if (!confirm(`Are you sure you want to delete key ${keyCode}? This will remove it from the user's dashboard.`)) {
      return;
    }

    try {
      // Delete from database
      const { error } = await supabase
        .from("keys")
        .delete()
        .eq("id", keyId);

      if (error) throw error;

      toast.success(`Key ${keyCode} deleted successfully`);
      
      // Refresh the keys list
      setKeys(keys.filter(k => k.id !== keyId));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete key");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage User Keys</CardTitle>
        <CardDescription>
          Search for a user and delete their keys
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUserKeys()}
              className="pl-10"
            />
          </div>
          <Button onClick={searchUserKeys} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {searched && keys.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            No keys found for this user
          </div>
        )}

        {keys.length > 0 && (
          <div className="space-y-3">
            {keys.map((key) => (
              <Card key={key.id} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {key.key_code}
                        </code>
                        <Badge variant={
                          key.status === "deleted" ? "outline" :
                          key.status === "active" ? "default" : 
                          key.status === "blocked" ? "destructive" : 
                          "secondary"
                        }>
                          {key.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Duration: <span className="text-foreground font-medium">{key.duration}</span></p>
                        <p>Created: <span className="text-foreground">{new Date(key.created_at).toLocaleDateString()}</span></p>
                        <p>Activations: <span className="text-foreground">{key.activate_count}</span></p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteKey(key.id, key.key_code)}
                      disabled={key.status === "deleted"}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
