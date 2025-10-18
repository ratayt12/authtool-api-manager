import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, Trash2, Info } from "lucide-react";
import { KeyDetailsDialog } from "./KeyDetailsDialog";

interface Key {
  id: string;
  key_code: string;
  duration: string;
  created_at: string;
  status: string;
  activate_count: number;
}

export const KeysList = () => {
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("keys")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (error) {
      toast.error("Failed to load keys");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (keyCode: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke("reset-key", {
        body: { keyCode },
      });

      if (error) throw error;

      toast.success("Key reset successfully");
      await loadKeys();
    } catch (error: any) {
      toast.error(error.message || "Failed to reset key");
    }
  };

  const handleDelete = async (keyCode: string) => {
    if (!confirm("Are you sure you want to delete this key?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke("delete-key", {
        body: { keyCode },
      });

      if (error) throw error;

      toast.success("Key deleted successfully");
      await loadKeys();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete key");
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
        <CardTitle>Your Keys</CardTitle>
        <CardDescription>
          Manage and monitor your generated API keys
        </CardDescription>
      </CardHeader>
      <CardContent>
        {keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No keys created yet. Create your first key to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <Card key={key.id} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {key.key_code}
                        </code>
                        <Badge variant={key.status === "active" ? "default" : "secondary"}>
                          {key.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Duration: <span className="text-foreground font-medium">{key.duration}</span></p>
                        <p>Created: <span className="text-foreground">{new Date(key.created_at).toLocaleDateString()}</span></p>
                        <p>Activations: <span className="text-foreground">{key.activate_count}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <KeyDetailsDialog keyCode={key.key_code}>
                        <Button variant="outline" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </KeyDetailsDialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReset(key.key_code)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(key.key_code)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
