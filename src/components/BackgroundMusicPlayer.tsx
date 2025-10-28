import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import backgroundMusic from "@/assets/background-music.mp3";

export const BackgroundMusicPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;

    // Configurar audio
    audioRef.current.volume = volume / 100;
    audioRef.current.loop = true;

    // Intentar autoplay (puede fallar en iOS hasta que el usuario interactúe)
    const playAudio = async () => {
      try {
        await audioRef.current?.play();
        setIsPlaying(true);
      } catch (err) {
        console.log("Autoplay bloqueado, esperando interacción del usuario");
      }
    };

    playAudio();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleMainButton = async () => {
    if (!audioRef.current) return;

    if (!isPlaying) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error(e);
      }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setShowControls((v) => !v);
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const v = value?.[0] ?? 0;
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v / 100;
    }
  };

  return (
    <>
      {/* Audio element */}
      <audio ref={audioRef} src={backgroundMusic} preload="auto" />

      {/* Botón flotante y panel de control */}
      <div
        className="fixed bottom-6 right-6 z-50"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <Button
          variant="secondary"
          size="icon"
          onClick={handleMainButton}
          aria-label={isPlaying ? "Pausar música" : "Reproducir música"}
          className="rounded-full shadow-glow hover:scale-105 transition-transform"
        >
          <Music className="h-5 w-5" />
        </Button>

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-3 w-[220px] rounded-xl border border-border bg-card/95 p-3 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="h-9 w-9 rounded-full"
                  aria-label={isPlaying ? "Pausar" : "Reproducir"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.muted = !audioRef.current.muted;
                    }
                  }}
                  className="h-9 w-9"
                  aria-label={volume === 0 ? "Activar sonido" : "Silenciar"}
                >
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                  aria-label="Volumen"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
