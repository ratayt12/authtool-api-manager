import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Image, Video, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  message: string | null;
  image_url: string | null;
  video_url: string | null;
  sender_name: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

interface UserConversation {
  userId: string;
  userEmail: string;
  messages: Message[];
  unreadCount: number;
}

export const AdminPrivateChats = () => {
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAllConversations();

    const channel = supabase
      .channel("admin_private_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "private_messages",
        },
        () => {
          loadAllConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAllConversations = async () => {
    const { data: messages, error } = await supabase
      .from("private_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading conversations:", error);
      return;
    }

    // Group messages by user
    const grouped = messages?.reduce((acc, msg) => {
      const userId = msg.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userEmail: "",
          messages: [],
          unreadCount: 0,
        };
      }
      acc[userId].messages.push(msg);
      if (!msg.is_read && msg.sender_name !== "Admin" && msg.sender_name !== "Sonic AI") {
        acc[userId].unreadCount++;
      }
      return acc;
    }, {} as Record<string, UserConversation>);

    // Get user emails
    if (grouped) {
      for (const userId in grouped) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .single();
        grouped[userId].userEmail = profile?.username || "Unknown User";
      }
    }

    setConversations(Object.values(grouped || {}));
  };

  const handleSendMessage = async () => {
    if (!selectedUser || (!newMessage.trim() && !imageFile && !videoFile)) {
      toast({
        title: "Error",
        description: "Please enter a message or attach a file",
        variant: "destructive",
      });
      return;
    }

    let imageUrl = null;
    let videoUrl = null;

    try {
      // Upload image if present
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("support-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("support-images")
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      // Upload video if present
      if (videoFile) {
        const fileExt = videoFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("support-videos")
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("support-videos")
          .getPublicUrl(fileName);
        videoUrl = publicUrl;
      }

      // Insert message
      const { error } = await supabase.from("private_messages").insert({
        user_id: selectedUser,
        message: newMessage.trim() || null,
        image_url: imageUrl,
        video_url: videoUrl,
        sender_name: "Admin",
      });

      if (error) throw error;

      setNewMessage("");
      setImageFile(null);
      setVideoFile(null);
      loadAllConversations();

      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const selectedConversation = conversations.find(
    (c) => c.userId === selectedUser
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          User Conversations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User list */}
          <div className="md:col-span-1 border-r pr-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <Button
                    key={conv.userId}
                    variant={selectedUser === conv.userId ? "default" : "outline"}
                    className="w-full justify-between"
                    onClick={() => setSelectedUser(conv.userId)}
                  >
                    <span className="truncate">{conv.userEmail}</span>
                    {conv.unreadCount > 0 && (
                      <Badge variant="destructive">{conv.unreadCount}</Badge>
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat area */}
          <div className="md:col-span-2">
            {selectedConversation ? (
              <>
                <ScrollArea className="h-[400px] mb-4 p-4 border rounded-lg">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${
                          msg.sender_name === "Admin" || msg.sender_name === "Sonic AI"
                            ? "justify-start"
                            : "justify-end"
                        }`}
                      >
                        {(msg.sender_name === "Admin" || msg.sender_name === "Sonic AI") && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-lg max-w-[80%] ${
                            msg.sender_name === "Admin" || msg.sender_name === "Sonic AI"
                              ? "bg-muted rounded-tl-none"
                              : "bg-primary text-primary-foreground rounded-tr-none"
                          }`}
                        >
                          <p className="text-xs opacity-70 mb-1">{msg.sender_name}</p>
                          {msg.message && <p className="text-sm">{msg.message}</p>}
                          {msg.image_url && (
                            <img
                              src={msg.image_url}
                              alt="Attachment"
                              className="mt-2 rounded max-w-full"
                            />
                          )}
                          {msg.video_url && (
                            <video
                              src={msg.video_url}
                              controls
                              className="mt-2 rounded max-w-full"
                            />
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                Select a conversation to view messages
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
