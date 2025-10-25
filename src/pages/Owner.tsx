import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SupportChat } from "@/components/SupportChat";
import { UserRequestsPanel } from "@/components/UserRequestsPanel";
import { AdminDeviceAuthPanel } from "@/components/AdminDeviceAuthPanel";
import { AdminUserKeysViewer } from "@/components/AdminUserKeysViewer";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Check, X, Ban, Shield, LogOut } from "lucide-react";

interface User {
  id: string;
  username: string;
  approval_status: "approved" | "pending" | "rejected";
  credits: number;
  created_at: string;
  ban_until: string | null;
  ban_message: string | null;
}

const Owner = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditInputs, setCreditInputs] = useState<Record<string, number>>({});
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banDuration, setBanDuration] = useState<string>("1day");
  const [banMessage, setBanMessage] = useState<string>("");
  const [adminUsers, setAdminUsers] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    checkOwnerAndLoadUsers();
  }, []);

  const checkOwnerAndLoadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is owner
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "owner")
        .single();

      if (!roleData) {
        toast.error("Access denied: Owner privileges required");
        navigate("/dashboard");
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error("Error checking owner:", error);
      navigate("/dashboard");
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, approval_status, credits, created_at, ban_until, ban_message")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);

      // Load admin users
      const { data: adminData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminData) {
        setAdminUsers(new Set(adminData.map(r => r.user_id)));
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateApprovalStatus = async (userId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ approval_status: status })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`User ${status === "approved" ? "approved" : "rejected"}`);
      await loadUsers();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const updateCredits = async (userId: string, newCredits: number) => {
    if (newCredits < 0) {
      toast.error("Credits cannot be negative");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ credits: newCredits })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Credits updated successfully");
      await loadUsers();
    } catch (error) {
      toast.error("Failed to update credits");
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    const durationMap: Record<string, number> = {
      "1day": 1,
      "1week": 7,
      "1month": 30,
      "1year": 365,
    };

    const days = durationMap[banDuration] || 1;
    const banUntil = new Date();
    banUntil.setDate(banUntil.getDate() + days);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ban_until: banUntil.toISOString(),
          ban_message: banMessage || "You have been banned.",
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success(`User banned for ${banDuration}`);
      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanMessage("");
      await loadUsers();
    } catch (error) {
      toast.error("Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ban_until: null,
          ban_message: null,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("User unbanned successfully");
      await loadUsers();
    } catch (error) {
      toast.error("Failed to unban user");
    }
  };

  const setUserAsAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (error) throw error;

      toast.success("User set as admin");
      await loadUsers();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.info("User is already an admin");
      } else {
        toast.error("Failed to set user as admin");
      }
    }
  };

  const removeUserAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) throw error;

      toast.success("Admin role removed");
      await loadUsers();
    } catch (error) {
      toast.error("Failed to remove admin role");
    }
  };

  const handleForceLogout = async (userId: string) => {
    if (!confirm("Force logout this user? They will need to sign in again.")) return;

    try {
      const { error } = await supabase.auth.admin.signOut(userId);

      if (error) throw error;

      toast.success("User has been logged out");
    } catch (error: any) {
      toast.error(error.message || "Failed to force logout");
    }
  };

  const isUserBanned = (user: User) => {
    if (!user.ban_until) return false;
    return new Date(user.ban_until) > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Owner Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Full control over users, approvals, admins, and credits
            </p>
          </div>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage all aspects of user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ban Status</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.username}
                          {adminUsers.has(user.id) && (
                            <Badge variant="secondary">Admin</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.approval_status === "approved"
                              ? "default"
                              : user.approval_status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {user.approval_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isUserBanned(user) ? (
                          <Badge variant="destructive">
                            Banned until {new Date(user.ban_until!).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={creditInputs[user.id] ?? user.credits}
                            onChange={(e) =>
                              setCreditInputs({
                                ...creditInputs,
                                [user.id]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-20"
                          />
                          {creditInputs[user.id] !== undefined &&
                            creditInputs[user.id] !== user.credits && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateCredits(user.id, creditInputs[user.id])
                                }
                              >
                                Update
                              </Button>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {adminUsers.has(user.id) ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeUserAdmin(user.id)}
                            title="Remove Admin"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUserAsAdmin(user.id)}
                            title="Set as Admin"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {user.approval_status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateApprovalStatus(user.id, "approved")}
                              title="Approve User"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateApprovalStatus(user.id, "rejected")}
                              title="Reject User"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {isUserBanned(user) ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUnbanUser(user.id)}
                            title="Unban User"
                          >
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedUser(user);
                              setBanDialogOpen(true);
                            }}
                            title="Ban User"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleForceLogout(user.id)}
                          title="Force Logout"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <UserRequestsPanel />

        <AdminDeviceAuthPanel />

        <AdminUserKeysViewer />
        
        <SupportChat isAdmin={true} />

        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban User</DialogTitle>
              <DialogDescription>
                Ban {selectedUser?.username} for a specified duration with a custom message.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ban-duration">Ban Duration</Label>
                <Select value={banDuration} onValueChange={setBanDuration}>
                  <SelectTrigger id="ban-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1day">1 Day</SelectItem>
                    <SelectItem value="1week">1 Week</SelectItem>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ban-message">Ban Message</Label>
                <Textarea
                  id="ban-message"
                  placeholder="Enter reason for ban..."
                  value={banMessage}
                  onChange={(e) => setBanMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBanUser}>
                Ban User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Owner;
