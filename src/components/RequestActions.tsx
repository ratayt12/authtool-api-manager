import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2, Ban, Info } from "lucide-react";
import { z } from "zod";

const requestSchema = z.object({
  requestType: z.enum(["ban_udid", "device_info"]),
  keyCode: z.string().min(1).max(255),
  udid: z.string().max(255).optional(),
});

interface RequestActionsProps {
  keyCode: string;
  udid?: string;
  onComplete?: () => void;
}

export const RequestActions = ({ keyCode, udid, onComplete }: RequestActionsProps) => {
  const [loading, setLoading] = useState(false);

  const createRequest = async (requestType: "ban_udid" | "device_info") => {
    setLoading(true);
    try {
      // Validate input
      const validation = requestSchema.safeParse({
        requestType,
        keyCode,
        udid,
      });

      if (!validation.success) {
        toast.error("Invalid request data");
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in");
        setLoading(false);
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
          request_type: validation.data.requestType,
          key_code: validation.data.keyCode,
          udid: validation.data.udid || null,
        });

      if (error) throw error;

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
          Request More Info
        </Button>
      </div>
    </Card>
  );
};
