import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Apple, Chrome } from "lucide-react";
import { toast } from "sonner";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.error("Install prompt not available");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success("App installed successfully!");
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Download className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
            Instala la App Sonic Api
          </CardTitle>
          <CardDescription className="text-base">
            Instala nuestra app en tu dispositivo para una experiencia completa
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-green-500/20">
                  <Check className="h-16 w-16 text-green-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-green-500">¡App Instalada!</h3>
              <p className="text-muted-foreground">
                La app ya está instalada en tu dispositivo
              </p>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Ir al Dashboard
              </Button>
            </div>
          ) : (
            <>
              {isInstallable && !isIOS && (
                <div className="space-y-4">
                  <Button
                    onClick={handleInstallClick}
                    size="lg"
                    className="w-full h-16 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
                  >
                    <Download className="mr-2 h-6 w-6" />
                    Instalar App Ahora
                  </Button>
                </div>
              )}

              {isIOS && (
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Apple className="h-6 w-6 text-primary mt-1" />
                      <div className="space-y-2">
                        <h4 className="font-semibold">Instalación en iPhone/iPad</h4>
                        <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                          <li>Toca el botón de "Compartir" <span className="inline-block">📤</span></li>
                          <li>Desplázate y selecciona "Añadir a pantalla de inicio"</li>
                          <li>Toca "Añadir" en la esquina superior derecha</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isAndroid && !isInstallable && (
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Chrome className="h-6 w-6 text-primary mt-1" />
                      <div className="space-y-2">
                        <h4 className="font-semibold">Instalación en Android</h4>
                        <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                          <li>Abre el menú de Chrome (⋮)</li>
                          <li>Selecciona "Instalar app" o "Añadir a pantalla de inicio"</li>
                          <li>Toca "Instalar"</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 pt-4">
                <Card className="border-border/50 bg-muted/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Smartphone className="h-5 w-5 text-primary" />
                      Características
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Funciona sin conexión</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Acceso rápido desde pantalla de inicio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Experiencia de app nativa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Actualizaciones automáticas</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button
                  onClick={() => window.location.href = '/auth'}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  Continuar sin Instalar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;