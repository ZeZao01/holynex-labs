import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface RevealBoxProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}

const directions = {
  up: { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 } },
};

export default function RevealBox({ children, className = "", delay = 0, direction = "up" }: RevealBoxProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={directions[direction].hidden}
      whileInView={directions[direction].visible}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay,
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}
