import React, { useEffect, useRef } from 'react';

export const AuroraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement || document.body);
    resize();

    const render = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawBlob = (x: number, y: number, radius: number, color: string) => {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      };

      // Aurora blobs
      const x1 = canvas.width * (0.5 + 0.35 * Math.sin(time * 0.6));
      const y1 = canvas.height * (0.4 + 0.25 * Math.cos(time * 0.4));
      drawBlob(x1, y1, canvas.width * 0.7, 'rgba(217, 70, 239, 0.15)'); // Vibrant Fuchsia

      const x2 = canvas.width * (0.2 + 0.25 * Math.cos(time * 0.3));
      const y2 = canvas.height * (0.7 + 0.2 * Math.sin(time * 0.5));
      drawBlob(x2, y2, canvas.width * 0.6, 'rgba(34, 211, 238, 0.12)'); // Electric Cyan

      const x3 = canvas.width * (0.8 + 0.2 * Math.sin(time * 0.4));
      const y3 = canvas.height * (0.3 + 0.3 * Math.cos(time * 0.7));
      drawBlob(x3, y3, canvas.width * 0.5, 'rgba(189, 0, 255, 0.1)'); // Aurora Purple

      const x4 = canvas.width * (0.5 + 0.4 * Math.cos(time * 0.2));
      const y4 = canvas.height * (0.5 + 0.4 * Math.sin(time * 0.3));
      drawBlob(x4, y4, canvas.width * 0.8, 'rgba(0, 255, 159, 0.05)'); // Aurora Green

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -z-10 pointer-events-none"
      style={{ filter: 'blur(100px)' }}
    />
  );
};
