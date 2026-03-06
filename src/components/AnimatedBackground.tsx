import { useEffect, useRef } from "react";

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  alpha: number;
}

interface Particle {
  x: number;
  y: number;
  speed: number;
  char: string;
  alpha: number;
  size: number;
  fadeSpeed: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const orbs: Orb[] = [];
    const particles: Particle[] = [];
    const orbCount = 4;
    const particleCount = 80;
    const tokens = ["0", "0", "0", "1", "1", "1"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create nebula orbs
    for (let i = 0; i < orbCount; i++) {
      orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 180 + Math.random() * 280,
        hue: 250 + Math.random() * 40,
        alpha: 0.04 + Math.random() * 0.04,
      });
    }

    // Create binary particles
    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.2 + Math.random() * 0.6,
      char: tokens[Math.floor(Math.random() * tokens.length)],
      alpha: Math.random() * 0.4,
      size: 10 + Math.random() * 6,
      fadeSpeed: 0.002 + Math.random() * 0.005,
    });

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    const render = () => {
      ctx.fillStyle = "rgba(3, 5, 8, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw nebula orbs
      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < -orb.radius) orb.x = canvas.width + orb.radius;
        if (orb.x > canvas.width + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = canvas.height + orb.radius;
        if (orb.y > canvas.height + orb.radius) orb.y = -orb.radius;

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        gradient.addColorStop(0, `hsla(${orb.hue}, 90%, 65%, ${orb.alpha})`);
        gradient.addColorStop(0.4, `hsla(${orb.hue}, 80%, 50%, ${orb.alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${orb.hue}, 70%, 40%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw binary particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speed;
        p.alpha += p.fadeSpeed;

        // Pulse alpha
        if (p.alpha > 0.5) p.fadeSpeed = -Math.abs(p.fadeSpeed);
        if (p.alpha < 0.02) {
          particles[i] = createParticle();
          particles[i].y = canvas.height + 10;
          particles[i].alpha = 0.02;
          continue;
        }

        ctx.font = `${p.size}px monospace`;
        ctx.fillStyle = `hsla(262, 80%, 70%, ${p.alpha})`;
        ctx.fillText(p.char, p.x, p.y);

        // Randomly mutate
        if (Math.random() < 0.01) {
          p.char = tokens[Math.floor(Math.random() * tokens.length)];
        }

        // Reset if off screen
        if (p.y < -20) {
          particles[i] = createParticle();
          particles[i].y = canvas.height + 10;
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
      style={{ opacity: 0.7 }}
    />
  );
}
