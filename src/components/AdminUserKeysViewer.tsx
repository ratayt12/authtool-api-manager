import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, Key } from "lucide-react";

interface Key {
  id: string;
  key_code: string;
  duration: string;
  created_at: string;
  status: string;
  activate_count: number;
}

export const AdminUserKeysViewer = () => {
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
    try {
      // First, find the user by username
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        toast.error("User not found");
        setKeys([]);
        setSearched(true);
        return;
      }

      // Then get their keys
      const { data: keysData, error: keysError } = await supabase
        .from("keys")
        .select("*")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false });

      if (keysError) throw keysError;

      setKeys(keysData || []);
      setSearched(true);
      
      if (!keysData || keysData.length === 0) {
        toast.info(`No keys found for user ${username}`);
      } else {
        toast.success(`Found ${keysData.length} key(s) for ${username}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to search user keys");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          View User Keys
        </CardTitle>
        <CardDescription>
          Search for a user by username to view all their keys
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchUserKeys()}
            className="flex-1"
          />
          <Button onClick={searchUserKeys} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {searched && keys.length > 0 && (
          <div className="space-y-3 mt-4">
            <div className="text-sm font-medium">
              Found {keys.length} key(s) for <strong>{username}</strong>
            </div>
            {keys.map((key) => (
              <Card key={key.id} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
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
                        <p>Created: <span className="text-foreground">{new Date(key.created_at).toLocaleString()}</span></p>
                        <p>Activations: <span className="text-foreground">{key.activate_count}</span></p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {searched && keys.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No keys found for this user
          </div>
        )}
      </CardContent>
    </Card>
  );
};
