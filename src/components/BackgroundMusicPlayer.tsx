import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";

export const BackgroundMusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showStartButton, setShowStartButton] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (isMuted ? 0 : volume) / 100;
    }
  }, [volume, isMuted]);

  const handleStartMusic = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setShowStartButton(false);
        setIsReady(true);
      }).catch(error => {
        console.error("Error playing audio:", error);
      });
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0) {
      setIsMuted(false);
    }
  };

  return (
    <>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        <source src="https://www.youtube.com/watch?v=sPQW18No8_0" type="audio/mpeg" />
      </audio>

      {/* Start Music Button Overlay */}
      <AnimatePresence>
        {showStartButton && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={handleStartMusic}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow"
              >
                <Music className="h-12 w-12 text-white" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Activar Música de Fondo
                </h3>
                <p className="text-muted-foreground">Toca para comenzar</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Music Controls */}
      {isReady && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg transition-all duration-300 hover:shadow-glow"
          onMouseEnter={() => setShowControls(true)}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="h-10 w-10 rounded-full hover:bg-primary/20"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <div className={`flex items-center gap-2 transition-all duration-300 ${showControls ? 'opacity-100 w-32' : 'opacity-0 w-0 overflow-hidden'}`}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-20"
              />
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};
