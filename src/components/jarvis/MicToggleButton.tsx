import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MicToggleButton({
  micEnabled,
  onToggle,
  disabled,
  className,
}: {
  micEnabled: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="mic"
      size="sm"
      disabled={disabled}
      onClick={() => onToggle(!micEnabled)}
      className={cn(
        "gap-2 rounded-full",
        micEnabled ? "ring-1 ring-primary/35 shadow-hud" : "opacity-85",
        className
      )}
      aria-pressed={micEnabled}
      aria-label={micEnabled ? "Turn microphone off" : "Turn microphone on"}
    >
      {micEnabled ? <Mic className="h-4 w-4 text-primary" /> : <MicOff className="h-4 w-4 text-muted-foreground" />}
      <span className={cn("font-mono text-[10px] tracking-[0.26em]", micEnabled ? "text-primary" : "text-muted-foreground")}>
        MIC {micEnabled ? "ON" : "OFF"}
      </span>
      {micEnabled ? <span className="ml-1 h-2 w-2 animate-hud-pulse rounded-full bg-primary" aria-hidden="true" /> : null}
    </Button>
  );
}
