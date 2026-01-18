import { cn } from "@/lib/utils";

export function VoiceVisualizer({
  active,
  mode,
  className,
}: {
  active: boolean;
  mode: "listening" | "thinking" | "speaking";
  className?: string;
}) {
  const isListening = active && mode === "listening";
  const isThinking = mode === "thinking";
  const isSpeaking = mode === "speaking";

  return (
    <div className={cn("relative grid place-items-center", className)} aria-hidden="true">
      <div className={cn("absolute h-40 w-40 rounded-full border border-primary/20", isListening && "animate-hud-pulse")} />
      <div className={cn("absolute h-28 w-28 rounded-full border border-primary/25", isSpeaking && "animate-hud-pulse")} />
      <div className={cn("absolute h-20 w-20 rounded-full bg-gradient-hud blur-[1px]", isThinking && "animate-soft-float")} />

      {/* Wave bars */}
      <div className="relative flex h-14 items-end gap-1">
        {Array.from({ length: 16 }).map((_, i) => {
          const delay = (i % 8) * 90;
          const on = isListening || isSpeaking || isThinking;
          return (
            <div
              key={i}
              className={cn(
                "w-1.5 rounded-full bg-primary/70",
                on ? "animate-wave-bars" : "opacity-30",
              )}
              style={{
                height: `${22 + (i % 7) * 4}px`,
                animationDelay: `${delay}ms`,
              }}
            />
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <p className="font-mono text-[10px] tracking-[0.32em] text-muted-foreground">
          {mode === "listening" ? "LISTENING" : mode === "thinking" ? "THINKING" : "SPEAKING"}
        </p>
      </div>
    </div>
  );
}
