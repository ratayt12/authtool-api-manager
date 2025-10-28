import { useEffect, useRef } from "react";

interface ElectricBackgroundProps {
  color?: string; // HSL format: "200 100% 50%"
}

export const ElectricBackground = ({ color = "200 100% 50%" }: ElectricBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const lightnings: Lightning[] = [];
    let lastSpawn = 0;

    // Animation loop
    const animate = (timestamp: number) => {
      if (!ctx) return;

      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn new lightning
      if (timestamp - lastSpawn > 2000 + Math.random() * 3000) {
        lightnings.push(new Lightning());
        lastSpawn = timestamp;
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
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen", opacity: 0.3 }}
    />
  );
};
