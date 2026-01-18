import { cn } from "@/lib/utils";
import { JarvisMessage } from "./useJarvisVoiceLoop";

export function ChatPanel({
  messages,
  className,
  emptyHint = "Awaiting voice input…",
  emptySubHint = "Speak naturally. No typing required.",
}: {
  messages: JarvisMessage[];
  className?: string;
  emptyHint?: string;
  emptySubHint?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-lg border border-hud/25 bg-surface/35 shadow-elev backdrop-blur-xl",
        className
      )}
      aria-label="Conversation"
    >
      <header className="flex items-center justify-between gap-3 border-b border-hud/20 bg-surface/30 px-4 py-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">MESSAGE BUS</p>
          <h2 className="text-sm font-semibold tracking-tight">Jarvis Console</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary/80" />
          <span className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground">LIVE</span>
        </div>
      </header>

      <div className="max-h-[46vh] overflow-auto p-4 md:max-h-[54vh]">
        {messages.length === 0 ? (
          <div className="grid place-items-center py-10 text-center">
            <p className="font-mono text-xs text-muted-foreground">{emptyHint}</p>
            <p className="mt-2 text-sm text-muted-foreground">{emptySubHint}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <li key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[86%] rounded-lg border px-3 py-2 text-sm leading-relaxed md:max-w-[72%]",
                      isUser ? "border-primary/30 bg-primary/10" : "border-hud/20 bg-surface/35"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">{isUser ? "USER" : "JARVIS"}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
