import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function StartMachineModal({
  open,
  onStart,
}: {
  open: boolean;
  onStart: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/70 backdrop-blur-md" />

          <motion.div
            className="relative w-[min(92vw,520px)] rounded-lg border border-hud/30 bg-surface/45 p-6 shadow-hud backdrop-blur-xl"
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 18 }}
            role="dialog"
            aria-modal="true"
            aria-label="Start Jarvis machine"
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
              <div className="absolute -top-1/2 left-0 h-full w-full animate-scan-sweep bg-gradient-to-b from-transparent via-primary/25 to-transparent" />
            </div>

            <div className="relative">
              <p className="font-mono text-xs tracking-[0.26em] text-muted-foreground">SYSTEM LOCKED</p>
              <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight">J.A.R.V.I.S Interface</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Initialize the machine to enable hands-free voice mode. Microphone permission will be requested.
              </p>

              <div className="mt-6 flex items-center justify-center">
                <Button variant="hero" size="xl" onClick={onStart} aria-label="Start Machine">
                  <span className="inline-flex items-center gap-3">
                    <span className="h-2.5 w-2.5 animate-hud-pulse rounded-full bg-primary" />
                    <span>▶ Start Machine</span>
                  </span>
                </Button>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 opacity-80">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2 rounded-full border border-hud/20 bg-surface/30"
                    style={{ opacity: 0.35 + (i % 3) * 0.12 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
