import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";

type PrivateMessage = {
  id: string;
  message: string | null;
  image_url: string | null;
  video_url: string | null;
  sender_name: string;
  is_read: boolean;
  created_at: string;
};

export const PrivateMessages = () => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel('private_messages_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages'
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

  const loadMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("private_messages")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
      setUnreadCount(data?.filter(m => !m.is_read).length || 0);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from("private_messages")
        .update({ is_read: true })
        .eq("id", messageId);
      
      loadMessages();
    } catch (error) {
      console.error("Failed to mark message as read:", error);
    }
  };

  return (
    <Card className="shadow-xl border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Private Messages
          </CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} new</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <Card 
                  key={msg.id} 
                  className={`p-4 ${!msg.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
                  onClick={() => !msg.is_read && markAsRead(msg.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{msg.sender_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    {msg.image_url && (
                      <img 
                        src={msg.image_url} 
                        alt="Attached" 
                        className="rounded-md max-w-full"
                      />
                    )}
                    {msg.video_url && (
                      <video 
                        src={msg.video_url} 
                        controls 
                        className="rounded-md max-w-full"
                      />
                    )}
                    {msg.message && (
                      <p className="text-sm">{msg.message}</p>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
