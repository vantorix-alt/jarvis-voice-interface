import { useCallback, useMemo, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TextInputPanel({
  disabled,
  onSend,
  className,
}: {
  disabled: boolean;
  onSend: (text: string) => Promise<void> | void;
  className?: string;
}) {
  const [value, setValue] = useState("");

  const canSend = useMemo(() => !disabled && value.trim().length > 0, [disabled, value]);

  const submit = useCallback(async () => {
    const t = value.trim();
    if (!t) return;
    setValue("");
    await onSend(t);
  }, [onSend, value]);

  return (
    <section
      className={cn(
        "rounded-lg border border-hud/25 bg-surface/25 p-3 shadow-elev backdrop-blur-xl",
        disabled ? "opacity-50" : "",
        className
      )}
      aria-label="Text command input"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">TEXT MODE</p>
          <p className="mt-1 text-xs text-muted-foreground">Type a command for JARVIS…</p>
        </div>
        <span className="font-mono text-[10px] tracking-[0.26em] text-muted-foreground">ENTER TO SEND</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          disabled={disabled}
          placeholder="Type a command for JARVIS…"
          className="bg-background/20"
          aria-label="Type a command for Jarvis"
        />
        <Button type="button" variant="hud" disabled={!canSend} onClick={() => void submit()} aria-label="Send message">
          <SendHorizonal className="h-4 w-4" />
          <span className="font-mono text-[10px] tracking-[0.22em]">SEND</span>
        </Button>
      </div>
    </section>
  );
}
