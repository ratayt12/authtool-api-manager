import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SonicLoadingScreenProps {
  onComplete: () => void;
}

export const SonicLoadingScreen = ({ onComplete }: SonicLoadingScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-br from-background via-primary/10 to-accent/10 flex flex-col items-center justify-center"
    >
      {/* Sonic Character Animation */}
      <div className="relative mb-8">
        {/* Electric Circle Background */}
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute inset-0 -m-8"
        >
          <div className="w-32 h-32 rounded-full border-4 border-primary/30 border-t-primary"></div>
        </motion.div>

        {/* Sonic-style running animation with text */}
        <motion.div
          animate={{
            x: [-10, 10, -10],
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 text-8xl font-bold"
        >
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
            S
          </span>
        </motion.div>

        {/* Electric sparks */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: Math.cos((i * Math.PI * 2) / 8) * 60,
              y: Math.sin((i * Math.PI * 2) / 8) * 60,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeOut",
            }}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full"
            style={{
              boxShadow: "0 0 10px hsl(var(--primary))",
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-8"
      >
        SonicMode
      </motion.div>

      {/* Progress bar */}
      <div className="w-64 h-2 bg-card/50 rounded-full overflow-hidden backdrop-blur-sm border border-primary/20">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-primary via-accent to-primary relative"
        >
          {/* Electric trail effect */}
          <motion.div
            animate={{
              x: [-20, 280],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          />
        </motion.div>
      </div>

      {/* Electric floor lines */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden opacity-30">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: -100 }}
            animate={{ x: "100vw" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "linear",
            }}
            className="absolute bottom-0 w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
            style={{ left: `${i * 25}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
};
