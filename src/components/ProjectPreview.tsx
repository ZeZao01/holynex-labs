// Prévia de projeto no padrão "mini apresentação" (17/11/2026): capa parada e, no hover, um vídeo curto
// do site real rolando (mudo, em loop). No celular toca quando o card está na tela. Com reduced-motion o vídeo só toca
// por ação da pessoa (hover ou foco), nunca sozinho.
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface Props {
  poster?: string;
  video?: string;
  alt: string;
  className?: string;
}

export default function ProjectPreview({ poster, video, alt, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const canPlay = !!video;

  // Celular e tablet não têm hover: toca quando pelo menos 60% do card está visível.
  useEffect(() => {
    if (!canPlay || reduce || !ref.current) return;
    if (window.matchMedia("(hover: hover)").matches) return;
    const io = new IntersectionObserver(([e]) => setActive(e.intersectionRatio >= 0.6), { threshold: [0, 0.6] });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [canPlay, reduce]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.play().catch(() => undefined);
    } else {
      v.pause();
    }
  }, [active]);

  const on = () => canPlay && setActive(true);
  const off = () => canPlay && setActive(false);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-muted ${className}`}
      onMouseEnter={on}
      onMouseLeave={off}
      onFocus={on}
      onBlur={off}
    >
      {poster ? (
        <img src={poster} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top" />
      ) : null}
      {canPlay && (
        <video
          ref={videoRef}
          src={active || ready ? video : undefined}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onPlaying={() => setReady(true)}
          className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${active && ready ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
