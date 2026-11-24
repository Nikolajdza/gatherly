"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  style,
  as = "div",
  /** When true, animate on mount instead of waiting for scroll into view (above-the-fold). */
  immediate = false,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "article" | "li";
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const Component = motion[as];
  const visible = { opacity: 1, y: 0 };
  const hidden = reduce ? false : { opacity: 0, y };

  if (immediate || reduce) {
    return (
      <Component
        className={className}
        style={style}
        initial={hidden}
        animate={visible}
        transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      className={className}
      style={style}
      initial={hidden}
      whileInView={visible}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}

export function Stagger({
  children,
  className,
  style,
  immediate = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const show = { transition: { staggerChildren: reduce ? 0 : 0.07 } };
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : "hidden"}
      {...(immediate || reduce
        ? { animate: "show" }
        : { whileInView: "show", viewport: { once: true, amount: 0.2, margin: "0px 0px -40px 0px" } })}
      variants={{ hidden: {}, show }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function Spotlight({
  children,
  className = "",
  style,
  color = "rgba(47, 138, 104, 0.18)",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }
  return (
    <div ref={ref} className={`spotlight ${className}`} style={{ ...style, ["--spot" as string]: color }} onMouseMove={onMove}>
      {children}
    </div>
  );
}

export function Tilt({
  children,
  className,
  style,
  max = 8,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  max?: number;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const sx = useSpring(x, { stiffness: 160, damping: 18 });
  const sy = useSpring(y, { stiffness: 160, damping: 18 });
  const rx = useTransform(sy, [0, 1], [max, -max]);
  const ry = useTransform(sx, [0, 1], [-max, max]);
  return (
    <motion.div
      className={className}
      style={{ ...style, rotateX: reduce ? 0 : rx, rotateY: reduce ? 0 : ry, transformPerspective: 900 }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left) / rect.width);
        y.set((event.clientY - rect.top) / rect.height);
      }}
      onMouseLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
    >
      {children}
    </motion.div>
  );
}

export function Float({
  children,
  className,
  style,
  delay = 0,
  distance = 12,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  distance?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
      animate={reduce ? undefined : { opacity: 1, scale: 1, y: [0, -distance, 0] }}
      transition={{
        opacity: { duration: 0.7, delay },
        scale: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 7, delay, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {children}
    </motion.div>
  );
}

export function NumberTicker({
  value,
  className,
  style,
  suffix = "",
  immediate = false,
}: {
  value: number;
  className?: string;
  style?: CSSProperties;
  suffix?: string;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const shouldRun = immediate || inView || reduce;

  useEffect(() => {
    if (!shouldRun) return;
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setShown(Math.round(latest)),
    });
    return () => controls.stop();
  }, [shouldRun, value, reduce]);

  return (
    <span ref={ref} className={className} style={style}>
      {shown}
      {suffix}
    </span>
  );
}

export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div className={`aurora ${className}`} aria-hidden>
      <span className="aurora-blob a" />
      <span className="aurora-blob b" />
      <span className="aurora-blob c" />
      <span className="aurora-grid" />
      <span className="aurora-grain" />
    </div>
  );
}
