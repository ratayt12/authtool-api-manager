import { useEffect, useRef } from "react";

interface ElectricBackgroundProps {
  color?: string; // HSL format: "200 100% 50%"
  segmentColor?: string; // HSL format: "200 100% 50%"
  audioData?: Uint8Array;
}

export const ElectricBackground = ({ color = "200 100% 50%", segmentColor = "200 100% 50%", audioData }: ElectricBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastBeatRef = useRef<number>(0);
  
  // Calcular intensidad del audio
  const getAudioIntensity = () => {
    if (!audioData) return 0;
    const bass = Array.from(audioData.slice(0, 20));
    const average = bass.reduce((a, b) => a + b, 0) / bass.length;
    return average / 255; // Normalizar entre 0 y 1
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Lightning bolt class
    class Lightning {
      x: number;
      y: number;
      targetY: number;
      segments: { x: number; y: number }[];
      alpha: number;
      fadeSpeed: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = 0;
        this.targetY = canvas.height;
        this.segments = [];
        this.alpha = 1;
        this.fadeSpeed = 0.02;
        this.generateSegments();
      }

      generateSegments() {
        let currentX = this.x;
        let currentY = this.y;
        
        while (currentY < this.targetY) {
          this.segments.push({ x: currentX, y: currentY });
          currentX += (Math.random() - 0.5) * 100;
          currentY += Math.random() * 50 + 20;
        }
        this.segments.push({ x: currentX, y: this.targetY });
      }

      draw() {
        if (!ctx) return;

        ctx.save();
        ctx.strokeStyle = `hsla(${color} / ${this.alpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = `hsl(${color})`;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        
        for (let i = 1; i < this.segments.length; i++) {
          ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }
        
        ctx.stroke();

        // Add glow effect
        ctx.strokeStyle = `hsla(${color} / ${this.alpha * 0.4})`;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 25;
        ctx.stroke();

        ctx.restore();
      }

      update() {
        this.alpha -= this.fadeSpeed;
        return this.alpha > 0;
      }
    }

    // Electric segments class
    class ElectricSegment {
      x: number;
      y: number;
      length: number;
      angle: number;
      speed: number;
      alpha: number;
      pulseSpeed: number;
      pulsePhase: number;

      baseSpeed: number;
      baseAlpha: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.length = Math.random() * 100 + 50;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.5 + 0.2;
        this.baseSpeed = this.speed;
        this.alpha = Math.random() * 0.5 + 0.3;
        this.baseAlpha = this.alpha;
        this.pulseSpeed = Math.random() * 0.05 + 0.02;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      draw(timestamp: number, audioIntensity: number) {
        if (!ctx) return;

        const pulse = Math.sin(timestamp * this.pulseSpeed + this.pulsePhase) * 0.3 + 0.7;
        const intensityBoost = 1 + (audioIntensity * 1.5);
        const currentAlpha = this.alpha * pulse * intensityBoost;
        const lineWidth = 3 * (1 + audioIntensity * 0.8);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Main segment
        ctx.strokeStyle = `hsla(${segmentColor} / ${Math.min(currentAlpha, 1)})`;
        ctx.lineWidth = lineWidth;
        ctx.shadowColor = `hsl(${segmentColor})`;
        ctx.shadowBlur = 20 * intensityBoost;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.length, 0);
        ctx.stroke();

        // Glow effect - más intenso en beats
        ctx.strokeStyle = `hsla(${segmentColor} / ${Math.min(currentAlpha * 0.5, 0.8)})`;
        ctx.lineWidth = lineWidth * 2;
        ctx.shadowBlur = 30 * intensityBoost;
        ctx.stroke();

        ctx.restore();
      }

      update(audioIntensity: number) {
        // Aumentar velocidad y alpha basado en la intensidad del audio
        this.speed = this.baseSpeed * (1 + audioIntensity * 2);
        this.alpha = this.baseAlpha * (1 + audioIntensity * 0.5);
        
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Wrap around screen
        if (this.x < -this.length) this.x = canvas.width + this.length;
        if (this.x > canvas.width + this.length) this.x = -this.length;
        if (this.y < -this.length) this.y = canvas.height + this.length;
        if (this.y > canvas.height + this.length) this.y = -this.length;
      }
    }

    const lightnings: Lightning[] = [];
    const segments: ElectricSegment[] = [];
    let lastSpawn = 0;

    // Initialize segments
    for (let i = 0; i < 15; i++) {
      segments.push(new ElectricSegment());
    }

    // Animation loop
    const animate = (timestamp: number) => {
      if (!ctx) return;

      const intensity = getAudioIntensity();
      const isBeat = intensity > 0.7;

      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn new lightning basado en el beat
      const spawnInterval = isBeat ? 100 : 2000 + Math.random() * 3000;
      if (timestamp - lastSpawn > spawnInterval) {
        lightnings.push(new Lightning());
        lastSpawn = timestamp;
        
        // En beats fuertes, agregar múltiples rayos
        if (isBeat && timestamp - lastBeatRef.current > 200) {
          lightnings.push(new Lightning());
          lightnings.push(new Lightning());
          lastBeatRef.current = timestamp;
        }
      }

      // Update and draw segments con intensidad basada en audio
      segments.forEach(segment => {
        segment.draw(timestamp * (1 + intensity * 2), intensity);
        segment.update(intensity);
      });

      // En beats muy fuertes, agregar segmentos temporales
      if (isBeat && segments.length < 25) {
        segments.push(new ElectricSegment());
        segments.push(new ElectricSegment());
      }

      // Eliminar segmentos extra cuando la intensidad baja
      if (!isBeat && segments.length > 15) {
        segments.splice(15, segments.length - 15);
      }

      // Update and draw lightnings
      for (let i = lightnings.length - 1; i >= 0; i--) {
        const lightning = lightnings[i];
        lightning.draw();
        if (!lightning.update()) {
          lightnings.splice(i, 1);
        }
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", setCanvasSize);
    };
  }, [color, segmentColor, audioData]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen", opacity: 0.3 }}
    />
  );
};
