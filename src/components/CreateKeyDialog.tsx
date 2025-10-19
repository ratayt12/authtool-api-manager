import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateKeyDialogProps {
  children: React.ReactNode;
  onKeyCreated?: () => void;
}

export const CreateKeyDialog = ({ children, onKeyCreated }: CreateKeyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState<string>("1day");
  const [loading, setLoading] = useState(false);

  const handleCreateKey = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-key", {
        body: { 
          duration,
          packageIds: [1] // Default package ID
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to create key");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(`Key created successfully! ${data.creditsRemaining} credits remaining`);
      setOpen(false);
      
      // Refresh parent component
      if (onKeyCreated) {
        onKeyCreated();
      }
    } catch (error: any) {
      console.error("Create key error:", error);
      toast.error(error.message || "Failed to create key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Key</DialogTitle>
          <DialogDescription>
            Select the duration for your new API key. This will cost 1 credit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Key Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">1 Day</SelectItem>
                <SelectItem value="1week">1 Week</SelectItem>
                <SelectItem value="25days">25 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateKey}
            disabled={loading}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Key (1 Credit)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
