import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Coins, Download } from "lucide-react";
import { SonicLoadingScreen } from "@/components/SonicLoadingScreen";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();
  const [showLoading, setShowLoading] = useState(true);

  if (showLoading) {
    return <SonicLoadingScreen onComplete={() => setShowLoading(false)} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated electric background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/5">
        {/* Moving segments/particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.2
            }}
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight
              ],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
            className="absolute w-2 h-2 bg-primary rounded-full"
            style={{
              boxShadow: "0 0 20px hsl(var(--primary))",
              filter: "blur(1px)",
            }}
          />
        ))}

        {/* Electric lines */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            initial={{ x: -200 }}
            animate={{ x: "100vw" }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.3,
            }}
            className="absolute h-px bg-gradient-to-r from-transparent via-primary to-transparent"
            style={{
              top: `${20 + i * 15}%`,
              width: "200px",
              boxShadow: "0 0 10px hsl(var(--primary))",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: "200% 200%",
            }}
          >
            Sonic Api
          </motion.h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Sistema profesional de gestión de llaves API con seguridad empresarial y sistema de créditos
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-12 w-full max-w-4xl"
        >
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Acceso Seguro</CardTitle>
              </div>
              <CardDescription className="text-base">
                Sistema de autenticación con verificación de dispositivos y 2FA. Control total sobre quién accede a tus APIs.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-accent/20 bg-card/50 backdrop-blur-sm hover:border-accent/40 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Coins className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-2xl">Sistema de Créditos</CardTitle>
              </div>
              <CardDescription className="text-base">
                Gestiona créditos por llave con límites configurables. Recompensas semanales y sistema de recarga automática.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
        >
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="flex-1 h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
          >
            Comenzar
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            variant="outline"
            className="flex-1 h-14 text-lg border-primary/30 hover:bg-primary/5"
          >
            Iniciar Sesión
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6"
        >
          <Button
            onClick={() => navigate("/download-ios")}
            size="lg"
            variant="ghost"
            className="text-base text-muted-foreground hover:text-primary"
          >
            <Download className="mr-2 h-5 w-5" />
            iOS Config
          </Button>
        </motion.div>
      </div>

      {/* Bottom electric effect */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`bottom-${i}`}
            initial={{ x: -100 }}
            animate={{ x: "100vw" }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.2,
            }}
            className="absolute bottom-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
            style={{
              left: `${i * 15}%`,
              width: "150px",
              boxShadow: "0 0 15px hsl(var(--primary))",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Index;
