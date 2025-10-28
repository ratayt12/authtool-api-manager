import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import backgroundMusic from "@/assets/background-music.mp3";

interface BackgroundMusicPlayerProps {
  onAudioData?: (data: Uint8Array) => void;
}

export const BackgroundMusicPlayer = ({ onAudioData }: BackgroundMusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;

    // Configurar audio
    audioRef.current.volume = volume / 100;
    audioRef.current.loop = true;

    // Setup audio context para análisis de frecuencias
    const setupAudioContext = () => {
      if (!audioRef.current || audioContextRef.current) return;
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      // Start analyzing audio
      const analyzeAudio = () => {
        if (analyserRef.current && dataArrayRef.current && onAudioData) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
          onAudioData(dataArrayRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      };
      analyzeAudio();
    };

    // Intentar autoplay (puede fallar en iOS hasta que el usuario interactúe)
    const playAudio = async () => {
      try {
        await audioRef.current?.play();
        setIsPlaying(true);
        setupAudioContext();
      } catch (err) {
        console.log("Autoplay bloqueado, esperando interacción del usuario");
      }
    };

    playAudio();

    // En iOS, intentar reproducir con cualquier interacción del usuario
    const handleFirstInteraction = async () => {
      if (!isPlaying && audioRef.current) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          setupAudioContext();
          // Remover listeners después de la primera reproducción exitosa
          document.removeEventListener('touchstart', handleFirstInteraction);
          document.removeEventListener('click', handleFirstInteraction);
        } catch (err) {
          console.log("No se pudo reproducir");
        }
      }
    };

    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('click', handleFirstInteraction, { once: true });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onAudioData]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleMainButton = async () => {
    // Solo toggle el panel de controles, no afecta la reproducción
    setShowControls((v) => !v);
    
    // Si la música no está sonando, intentar reproducir
    if (!isPlaying && audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        
        // Setup audio context si no existe
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          
          const source = audioContextRef.current.createMediaElementSource(audioRef.current);
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
          
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
          
          const analyzeAudio = () => {
            if (analyserRef.current && dataArrayRef.current && onAudioData) {
              analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
              onAudioData(dataArrayRef.current);
            }
            animationFrameRef.current = requestAnimationFrame(analyzeAudio);
          };
          analyzeAudio();
        }
      } catch (e) {
        console.error(e);
      }
    }
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
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleMainButton}
          aria-label="Control de música"
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
