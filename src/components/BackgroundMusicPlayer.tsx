import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";

// Declaraciones mínimas para el API de YouTube sin instalar tipos adicionales
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const VIDEO_ID = "sPQW18No8_0"; // Música de fondo (YouTube)

export const BackgroundMusicPlayer = () => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // iOS/Android requieren autoplay silenciado
  const [volume, setVolume] = useState(70);
  const [showControls, setShowControls] = useState(false);

  // Carga del API de YouTube e inicialización del reproductor oculto
  useEffect(() => {
    const createPlayer = () => {
      if (!playerContainerRef.current || playerRef.current || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        height: "0",
        width: "0",
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1, // requerido para autoplay en móviles
          loop: 1,
          playlist: VIDEO_ID,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 0,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            try {
              e.target.mute();
              e.target.setVolume(volume);
              e.target.playVideo();
              setIsReady(true);
              setIsPlaying(true);
              setIsMuted(true);
            } catch (err) {
              console.error("YT onReady error:", err);
            }
          },
          onStateChange: (e: any) => {
            const s = e?.data;
            if (s === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            if (s === window.YT.PlayerState.PAUSED) setIsPlaying(false);
            if (s === window.YT.PlayerState.ENDED) e.target.playVideo();
          },
        },
      });
    };

    // Ya cargado
    if (window.YT?.Player) {
      createPlayer();
      return;
    }

    // Insertar script solo una vez
    const existing = document.getElementById("youtube-iframe-api");
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.id = "youtube-iframe-api";
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => createPlayer();

    return () => {
      // Limpieza al desmontar
      try {
        playerRef.current?.destroy?.();
      } catch {}
    };
  }, [volume]);

  // Sincronizar volumen cuando cambie (si ya hay player)
  useEffect(() => {
    try {
      if (playerRef.current && isReady) {
        playerRef.current.setVolume(volume);
        if (volume > 0 && isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
      }
    } catch {}
  }, [volume, isReady, isMuted]);

  const handleMainButton = () => {
    if (!playerRef.current) return;

    // Primera pulsación: activar sonido y reproducir
    if (isMuted) {
      try {
        playerRef.current.unMute();
        setIsMuted(false);
        playerRef.current.playVideo();
        setIsPlaying(true);
      } catch (e) {
        console.error(e);
      }
      setShowControls(true);
      return;
    }

    // Si no está silenciado, alternar play/pausa
    try {
      const state = playerRef.current.getPlayerState?.();
      if (state === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error(e);
    }

    setShowControls((v) => !v);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    try {
      const state = playerRef.current.getPlayerState?.();
      if (state === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const v = value?.[0] ?? 0;
    setVolume(v);
    try {
      if (playerRef.current) {
        playerRef.current.setVolume(v);
        if (v > 0 && isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Reproductor oculto (necesario para iOS) */}
      <div
        ref={playerContainerRef}
        aria-hidden
        className="absolute -z-10 h-0 w-0 overflow-hidden"
      />

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
          aria-label={isMuted ? "Activar sonido" : isPlaying ? "Pausar música" : "Reproducir música"}
          className="rounded-full shadow-glow hover:scale-105 transition-transform"
        >
          <Music className="h-5 w-5" />
        </Button>

        <AnimatePresence>
          {(showControls || !isMuted) && (
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
                  onClick={toggleMute}
                  className="h-9 w-9"
                  aria-label={isMuted ? "Activar sonido" : "Silenciar"}
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
                  className="w-full"
                  aria-label="Volumen"
                />
              </div>
              {!isReady && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Cargando música…
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
