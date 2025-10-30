import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, RefreshCw, Trash2, Info, Ban, Shield, Lock, Unlock, Search } from "lucide-react";
import { KeyDetailsDialog } from "./KeyDetailsDialog";
import { RequestActions } from "./RequestActions";
import { KeyPrivateMessages } from "./KeyPrivateMessages";
import { useLanguage } from "@/contexts/LanguageContext";

interface Key {
  id: string;
  key_code: string;
  duration: string;
  created_at: string;
  status: string;
  activate_count: number;
}

interface Device {
  uid: string;
  expireAt: string;
  activeAt: string;
  isExpired: boolean;
  status: number;
}

export const KeysList = () => {
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    loadKeys();
  }, []);

  // Add effect to reload when component remounts or updates
  useEffect(() => {
    const channel = supabase
      .channel('keys-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'keys'
        },
        () => {
          loadKeys();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Periodic sync with AuthTool to auto-remove externally-deleted keys
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.functions.invoke('sync-deleted-keys');
        // Realtime will pick up DB deletions
      } catch (e) {
        // silent
      }
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session");
        return;
      }

      console.log("Loading keys for user:", session.user.id);

      // Sync deleted keys from AuthTool API
      try {
        await supabase.functions.invoke('sync-deleted-keys');
      } catch (syncError) {
        console.log("Error syncing deleted keys:", syncError);
      }

      const { data, error } = await supabase
        .from("keys")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading keys:", error);
        throw error;
      }
      
      console.log("Keys loaded:", data?.length || 0);
      setKeys(data || []);
    } catch (error: any) {
      console.error("Failed to load keys:", error);
      toast.error(error.message || "Failed to load keys");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (keyCode: string) => {
    // Optimistic update
    setKeys(prevKeys => prevKeys.map(key => 
      key.key_code === keyCode ? { ...key, activate_count: 0 } : key
    ));
    toast.success("Key reset successfully");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke("reset-key", {
        body: { keyCode },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to reset key");
      await loadKeys(); // Revert on error
    }
  };

  const handleBlock = async (keyCode: string) => {
    // Optimistic update
    setKeys(prevKeys => prevKeys.map(key => 
      key.key_code === keyCode ? { ...key, status: 'blocked' } : key
    ));
    toast.success("Key blocked successfully");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke("block-key", {
        body: { keyCode },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to block key");
      await loadKeys(); // Revert on error
    }
  };

  const handleUnblock = async (keyCode: string) => {
    // Optimistic update
    setKeys(prevKeys => prevKeys.map(key => 
      key.key_code === keyCode ? { ...key, status: 'active' } : key
    ));
    toast.success("Key unblocked successfully");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke("unblock-key", {
        body: { keyCode },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to unblock key");
      await loadKeys(); // Revert on error
    }
  };

  const loadDevices = async (keyCode: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("get-key-details", {
        body: { keyCode },
      });

      if (error) throw error;

      // Handle the response structure from the new API
      const keyDetails = data.key || {};
      const deviceList = data.devices || [];
      
      setDevices(deviceList);
      setSelectedKey(keyCode);

      // Update activate_count from the API response
      const activeCount = keyDetails.activateCount || 0;
      await supabase
        .from("keys")
        .update({ activate_count: activeCount })
        .eq("key_code", keyCode)
        .eq("user_id", session.user.id);

      // Reload keys to update the display
      await loadKeys();
    } catch (error: any) {
      toast.error(error.message || "Failed to load devices");
    }
  };

  const handleBanUdid = async (keyCode: string, udid: string) => {
    if (!confirm(`Are you sure you want to ban device ${udid}?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke("ban-udid", {
        body: { keyCode, udid },
      });

      if (error) throw error;

      toast.success("UDID banned successfully");
      await loadDevices(keyCode);
    } catch (error: any) {
      toast.error(error.message || "Failed to ban UDID");
    }
  };

  const handleDelete = async (keyCode: string) => {
    if (!confirm("Are you sure you want to delete this key? This action cannot be undone.")) return;

    // Optimistic update
    setKeys(prevKeys => prevKeys.filter(key => key.key_code !== keyCode));
    toast.success("Key deleted successfully");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke("delete-key", {
        body: { keyCode },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete key");
      await loadKeys(); // Revert on error
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
        <CardTitle>{t("yourKeys")}</CardTitle>
        <CardDescription>
          {t("manageKeysDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchKeys")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        {keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("noKeysYet")}
          </div>
        ) : (
          <div className="space-y-4">
            {keys.filter(key => 
              key.key_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
              key.duration.toLowerCase().includes(searchQuery.toLowerCase()) ||
              key.status.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((key) => (
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
                          key.status === "blocked" ? "destructive" : 
                          key.activate_count > 0 ? "default" : 
                          "secondary"
                        }>
                          {key.status === "deleted" ? "deleted" :
                           key.status === "blocked" ? "blocked" :
                           key.activate_count > 0 ? "Active" : "Pending"}
                        </Badge>
                        <KeyPrivateMessages keyCode={key.key_code} />
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{t("duration")}: <span className="text-foreground font-medium">{key.duration === "25days" ? "30days" : key.duration}</span></p>
                        <p>{t("created")}: <span className="text-foreground">{new Date(key.created_at).toLocaleDateString()}</span></p>
                        <p>{t("activations")}: <span className="text-foreground">{key.activate_count}</span></p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2 flex-wrap">
                        <KeyDetailsDialog keyCode={key.key_code}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={key.status === "deleted"}
                          >
                            <Info className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">{t("details")}</span>
                          </Button>
                        </KeyDetailsDialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReset(key.key_code)}
                          disabled={key.status === "deleted" || key.status === "blocked"}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">{t("reset")}</span>
                        </Button>
                        {key.status === "blocked" ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleUnblock(key.key_code)}
                          >
                            <Unlock className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">{t("unblock")}</span>
                          </Button>
                        ) : key.status === "deleted" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">{t("block")}</span>
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleBlock(key.key_code)}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">{t("block")}</span>
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(key.key_code)}
                          disabled={key.status === "deleted"}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">{t("delete")}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedKey && devices.length > 0 && (
          <Card className="mt-4 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Devices for {selectedKey}</CardTitle>
              <CardDescription>Manage device UDIDs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {devices.map((device, index) => (
                  <div key={device.uid} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-card rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium mb-1">Device {index + 1}</p>
                      <code className="text-xs text-muted-foreground break-all">{device.uid}</code>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBanUdid(selectedKey, device.uid)}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Ban UDID</span>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
