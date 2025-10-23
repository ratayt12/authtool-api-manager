import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PrivateMessage {
  id: string;
  message: string | null;
  image_url: string | null;
  video_url: string | null;
  sender_name: string;
  is_read: boolean;
  created_at: string;
}

interface KeyPrivateMessagesProps {
  keyCode: string;
}

export const KeyPrivateMessages = ({ keyCode }: KeyPrivateMessagesProps) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`key-messages-${keyCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages',
        },
        () => loadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [keyCode]);

  const loadMessages = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: requests } = await supabase
      .from('user_requests')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('key_code', keyCode);

    if (!requests || requests.length === 0) return;

    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
    setUnreadCount(data?.filter(m => !m.is_read).length || 0);
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('id', messageId);
    
    loadMessages();
  };

  if (messages.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Messages for {keyCode}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  !message.is_read ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                }`}
                onClick={() => !message.is_read && markAsRead(message.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-sm">{message.sender_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                {message.message && (
                  <p className="text-sm whitespace-pre-wrap mb-2">{message.message}</p>
                )}
                {message.image_url && (
                  <img
                    src={message.image_url}
                    alt="Attachment"
                    className="max-w-full h-auto rounded-lg mb-2"
                  />
                )}
                {message.video_url && (
                  <video
                    src={message.video_url}
                    controls
                    className="max-w-full h-auto rounded-lg"
                  />
                )}
                {!message.is_read && (
                  <Badge variant="secondary" className="mt-2">Unread</Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
