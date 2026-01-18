import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SecurityAnimationProps = {
  open: boolean;
  onComplete: () => void;
  durationMs?: number;
  className?: string;
};

function playPulseBeep() {
  // Tiny, dependency-free pulse sound using WebAudio.
  // Safe: no user data, no persistence. If blocked by autoplay policies, it will just no-op.
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.0001;

    o.connect(g);
    g.connect(ctx.destination);

    const t0 = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);

    o.start();
    o.stop(t0 + 0.2);

    o.onended = () => {
      ctx.close().catch(() => null);
    };
  } catch {
    // ignore
  }
}

/**
 * Blocks interaction while playing.
 * Visuals: scanning sweep + HUD circles + neon grid pulse.
 */
export function SecurityAnimation({ open, onComplete, durationMs = 2400, className }: SecurityAnimationProps) {
  const timerRef = useRef<number | null>(null);
  const rings = useMemo(() => Array.from({ length: 3 }), []);

  useEffect(() => {
    if (!open) return;
    playPulseBeep();
    timerRef.current = window.setTimeout(() => onComplete(), durationMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [open, durationMs, onComplete]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn(
            "absolute inset-0 z-10 grid place-items-center overflow-hidden rounded-lg",
            "bg-background/60 backdrop-blur-sm",
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-label="Security check animation"
        >
          {/* scanning sweep */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-1/2 left-0 h-full w-full animate-scan-sweep bg-gradient-to-b from-transparent via-primary/25 to-transparent" />
            <div className="absolute inset-0 opacity-70">
              <div className="absolute inset-0 jarvis-grid" />
            </div>
          </div>

          <div className="relative grid place-items-center px-6 text-center">
            <div className="relative h-40 w-40">
              {rings.map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-hud/35"
                  animate={{
                    scale: [1, 1.12 + i * 0.06, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.2 + i * 0.15,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
              <motion.div
                className="absolute inset-6 rounded-full border border-primary/45 bg-surface/25 shadow-hud"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-[42%] rounded-full bg-primary"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <p className="mt-6 font-mono text-xs tracking-[0.34em] text-muted-foreground">SECURITY CHECK PASSED</p>
            <p className="mt-2 text-sm text-muted-foreground">ACCESS GRANTED • INITIATING CORE</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
