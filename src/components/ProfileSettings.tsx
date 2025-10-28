import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Palette, Lock, User, Globe, Shield, Copy, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileSettingsProps {
  profile: {
    id: string;
    username: string;
    credits?: number;
    last_username_change?: string;
    theme_colors?: {
      primary?: string;
      accent?: string;
    };
    background_color?: string;
    lightning_color?: string;
    segment_color?: string;
  };
  onProfileUpdate: () => void;
}

export const ProfileSettings = ({ profile, onProfileUpdate }: ProfileSettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [newUsername, setNewUsername] = useState(profile.username);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [primaryColor, setPrimaryColor] = useState(profile.theme_colors?.primary || "263 70% 50%");
  const [accentColor, setAccentColor] = useState(profile.theme_colors?.accent || "263 70% 60%");
  const [backgroundColor, setBackgroundColor] = useState(profile.background_color || "240 10% 3.9%");
  const [lightningColor, setLightningColor] = useState(profile.lightning_color || "200 100% 50%");
  const [segmentColor, setSegmentColor] = useState(profile.segment_color || "200 100% 50%");
  const [canChangeUsername, setCanChangeUsername] = useState(true);
  const [daysUntilUsernameChange, setDaysUntilUsernameChange] = useState(0);
  const [hasMFA, setHasMFA] = useState(false);
  const [showMFADialog, setShowMFADialog] = useState(false);
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [copied, setCopied] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    if (profile.last_username_change) {
      const lastChange = new Date(profile.last_username_change);
      const now = new Date();
      const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = 30 - daysSinceChange;
      
      if (daysRemaining > 0) {
        setCanChangeUsername(false);
        setDaysUntilUsernameChange(daysRemaining);
      }
    }

    // Check if user has MFA enabled
    checkMFAStatus();
  }, [profile.last_username_change]);

  const checkMFAStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        setHasMFA(factors && factors.totp && factors.totp.length > 0);
      }
    } catch (error) {
      console.error("Error checking MFA status:", error);
    }
  };

  const handleEnableAuthenticator = async () => {
    setLoading(true);
    try {
      // First, check if user already has factors and remove them
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      if (existingFactors && existingFactors.totp && existingFactors.totp.length > 0) {
        // Remove existing factors
        for (const factor of existingFactors.totp) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      // Now enroll new factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `SonicAPI-${Date.now()}`
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setSecret(data.totp.secret);
        setShowMFADialog(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to setup authenticator");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      // First create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      });

      if (challengeError) throw challengeError;

      // Then verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: verifyCode
      });

      if (verifyError) throw verifyError;

      toast.success("2FA enabled successfully!");
      setShowMFADialog(false);
      setVerifyCode("");
      setSecret("");
      setFactorId("");
      setHasMFA(true);
      checkMFAStatus();
    } catch (error: any) {
      toast.error(error.message || "Invalid code. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.totp && factors.totp.length > 0) {
        const factor = factors.totp[0];
        const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        
        if (error) throw error;
        
        toast.success("2FA disabled successfully");
        setHasMFA(false);
      }
    } catch (error: any) {
      toast.error("Failed to disable 2FA");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleUsernameChange = async () => {
    if (!canChangeUsername) {
      toast.error(`You can change your username in ${daysUntilUsernameChange} days`);
      return;
    }

    if (newUsername === profile.username) {
      toast.info("Username is the same");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          username: newUsername,
          last_username_change: new Date().toISOString()
        })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Username updated successfully");
      onProfileUpdate();
    } catch (error: any) {
      toast.error("Failed to update username");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Failed to update password");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          theme_colors: {
            primary: primaryColor,
            accent: accentColor
          },
          background_color: backgroundColor,
          lightning_color: lightningColor,
          segment_color: segmentColor
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Apply colors to CSS variables
      document.documentElement.style.setProperty('--primary', primaryColor);
      document.documentElement.style.setProperty('--accent', accentColor);
      document.documentElement.style.setProperty('--background', backgroundColor);

      toast.success("Theme colors updated successfully");
      onProfileUpdate();
    } catch (error: any) {
      toast.error("Failed to update colors");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const hslToHex = (hsl: string): string => {
    const [h, s, l] = hsl.split(' ').map((v, i) => {
      if (i === 0) return parseInt(v);
      return parseInt(v.replace('%', ''));
    });
    
    const hue = h / 360;
    const sat = s / 100;
    const light = l / 100;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
    const p = 2 * light - q;
    
    const r = Math.round(hue2rgb(p, q, hue + 1/3) * 255);
    const g = Math.round(hue2rgb(p, q, hue) * 255);
    const b = Math.round(hue2rgb(p, q, hue - 1/3) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const handleEnableGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
      toast.success("Redirecting to Google for authentication...");
    } catch (error: any) {
      toast.error("Failed to setup Google authentication");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* MFA Setup Dialog - Manual Code Entry Only */}
      <Dialog open={showMFADialog} onOpenChange={setShowMFADialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Google Authenticator</DialogTitle>
            <DialogDescription>
              Enter this code in Google Authenticator app
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="w-full space-y-2">
              <Label className="font-semibold">Secret Code:</Label>
              <div className="flex gap-2">
                <Input 
                  value={secret} 
                  readOnly 
                  className="font-mono text-sm bg-muted"
                />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => copyToClipboard(secret)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                1. Open Google Authenticator app<br/>
                2. Tap "+" to add account<br/>
                3. Select "Enter a setup key"<br/>
                4. Enter account name: SonicAPI<br/>
                5. Paste the secret code above<br/>
                6. Tap "Add"
              </p>
            </div>

            <div className="w-full space-y-2">
              <Label htmlFor="verify-code">Enter 6-digit code from app:</Label>
              <Input
                id="verify-code"
                type="text"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <Button 
              onClick={handleVerifyCode} 
              disabled={loading || verifyCode.length !== 6}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Enable 2FA
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Theme Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t("themeCustomization")}
          </CardTitle>
          <CardDescription>
            {t("customizeColorsDescription")} 
            <span className="ml-2 px-2 py-0.5 rounded font-bold text-sm" style={{ 
              color: 'hsl(200 100% 50%)', 
              textShadow: '0 0 10px hsl(200 100% 50%), 0 0 20px hsl(200 100% 50%)',
              border: '2px solid hsl(200 100% 50%)',
              boxShadow: '0 0 15px hsl(200 100% 50% / 0.5), inset 0 0 15px hsl(200 100% 50% / 0.2)'
            }}>
              Credits: {profile.credits || 0}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">{t("primaryColor")}</Label>
              <Input
                id="primary-color"
                type="color"
                value={hslToHex(primaryColor)}
                onChange={(e) => setPrimaryColor(hexToHsl(e.target.value))}
                className="h-12 cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">HSL: {primaryColor}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent-color">{t("accentColor")}</Label>
              <Input
                id="accent-color"
                type="color"
                value={hslToHex(accentColor)}
                onChange={(e) => setAccentColor(hexToHsl(e.target.value))}
                className="h-12 cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">HSL: {accentColor}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="background-color">{t("backgroundColor")}</Label>
              <Input
                id="background-color"
                type="color"
                value={hslToHex(backgroundColor)}
                onChange={(e) => setBackgroundColor(hexToHsl(e.target.value))}
                className="h-12 cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">HSL: {backgroundColor}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lightning-color">{t("lightningColor")}</Label>
              <Input
                id="lightning-color"
                type="color"
                value={hslToHex(lightningColor)}
                onChange={(e) => setLightningColor(hexToHsl(e.target.value))}
                className="h-12 cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">HSL: {lightningColor}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment-color">{t("segmentColor")}</Label>
              <Input
                id="segment-color"
                type="color"
                value={hslToHex(segmentColor)}
                onChange={(e) => setSegmentColor(hexToHsl(e.target.value))}
                className="h-12 cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">HSL: {segmentColor}</p>
            </div>
          </div>
          <Button onClick={handleColorChange} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("saveColors")}
          </Button>
        </CardContent>
      </Card>

      {/* Username Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("changeUsername")}
          </CardTitle>
          <CardDescription>
            {canChangeUsername 
              ? t("usernameChangeDescription")
              : `${t("usernameChangeWait")} ${daysUntilUsernameChange} ${t("days")}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("newUsername")}</Label>
            <Input
              id="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder={t("enterNewUsername")}
              disabled={!canChangeUsername}
            />
          </div>
          <Button 
            onClick={handleUsernameChange} 
            disabled={loading || !canChangeUsername || newUsername === profile.username}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("updateUsername")}
          </Button>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t("changePassword")}
          </CardTitle>
          <CardDescription>{t("passwordChangeDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("newPassword")}</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("newPassword")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("confirmPassword")}
            />
          </div>
          <Button 
            onClick={handlePasswordChange} 
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("updatePassword")}
          </Button>
        </CardContent>
      </Card>

      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("languagePreference")}
          </CardTitle>
          <CardDescription>{t("selectLanguage")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">{t("language")}</Label>
            <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
              <SelectTrigger id="language">
                <SelectValue placeholder={t("language")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup with Google Authenticator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            Use Google Authenticator app to generate secure codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Google Authenticator</p>
                <p className="text-sm text-muted-foreground">
                  {hasMFA 
                    ? "2FA is enabled on your account" 
                    : "Generate time-based codes for secure login"}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasMFA 
                  ? "bg-success/10 text-success" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {hasMFA ? "Active" : "Inactive"}
              </div>
            </div>
            
            {!hasMFA ? (
              <Button 
                onClick={handleEnableAuthenticator} 
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Setup Google Authenticator
              </Button>
            ) : (
              <Button 
                onClick={handleDisableMFA} 
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disable 2FA
              </Button>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Install Google Authenticator on your phone</li>
              <li>Click "Setup Google Authenticator" button above</li>
              <li>Copy the secret code and add it to your app</li>
              <li>Enter the 6-digit code to verify</li>
              <li>Use codes from the app when logging in</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};