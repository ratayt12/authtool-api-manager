import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, LogOut, Plus, Key, Shield, Coins } from "lucide-react";
import { KeysList } from "@/components/KeysList";
import { CreateKeyDialog } from "@/components/CreateKeyDialog";
import { SupportChat } from "@/components/SupportChat";

interface Profile {
  id: string;
  username: string;
  approval_status: string;
  credits: number;
  ban_until: string | null;
  ban_message: string | null;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      // Check if user is admin or owner
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["admin", "owner"]);

      if (roleData && roleData.length > 0) {
        const roles = roleData.map(r => r.role);
        setIsAdmin(roles.includes("admin"));
        setIsOwner(roles.includes("owner"));
      }

      if (profileData.approval_status !== "approved") {
        toast.info("Your account is pending admin approval");
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Logged out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isUserBanned = profile?.ban_until && new Date(profile.ban_until) > new Date();

  if (profile?.approval_status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-warning" />
              Account Pending Approval
            </CardTitle>
            <CardDescription>
              Your account is waiting for admin approval. You'll be able to access the dashboard once approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 relative">
      {/* Ban Overlay */}
      {isUserBanned && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-background/80">
          <Card className="max-w-md mx-4 shadow-2xl border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                Account Suspended
              </CardTitle>
              <CardDescription>
                Your account has been temporarily suspended until{" "}
                {new Date(profile.ban_until!).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {profile.ban_message || "You have been banned from using this service."}
                </p>
              </div>
              <Button onClick={handleLogout} variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="container mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Sonic Reseller Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {profile?.username}
            </p>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <Button onClick={() => navigate("/owner")} variant="default">
                <Shield className="mr-2 h-4 w-4" />
                Owner Panel
              </Button>
            )}
            {isAdmin && (
              <Button onClick={() => navigate("/admin")} variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            )}
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Credits
              </CardTitle>
              <Coins className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{profile?.credits || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Each key creation costs 1 credit
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quick Actions
              </CardTitle>
              <Key className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <CreateKeyDialog onKeyCreated={checkUser} disabled={!!isUserBanned}>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={!!isUserBanned}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Key
                </Button>
              </CreateKeyDialog>
            </CardContent>
          </Card>
        </div>

        {/* Keys List */}
        <KeysList />
      </div>
    </div>
  );
};

export default Dashboard;
