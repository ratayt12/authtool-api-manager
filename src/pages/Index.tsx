import { KeyRound, Shield, Coins, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl animate-pulse">
              <KeyRound className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
            Sonic Api
          </h1>
          <p className="text-xl text-muted-foreground">
            Professional key management system with secure access control
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-xl border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Secure Access
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Admin-approved registration ensures only authorized users can access the system
            </CardContent>
          </Card>

          <Card className="shadow-xl border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-accent" />
                Credit System
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Fair usage with credit-based key generation. Each key costs 1 credit
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/auth'}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            Get Started
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => window.location.href = '/auth'}
          >
            Sign In
          </Button>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.location.href = '/install'}
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Instalar App
          </Button>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.location.href = '/download-ios'}
          >
            <Smartphone className="mr-2 h-4 w-4" />
            iOS Config
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
