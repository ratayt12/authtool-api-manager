import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";
import { toast } from "sonner";

const DownloadConfig = () => {
  const handleDownload = () => {
    const appName = "Sonic Api";
    const appUrl = window.location.origin;
    const organization = "Sonic";
    const fileName = "sonic-api";
    const description = "Install Sonic Api on your iOS device";
    
    const uuid = crypto.randomUUID();
    const payloadUUID = crypto.randomUUID();

    const mobileConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
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

    toast.success("iOS config downloaded! Check your downloads.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-border/50 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Smartphone className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-center">iOS Configuration</CardTitle>
          <CardDescription className="text-center">
            Download and install the mobile configuration profile for iOS devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-4 space-y-2 border border-border/50">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Installation Steps
            </h4>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Tap the download button below</li>
              <li>Open Settings on your iOS device</li>
              <li>Tap "Profile Downloaded" or "General → VPN & Device Management"</li>
              <li>Select the profile and tap "Install"</li>
              <li>Enter your device passcode</li>
              <li>Tap "Install" to confirm</li>
              <li>Find the app icon on your home screen</li>
            </ol>
          </div>
          
          <Button 
            onClick={handleDownload}
            className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
          >
            <Download className="mr-2 h-4 w-4" />
            Download iOS Config
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This profile adds Sonic Api to your home screen with app-like functionality
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadConfig;
