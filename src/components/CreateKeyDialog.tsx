import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreateKeyDialogProps {
  children: React.ReactNode;
  onKeyCreated?: () => void;
  disabled?: boolean;
}

export const CreateKeyDialog = ({ children, onKeyCreated, disabled = false }: CreateKeyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState<string>("1day");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleCreateKey = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-key", {
        body: { 
          duration
        },
      });

      if (error) throw error;

      toast.success(`Key created: ${data.keyCode}`);
      setOpen(false);
      onKeyCreated?.();
    } catch (error: any) {
      console.error("Error creating key:", error);
      toast.error(error.message || "Failed to create key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={disabled ? undefined : setOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createNewKey")}</DialogTitle>
          <DialogDescription>
            {t("selectDurationDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="duration">{t("keyDuration")}</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue placeholder={t("keyDuration")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">{t("oneDay")}</SelectItem>
                <SelectItem value="1week">{t("oneWeek")}</SelectItem>
                <SelectItem value="25days">{t("oneMonth")}</SelectItem>
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
            {t("cancel")}
          </Button>
          <Button
            onClick={handleCreateKey}
            disabled={loading}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("createKey")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
