import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Send, Image as ImageIcon, Video, CheckCheck } from "lucide-react";

type SupportMessage = Database['public']['Tables']['support_messages']['Row'];

export const SupportChat = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [username, setUsername] = useState("");
  const [readReceipts, setReadReceipts] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadUsername();
    loadMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('support_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages'
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUsername = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      if (data) setUsername(data.username);
    } catch (error) {
      console.error("Failed to load username:", error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Load read receipts
      const { data: receipts } = await supabase
        .from("message_read_receipts")
        .select("message_id, user_id");

      if (receipts) {
        const receiptMap: Record<string, string[]> = {};
        receipts.forEach(receipt => {
          if (!receiptMap[receipt.message_id]) {
            receiptMap[receipt.message_id] = [];
          }
          receiptMap[receipt.message_id].push(receipt.user_id);
        });
        setReadReceipts(receiptMap);
      }

      // Mark messages as read
      data?.forEach(async (msg) => {
        if (!msg.is_admin) {
          const { error: receiptError } = await supabase
            .from("message_read_receipts")
            .upsert({
              message_id: msg.id,
              user_id: session.user.id,
            }, {
              onConflict: 'message_id,user_id'
            });

          if (receiptError) console.error("Failed to mark as read:", receiptError);
        }
      });
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !imageFile && !videoFile) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let imageUrl = null;
      let videoUrl = null;

      setUploading(true);

      // Upload image if exists
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('support-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('support-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Upload video if exists
      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('support-videos')
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('support-videos')
          .getPublicUrl(fileName);

        videoUrl = publicUrl;
      }

      const { error } = await supabase
        .from("support_messages")
        .insert({
          user_id: session.user.id,
          message: newMessage,
          image_url: imageUrl,
          video_url: videoUrl,
          username: username,
          is_admin: isAdmin,
        });

      if (error) throw error;

      setNewMessage("");
      setImageFile(null);
      setVideoFile(null);
      await loadMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setUploading(false);
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
        <CardTitle>Support Chat</CardTitle>
        <CardDescription>
          {isAdmin ? "Respond to user inquiries" : (
            <>
              Chat with support or{" "}
              <a 
                href="https://t.me/yowxios" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                contact us on Telegram 📱
              </a>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] mb-4 rounded-md border p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.is_admin ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">{msg.username || "Anonymous"}</span>
                </div>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.is_admin
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt="Support image"
                      className="rounded-md mb-2 max-w-full"
                    />
                  )}
                  {msg.video_url && (
                    <video
                      src={msg.video_url}
                      controls
                      className="rounded-md mb-2 max-w-full"
                    />
                  )}
                  {msg.message && <p className="text-sm">{msg.message}</p>}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs opacity-70">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                    {isAdmin && readReceipts[msg.id] && (
                      <div className="flex items-center gap-1">
                        <CheckCheck className="h-3 w-3" />
                        <span className="text-xs">{readReceipts[msg.id].length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {isAdmin && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={uploading}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={uploading}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => document.getElementById("video-upload")?.click()}
                disabled={uploading}
              >
                <Video className="h-4 w-4" />
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              <Button onClick={handleSendMessage} disabled={uploading}>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {(imageFile || videoFile) && (
              <p className="text-sm text-muted-foreground">
                Selected: {imageFile?.name || videoFile?.name}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
