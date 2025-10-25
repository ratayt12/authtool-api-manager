import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Download, Smartphone, Upload, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MobileConfigGenerator = () => {
  const navigate = useNavigate();
  const [appName, setAppName] = useState("Sonic Reseller");
  const [appUrl, setAppUrl] = useState(window.location.origin);
  const [organization, setOrganization] = useState("Sonic");
  const [fileName, setFileName] = useState("sonic-reseller");
  const [description, setDescription] = useState("Install Sonic Reseller on your iOS device");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>("");

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit
        toast.error("Icon file size must be less than 500KB");
        return;
      }
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateMobileConfig = () => {
    if (!appName || !appUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    const uuid = crypto.randomUUID();
    const payloadUUID = crypto.randomUUID();
    
    const icon = iconPreview ? iconPreview.split(',')[1] : '';

    const mobileConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>Icon</key>
            <data>${icon}</data>
            <key>IgnoreManifestScope</key>
            <false/>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>${appName}</string>
            <key>PayloadDescription</key>
            <string>${description}</string>
            <key>PayloadDisplayName</key>
            <string>${appName}</string>
            <key>PayloadIdentifier</key>
            <string>com.sonic.webclip.${payloadUUID}</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>${payloadUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${appUrl}</string>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>${description}</string>
    <key>PayloadDisplayName</key>
    <string>${appName}</string>
    <key>PayloadIdentifier</key>
    <string>com.sonic.${uuid}</string>
    <key>PayloadOrganization</key>
    <string>${organization}</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${uuid}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

    const blob = new Blob([mobileConfig], { type: 'application/x-apple-aspen-config' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.mobileconfig`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Mobile config generated! Check your downloads.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              WebClip Generator
            </h1>
            <p className="text-sm text-muted-foreground">Create iOS configuration profile</p>
          </div>
        </div>

        <Card className="shadow-xl border-border/50 bg-card/95 backdrop-blur">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <Smartphone className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-center">Create WebClip</CardTitle>
            <CardDescription className="text-center">
              Generate a mobile configuration profile for iOS 7.0+ and macOS 10.15+
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Icon Upload */}
            <div className="space-y-2">
              <Label htmlFor="icon" className="text-base">App Icon</Label>
              <div className="flex items-center gap-4">
                {iconPreview ? (
                  <img
                    src={iconPreview}
                    alt="Icon preview"
                    className="w-20 h-20 rounded-xl border-2 border-primary shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="icon"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleIconUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG or JPG, max 500KB
                  </p>
                </div>
              </div>
            </div>

            {/* App Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">App Name *</Label>
              <Input
                id="name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="My App"
                className="text-base"
                required
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url" className="text-base">URL *</Label>
              <Input
                id="url"
                type="url"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder="https://example.com"
                className="text-base"
                required
              />
            </div>

            {/* Organization */}
            <div className="space-y-2">
              <Label htmlFor="org" className="text-base">Organization</Label>
              <Input
                id="org"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="My Organization"
                className="text-base"
              />
            </div>

            {/* File Name */}
            <div className="space-y-2">
              <Label htmlFor="filename" className="text-base">Install File Name</Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="install-file"
                className="text-base"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-base">Install Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please install this app on your device"
                className="text-base min-h-[100px]"
                rows={3}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateMobileConfig}
              className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Generate & Download
            </Button>

            {/* Install Guide */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2 border border-border/50">
              <h4 className="font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Installation Guide
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Download the .mobileconfig file</li>
                <li>Open Settings on your iOS device</li>
                <li>Tap "Profile Downloaded" or "General → VPN & Device Management"</li>
                <li>Select the profile and tap "Install"</li>
                <li>Enter your device passcode</li>
                <li>Tap "Install" to confirm</li>
                <li>Find the app icon on your home screen</li>
              </ol>
            </div>

            {/* Info Box */}
            <div className="bg-primary/10 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium text-primary">About WebClips</p>
              <p className="text-muted-foreground">
                WebClips create app-like shortcuts on your iOS device. When opened in full-screen mode,
                they appear as standalone apps without browser UI. Valid for 24 hours after generation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileConfigGenerator;
