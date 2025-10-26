import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Palette, Lock, User } from "lucide-react";

interface ProfileSettingsProps {
  profile: {
    id: string;
    username: string;
    last_username_change?: string;
    theme_colors?: {
      primary?: string;
      accent?: string;
    };
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
  const [canChangeUsername, setCanChangeUsername] = useState(true);
  const [daysUntilUsernameChange, setDaysUntilUsernameChange] = useState(0);

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
  }, [profile.last_username_change]);

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
          }
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Apply colors to CSS variables
      document.documentElement.style.setProperty('--primary', primaryColor);
      document.documentElement.style.setProperty('--accent', accentColor);

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

  return (
    <div className="space-y-6">
      {/* Theme Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Customization
          </CardTitle>
          <CardDescription>Customize your UI and website colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
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
              <Label htmlFor="accent-color">Accent Color</Label>
              <Input
                id="accent-color"
                type="color"
                value={hslToHex(accentColor)}
                onChange={(e) => setAccentColor(hexToHsl(e.target.value))}
                className="h-12 cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">HSL: {accentColor}</p>
            </div>
          </div>
          <Button onClick={handleColorChange} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Colors
          </Button>
        </CardContent>
      </Card>

      {/* Username Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Change Username
          </CardTitle>
          <CardDescription>
            {canChangeUsername 
              ? "You can change your username once every 30 days"
              : `You can change your username in ${daysUntilUsernameChange} days`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">New Username</Label>
            <Input
              id="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
              disabled={!canChangeUsername}
            />
          </div>
          <Button 
            onClick={handleUsernameChange} 
            disabled={loading || !canChangeUsername || newUsername === profile.username}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Username
          </Button>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password anytime</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button 
            onClick={handlePasswordChange} 
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};