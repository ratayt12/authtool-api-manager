import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Monitor } from "lucide-react";

interface KeyDetailsDialogProps {
  keyCode: string;
  children: React.ReactNode;
}

interface KeyDetails {
  key: {
    activateCount: number;
    activateLimit: number;
    unit: string;
    duration: number;
    expiredAt: string;
    isExpired: boolean;
  };
  devices: Array<{
    uid: string;
    expireAt: string;
    activeAt: string;
    isExpired: boolean;
    status: number;
  }>;
}

export const KeyDetailsDialog = ({ keyCode, children }: KeyDetailsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<KeyDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const { data, error } = await supabase.functions.invoke("get-key-details", {
        body: { keyCode },
      });

      if (error) throw error;

      setDetails(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load key details");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadDetails();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Key Details</DialogTitle>
          <DialogDescription>
            Detailed information about {keyCode}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : details ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activations:</span>
                  <span className="font-medium">
                    {details.key.activateCount} / {details.key.activateLimit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">
                    {details.key.duration} {details.key.unit}(s)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="font-medium">
                    {new Date(details.key.expiredAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={details.key.isExpired ? "destructive" : "default"}>
                    {details.key.isExpired ? "Expired" : "Active"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Activated Devices ({details.devices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {details.devices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No devices activated yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {details.devices.map((device, index) => (
                      <Card key={device.uid} className="bg-muted/50">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-xs font-medium">Device {index + 1}</p>
                              <code className="text-xs text-muted-foreground">{device.uid}</code>
                            </div>
                            <Badge variant={device.isExpired ? "destructive" : device.status ? "default" : "secondary"}>
                              {device.isExpired ? "Expired" : device.status ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Activated:</span>
                              <p className="font-medium">{new Date(device.activeAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expires:</span>
                              <p className="font-medium">{new Date(device.expireAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
