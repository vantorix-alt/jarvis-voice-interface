import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type BootSequenceProps = {
  open: boolean;
  onComplete: () => void;
  className?: string;
};

type BootStep = {
  id: string;
  label: string;
  ms: number;
  logs: string[];
};

/**
 * BootSequence
 * - Purely visual timeline that runs AFTER security passes and BEFORE mic starts.
 * - Blocks interaction while playing (overlay).
 * - Does not touch voice-loop logic; it only delays setting `started=true`.
 */
export function BootSequence({ open, onComplete, className }: BootSequenceProps) {
  const steps: BootStep[] = useMemo(
    () => [
      {
        id: "core",
        label: "CORE BUS INIT",
        ms: 900,
        logs: ["[SYS] bus: handshake", "[SYS] clock: stable", "[SYS] core: online"],
      },
      {
        id: "sensors",
        label: "SENSOR ARRAY",
        ms: 1100,
        logs: ["[IO ] mic: permission pending", "[IO ] webSpeech: probing", "[IO ] capture: armed"],
      },
      {
        id: "nlp",
        label: "LANGUAGE MODULE",
        ms: 1200,
        logs: ["[AI ] lexicon: loaded", "[AI ] intent: ready", "[AI ] tts: warm"],
      },
      {
        id: "hud",
        label: "HUD RENDER PIPE",
        ms: 900,
        logs: ["[UI ] shaders: compiled", "[UI ] grid: calibrated", "[UI ] overlay: active"],
      },
    ],
    []
  );

  const totalMs = useMemo(() => steps.reduce((acc, s) => acc + s.ms, 0), [steps]);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const [elapsed, setElapsed] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);

  const currentStepIndex = useMemo(() => {
    let t = elapsed;
    for (let i = 0; i < steps.length; i++) {
      t -= steps[i].ms;
      if (t < 0) return i;
    }
    return steps.length - 1;
  }, [elapsed, steps]);

  const overallProgress = useMemo(() => {
    if (totalMs <= 0) return 0;
    return Math.min(100, Math.max(0, (elapsed / totalMs) * 100));
  }, [elapsed, totalMs]);

  const stepProgress = useMemo(() => {
    let before = 0;
    for (let i = 0; i < currentStepIndex; i++) before += steps[i].ms;
    const within = Math.max(0, elapsed - before);
    const denom = steps[currentStepIndex]?.ms ?? 1;
    return Math.min(100, Math.max(0, (within / denom) * 100));
  }, [elapsed, currentStepIndex, steps]);

  useEffect(() => {
    if (!open) {
      setElapsed(0);
      setLogLines([]);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    startRef.current = performance.now();

    // Pre-seed first log batch
    setLogLines(steps[0]?.logs ?? []);

    const tick = () => {
      const now = performance.now();
      const nextElapsed = now - startRef.current;
      setElapsed(nextElapsed);

      // Emit logs at step boundaries
      const boundaryMs = steps
        .slice(0, currentStepIndex + 1)
        .reduce((acc, s) => acc + s.ms, 0);

      if (nextElapsed >= boundaryMs - 16) {
        const nextIndex = Math.min(steps.length - 1, currentStepIndex + 1);
        const combined = steps.slice(0, nextIndex + 1).flatMap((s) => s.logs);
        setLogLines(combined);
      }

      if (nextElapsed >= totalMs) {
        onComplete();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, totalMs, onComplete]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn("fixed inset-0 z-50 flex items-center justify-center", className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-label="Boot sequence"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

          <motion.div
            className="relative w-[min(94vw,720px)] overflow-hidden rounded-lg border border-hud/30 bg-surface/45 p-6 shadow-hud backdrop-blur-xl"
            initial={{ y: 18, scale: 0.985, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.985, opacity: 0 }}
            transition={{ type: "spring", stiffness: 170, damping: 18 }}
          >
            {/* Decorative sweep */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-1/2 left-0 h-full w-full animate-scan-sweep bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
            </div>

            <div className="relative">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs tracking-[0.28em] text-muted-foreground">SYSTEM BOOT</p>
                  <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight">Initializing Subsystems</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Stand by. Interaction is locked during boot.</p>
                </div>
                <div className="rounded-full border border-hud/25 bg-surface/35 px-3 py-1">
                  <span className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground">TIMELINE</span>
                </div>
              </header>

              <section className="mt-6 grid gap-5 md:grid-cols-[1fr_320px]">
                {/* Subsystems list */}
                <div className="rounded-lg border border-hud/20 bg-surface/25 p-4">
                  <p className="font-mono text-[10px] tracking-[0.32em] text-muted-foreground">SUBSYSTEMS</p>
                  <div className="mt-3 space-y-3">
                    {steps.map((s, idx) => {
                      const isDone = idx < currentStepIndex;
                      const isActive = idx === currentStepIndex;
                      return (
                        <div key={s.id} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-xs tracking-[0.22em] text-foreground">{s.label}</span>
                            <span
                              className={cn(
                                "font-mono text-[10px] tracking-[0.28em]",
                                isDone ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {isDone ? "OK" : isActive ? "RUN" : "WAIT"}
                            </span>
                          </div>
                          <Progress
                            value={isDone ? 100 : isActive ? stepProgress : 0}
                            className="h-2 bg-secondary/60"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-md border border-hud/15 bg-surface/20 p-3">
                    <p className="font-mono text-[10px] tracking-[0.32em] text-muted-foreground">OVERALL</p>
                    <div className="mt-2">
                      <Progress value={overallProgress} className="h-2 bg-secondary/60" />
                    </div>
                  </div>
                </div>

                {/* Logs */}
                <div className="rounded-lg border border-hud/20 bg-surface/25 p-4">
                  <p className="font-mono text-[10px] tracking-[0.32em] text-muted-foreground">BOOT LOG</p>
                  <div className="mt-3 h-48 overflow-hidden rounded-md border border-hud/15 bg-background/25 p-3">
                    <div className="h-full overflow-auto pr-2">
                      {logLines.map((line, i) => (
                        <p key={i} className="font-mono text-[11px] leading-5 text-muted-foreground">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] tracking-[0.32em] text-muted-foreground">STATUS</span>
                      <span className="font-mono text-[10px] tracking-[0.32em] text-primary">BOOTING</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 opacity-80">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-2 rounded-full border border-hud/20 bg-surface/30"
                          style={{ opacity: 0.28 + (i % 3) * 0.12 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Center HUD circles */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-70">
                <motion.div
                  className="absolute inset-0 rounded-full border border-hud/30"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-6 rounded-full border border-primary/35"
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 6.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
