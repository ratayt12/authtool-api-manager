import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bell, MessageSquare, Image as ImageIcon, Video } from "lucide-react";

type UserRequest = {
  id: string;
  user_id: string;
  username: string;
  request_type: string;
  key_code: string | null;
  udid: string | null;
  status: string;
  created_at: string;
};

export const UserRequestsPanel = () => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel('user_requests_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_requests'
        },
        () => {
          loadRequests();
          toast.info("New request received!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("user_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRequest || (!message.trim() && !mediaFile)) return;

    try {
      setUploading(true);
      let imageUrl = null;
      let videoUrl = null;

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const bucket = mediaType === 'video' ? 'support-videos' : 'support-images';
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        if (mediaType === 'video') {
          videoUrl = publicUrl;
        } else {
          imageUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from("private_messages")
        .insert({
          user_id: selectedRequest.user_id,
          message: message,
          image_url: imageUrl,
          video_url: videoUrl,
          sender_name: "SonicBot",
        });

      if (error) throw error;

      await supabase
        .from("user_requests")
        .update({ status: 'completed' })
        .eq("id", selectedRequest.id);

      toast.success("Message sent to user");
      setMessage("");
      setMediaFile(null);
      setMediaType(null);
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="shadow-xl border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              User Requests
            </CardTitle>
            <CardDescription>Manage user requests for key deletion, UDID bans, and device info</CardDescription>
          </div>
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <Badge variant="destructive">
              {requests.filter(r => r.status === 'pending').length} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Request Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.username}</TableCell>
                <TableCell>
                  <Badge variant="outline">{request.request_type}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {request.key_code && <div>Key: {request.key_code}</div>}
                  {request.udid && <div>UDID: {request.udid.substring(0, 10)}...</div>}
                </TableCell>
                <TableCell>
                  <Badge variant={request.status === 'pending' ? 'default' : 'secondary'}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(request.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Respond
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Send Private Message</DialogTitle>
                          <DialogDescription>
                            Respond to {request.username}'s request for {request.request_type}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMediaType('image');
                                document.getElementById("image-upload-request")?.click();
                              }}
                            >
                              <ImageIcon className="h-4 w-4 mr-1" />
                              Image
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMediaType('video');
                                document.getElementById("video-upload-request")?.click();
                              }}
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Video
                            </Button>
                          </div>
                          <input
                            id="image-upload-request"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                          />
                          <input
                            id="video-upload-request"
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                          />
                          {mediaFile && (
                            <p className="text-sm text-muted-foreground">
                              Selected: {mediaFile.name}
                            </p>
                          )}
                          <Button
                            onClick={handleSendMessage}
                            disabled={uploading || (!message.trim() && !mediaFile)}
                            className="w-full"
                          >
                            {uploading ? "Sending..." : "Send Message"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
