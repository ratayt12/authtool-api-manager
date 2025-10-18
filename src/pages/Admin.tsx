import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Check, X, Plus, Minus } from "lucide-react";

interface User {
  id: string;
  username: string;
  approval_status: "approved" | "pending" | "rejected";
  credits: number;
  created_at: string;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditInputs, setCreditInputs] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast.error("Access denied: Admin privileges required");
        navigate("/dashboard");
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/dashboard");
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
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
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, approvals, and credits
            </p>
          </div>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Approve new users and manage their credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
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
                        {user.approval_status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateApprovalStatus(user.id, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateApprovalStatus(user.id, "rejected")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
