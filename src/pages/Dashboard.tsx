import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, LogOut, Key, Shield, MessageSquare, HelpCircle, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeysList } from "@/components/KeysList";
import { CreateKeyDialog } from "@/components/CreateKeyDialog";
import { DeviceAuthPanel } from "@/components/DeviceAuthPanel";
import { PrivateMessages } from "@/components/PrivateMessages";
import { ProfileSettings } from "@/components/ProfileSettings";
import { ParticleEffect } from "@/components/ParticleEffect";
import { ElectricBackground } from "@/components/ElectricBackground";
import { WeeklyRewardWheel } from "@/components/WeeklyRewardWheel";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { DeviceTracker } from "@/components/DeviceTracker";
import { SonicLoadingScreen } from "@/components/SonicLoadingScreen";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";
import { AnimatePresence } from "framer-motion";

interface Profile {
  id: string;
  username: string;
  approval_status: string;
  credits: number;
  ban_until: string | null;
  ban_message: string | null;
  last_username_change?: string;
  theme_colors?: {
    primary?: string;
    accent?: string;
  };
  background_color?: string;
  lightning_color?: string;
  segment_color?: string;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [refreshKeysTrigger, setRefreshKeysTrigger] = useState(0);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [audioData, setAudioData] = useState<Uint8Array | undefined>(undefined);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleKeyCreated = () => {
    checkUser();
    setRefreshKeysTrigger(prev => prev + 1);
  };

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

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;
      
      // Apply saved theme colors if they exist
      const themeColors = profileData.theme_colors as any;
      if (themeColors) {
        if (themeColors.primary) {
          document.documentElement.style.setProperty('--primary', themeColors.primary);
        }
        if (themeColors.accent) {
          document.documentElement.style.setProperty('--accent', themeColors.accent);
        }
      }
      
      // Apply saved background color
      if (profileData.background_color) {
        document.documentElement.style.setProperty('--background', profileData.background_color);
      }
      
      setProfile(profileData as any);

      // Check user roles first
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["admin", "owner"]);

      const hasOwnerRole = roleData && roleData.some(r => r.role === "owner");
      const hasAdminRole = roleData && roleData.some(r => r.role === "admin");
      
      setIsAdmin(hasAdminRole);
      setIsOwner(hasOwnerRole);

      // Owners bypass device approval
      if (!hasOwnerRole) {
        const getDeviceFingerprint = () => {
          const nav = navigator as any;
          const screen = window.screen;
          
          const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            hardwareConcurrency: nav.hardwareConcurrency || 'unknown',
            deviceMemory: nav.deviceMemory || 'unknown',
          };

          const fingerprintString = JSON.stringify(fingerprint);
          let hash = 0;
          for (let i = 0; i < fingerprintString.length; i++) {
            const char = fingerprintString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
          
          return Math.abs(hash).toString(36);
        };

        const deviceFingerprint = getDeviceFingerprint();
        const { data: deviceSession } = await supabase
          .from('device_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('device_fingerprint', deviceFingerprint)
          .maybeSingle();

        if (deviceSession && !deviceSession.is_approved) {
          await supabase.auth.signOut();
          toast.error("This device needs admin approval. Please wait for authorization.");
          navigate("/auth");
          return;
        }
      }

      if (profileData.approval_status !== "approved" && !hasOwnerRole) {
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

  if (loading || showLoadingScreen) {
    return (
      <AnimatePresence>
        {showLoadingScreen && (
          <SonicLoadingScreen onComplete={() => setShowLoadingScreen(false)} />
        )}
      </AnimatePresence>
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
      <ParticleEffect />
      <ElectricBackground color={profile?.lightning_color} segmentColor={profile?.segment_color} audioData={audioData} />
      <DeviceTracker />
      <BackgroundMusicPlayer onAudioData={setAudioData} />
      <WeeklyRewardWheel
        onRewardClaimed={checkUser} 
        isOpen={isWheelOpen}
        onClose={() => setIsWheelOpen(false)}
      />
      {isUserBanned && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-background/80">
          <Card className="max-w-md mx-4 shadow-2xl border-destructive/50">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              {t("accountSuspended")}
            </CardTitle>
            <CardDescription>
              {t("accountSuspendedUntil")}{" "}
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
        {/* Header with Welcome Message */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 animate-pulse">
            {t("welcome")}
          </h1>
          <p className="text-muted-foreground">
            {t("welcomeBack")}, {profile?.username}
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex justify-center gap-2 flex-wrap mb-6">
          <CreateKeyDialog onKeyCreated={handleKeyCreated} disabled={!!isUserBanned}>
            <Button className="touch-manipulation">
              <Key className="mr-2 h-4 w-4" />
              {t("createKey")}
            </Button>
          </CreateKeyDialog>
          
          {(isOwner || isAdmin) && (
            <Button onClick={() => navigate(isOwner ? "/owner" : "/admin")} variant="outline" className="touch-manipulation">
              <Shield className="mr-2 h-4 w-4" />
              {isOwner ? "Owner" : "Admin"}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="touch-manipulation"
            onClick={() => window.open('https://t.me/yowxios', '_blank')}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            {t("support")}
          </Button>
          
          <Button onClick={handleLogout} variant="outline" className="touch-manipulation">
            <LogOut className="mr-2 h-4 w-4" />
            {t("logout")}
          </Button>
        </div>

        {/* Credits Display */}
        <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/50 max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">{t("credits")}</p>
            <div className="text-4xl font-bold text-primary">{profile?.credits || 0}</div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="keys" className="touch-manipulation">
              <Key className="mr-2 h-4 w-4" />
              {t("keys")}
            </TabsTrigger>
            <TabsTrigger value="devices" className="touch-manipulation">
              <Shield className="mr-2 h-4 w-4" />
              {t("devices")}
            </TabsTrigger>
            <TabsTrigger value="chat" className="touch-manipulation">
              <MessageSquare className="mr-2 h-4 w-4" />
              SonicAi
            </TabsTrigger>
            <TabsTrigger value="profile" className="touch-manipulation">
              <User className="mr-2 h-4 w-4" />
              {t("profile")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4">
            <KeysList key={refreshKeysTrigger} />
          </TabsContent>

          <TabsContent value="devices" className="space-y-4">
            <DeviceAuthPanel />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <PrivateMessages />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            {profile && (
              <ProfileSettings 
                profile={profile} 
                onProfileUpdate={checkUser}
                onOpenWheel={() => setIsWheelOpen(true)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
