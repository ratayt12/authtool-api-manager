import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";

const DownloadConfig = () => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/sonic-reseller.mobileconfig';
    link.download = 'sonic-reseller.mobileconfig';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-border/50">
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
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">Installation Steps:</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Tap the download button below</li>
              <li>Open Settings on your iOS device</li>
              <li>Tap "Profile Downloaded"</li>
              <li>Tap "Install" in the top right</li>
              <li>Enter your passcode if prompted</li>
              <li>Tap "Install" twice more to confirm</li>
            </ol>
          </div>
          
          <Button 
            onClick={handleDownload}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Download className="mr-2 h-4 w-4" />
            Download iOS Config
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This profile adds Sonic Reseller to your home screen with app-like functionality
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadConfig;
