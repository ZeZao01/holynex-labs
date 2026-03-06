import { useEffect, useRef } from "react";

interface Column {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  fontSize: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let columns: Column[] = [];
    const fontSize = 14;
    const tokens = ["0", "0", "0", "1", "1", "1"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initColumns();
    };

    const initColumns = () => {
      const colCount = Math.floor(canvas.width / fontSize);
      columns = [];
      for (let i = 0; i < colCount; i++) {
        columns.push({
          x: i * fontSize,
          y: Math.random() * canvas.height * -1,
          speed: 1 + Math.random() * 3,
          chars: Array.from({ length: 20 + Math.floor(Math.random() * 20) }, () =>
            tokens[Math.floor(Math.random() * tokens.length)]
          ),
          fontSize,
        });
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      ctx.fillStyle = "rgba(3, 5, 8, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const col of columns) {
        for (let j = 0; j < col.chars.length; j++) {
          const charY = col.y + j * col.fontSize;
          if (charY < -col.fontSize || charY > canvas.height + col.fontSize) continue;

          const distFromHead = col.chars.length - 1 - j;
          if (distFromHead === 0) {
            ctx.fillStyle = "rgba(180, 255, 180, 0.9)";
          } else if (distFromHead < 3) {
            ctx.fillStyle = `rgba(130, 80, 255, ${0.7 - distFromHead * 0.1})`;
          } else {
            const alpha = Math.max(0.03, 0.35 - distFromHead * 0.015);
            ctx.fillStyle = `rgba(130, 80, 255, ${alpha})`;
          }

          ctx.font = `${col.fontSize}px monospace`;
          ctx.fillText(col.chars[j], col.x, charY);

          // Randomly mutate characters
          if (Math.random() < 0.02) {
            col.chars[j] = tokens[Math.floor(Math.random() * tokens.length)];
          }
        }

        col.y += col.speed;
        if (col.y > canvas.height + col.chars.length * col.fontSize) {
          col.y = -col.chars.length * col.fontSize;
          col.speed = 1 + Math.random() * 3;
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
