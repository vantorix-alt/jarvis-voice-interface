import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Delete, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SecurityAnimation } from "@/components/jarvis/SecurityAnimation";

type PinGateProps = {
  open: boolean;
  onAuthorized: () => void;
  className?: string;
};

/**
 * PIN Gate (frontend-only)
 * - Fixed PIN is hardcoded and never displayed in the UI.
 * - Tap-based keypad only (no input field / typing required).
 * - Blocks interaction while the security animation is playing.
 */
export function PinGate({ open, onAuthorized, className }: PinGateProps) {
  const REQUIRED_PIN = useMemo(() => "223366", []);

  const [digits, setDigits] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "denied" | "passed">("idle");
  const [animating, setAnimating] = useState(false);

  const maskedSlots = useMemo(() => {
    const filled = digits.length;
    return Array.from({ length: 6 }).map((_, i) => (i < filled ? "●" : "○"));
  }, [digits.length]);

  const reset = useCallback(() => {
    setDigits([]);
    setStatus("idle");
  }, []);

  const deny = useCallback(() => {
    setStatus("denied");
    setTimeout(() => {
      setDigits([]);
      setStatus("idle");
    }, 650);
  }, []);

  const tryValidateIfComplete = useCallback(
    (nextDigits: string[]) => {
      if (nextDigits.length !== 6) return;
      if (nextDigits.join("") === REQUIRED_PIN) {
        setStatus("passed");
        setAnimating(true);
      } else {
        deny();
      }
    },
    [REQUIRED_PIN, deny]
  );

  const addDigit = useCallback(
    (d: string) => {
      if (animating) return;
      setDigits((prev) => {
        if (prev.length >= 6) return prev;
        const next = [...prev, d];
        // validate immediately once 6 digits are entered
        queueMicrotask(() => tryValidateIfComplete(next));
        return next;
      });
    },
    [animating, tryValidateIfComplete]
  );

  const backspace = useCallback(() => {
    if (animating) return;
    setDigits((prev) => prev.slice(0, -1));
    setStatus("idle");
  }, [animating]);

  const clearAll = useCallback(() => {
    if (animating) return;
    reset();
  }, [animating, reset]);

  const keypad = useMemo(
    () => [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
    ],
    []
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn("fixed inset-0 z-50 flex items-center justify-center", className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

          <motion.div
            className={cn(
              "relative w-[min(92vw,560px)] overflow-hidden rounded-lg border border-hud/30 bg-surface/45 p-6 shadow-hud backdrop-blur-xl",
              status === "denied" ? "border-destructive/45" : ""
            )}
            initial={{ y: 18, scale: 0.985, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.985, opacity: 0 }}
            transition={{ type: "spring", stiffness: 170, damping: 18 }}
            role="dialog"
            aria-modal="true"
            aria-label="Security PIN gate"
          >
            {/* Decorative sweep */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-1/2 left-0 h-full w-full animate-scan-sweep bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
            </div>

            {/* Interactions are blocked while animating */}
            <div className={cn("relative", animating ? "pointer-events-none" : "")}
>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs tracking-[0.28em] text-muted-foreground">SECURITY LAYER</p>
                  <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight">Enter Access PIN</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Tap keypad to authenticate. Keyboard input is disabled.</p>
                </div>

                <div className="mt-1 rounded-full border border-hud/25 bg-surface/35 px-3 py-1">
                  <span className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground">GATE v1</span>
                </div>
              </div>

              <motion.div
                className="mt-6 flex items-center justify-center"
                animate={status === "denied" ? { x: [0, -10, 10, -7, 7, 0] } : { x: 0 }}
                transition={{ duration: 0.45 }}
              >
                <div className="flex gap-2">
                  {maskedSlots.map((ch, i) => (
                    <div
                      key={i}
                      className={cn(
                        "grid h-12 w-12 place-items-center rounded-md border bg-surface/25 shadow-elev",
                        status === "denied" ? "border-destructive/35" : "border-hud/25"
                      )}
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "font-mono text-lg",
                          ch === "●" ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {ch === "○" ? "•" : ch}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="mt-4 min-h-6 text-center">
                {status === "denied" ? (
                  <p className="font-mono text-xs tracking-[0.26em] text-destructive">ACCESS DENIED</p>
                ) : status === "passed" ? (
                  <p className="font-mono text-xs tracking-[0.26em] text-primary">SECURITY CHECK PASSED</p>
                ) : (
                  <p className="font-mono text-xs tracking-[0.26em] text-muted-foreground">ENTER 6 DIGITS</p>
                )}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {keypad.flat().map((d) => (
                  <Button
                    key={d}
                    variant="hud"
                    size="lg"
                    className="h-14"
                    onClick={() => addDigit(d)}
                    aria-label={`Digit ${d}`}
                  >
                    <span className="font-mono text-lg tracking-widest">{d}</span>
                  </Button>
                ))}

                <Button
                  variant="hud"
                  size="lg"
                  className="h-14"
                  onClick={clearAll}
                  aria-label="Clear PIN"
                >
                  <span className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.22em] text-muted-foreground">
                    <Eraser className="h-4 w-4" /> CLEAR
                  </span>
                </Button>

                <Button
                  variant="hud"
                  size="lg"
                  className="h-14"
                  onClick={() => addDigit("0")}
                  aria-label="Digit 0"
                >
                  <span className="font-mono text-lg tracking-widest">0</span>
                </Button>

                <Button
                  variant="hud"
                  size="lg"
                  className="h-14"
                  onClick={backspace}
                  aria-label="Backspace"
                >
                  <span className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.22em] text-muted-foreground">
                    <Delete className="h-4 w-4" /> DEL
                  </span>
                </Button>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="grid gap-1">
                  <p className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground">POLICY</p>
                  <p className="text-xs text-muted-foreground">Frontend-only validation. No PIN is shown in UI.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset} disabled={animating}>
                  Reset
                </Button>
              </div>
            </div>

            <SecurityAnimation
              open={animating}
              onComplete={() => {
                setAnimating(false);
                onAuthorized();
              }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
