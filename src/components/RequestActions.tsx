import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2, Ban, Info } from "lucide-react";

interface RequestActionsProps {
  keyCode: string;
  udid?: string;
  onComplete?: () => void;
}

export const RequestActions = ({ keyCode, udid, onComplete }: RequestActionsProps) => {
  const [loading, setLoading] = useState(false);

  const createRequest = async (requestType: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      const { error } = await supabase
        .from("user_requests")
        .insert({
          user_id: session.user.id,
          username: profile?.username || "Unknown",
          request_type: requestType,
          key_code: keyCode,
          udid: udid || null,
        });

      if (error) throw error;

      // If delete key request, update key status to deleted
      if (requestType === "delete_key") {
        await supabase
          .from("keys")
          .update({ status: "deleted" })
          .eq("key_code", keyCode)
          .eq("user_id", session.user.id);
      }

      toast.success("Request sent! Please wait for admin response...", {
        duration: 3000,
      });

      // Log action
      await supabase
        .from("user_actions")
        .insert({
          user_id: session.user.id,
          action_type: requestType,
          action_details: { key_code: keyCode, udid: udid },
        });

      onComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-2 bg-muted/30">
      <p className="text-sm font-medium mb-2">Request Actions</p>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => createRequest("delete_key")}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
          Request Delete Key
        </Button>
        {udid && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => createRequest("ban_udid")}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Ban className="h-4 w-4 mr-1" />}
            Request Ban UDID
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => createRequest("device_info")}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Info className="h-4 w-4 mr-1" />}
          Request Device Info
        </Button>
      </div>
    </Card>
  );
};
