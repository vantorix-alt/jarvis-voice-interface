import { AlertTriangle, Mic, MicOff, Radar } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./ChatPanel";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { useJarvisVoiceLoop } from "./useJarvisVoiceLoop";
import { MicToggleButton } from "./MicToggleButton";
import { TextInputPanel } from "./TextInputPanel";

export function JarvisCore({
  started,
  apiUrl,
  className,
}: {
  started: boolean;
  apiUrl: string;
  className?: string;
}) {
  // Single source of truth for user override.
  const [micEnabled, setMicEnabled] = useState(true);

  const { phase, micActive, supportsSpeechRecognition, error, messages, retry, sendText } = useJarvisVoiceLoop({
    started,
    apiUrl,
    micEnabled,
  });

  const modeLabel = useMemo(() => (micEnabled ? "VOICE MODE ACTIVE" : "TEXT MODE ACTIVE"), [micEnabled]);

  return (
    <main className={cn("relative mx-auto w-full max-w-6xl px-4 pb-10 pt-6 md:pt-10", className)}>
      <div className="grid gap-6 md:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-hud/25 bg-surface/30 p-4 shadow-elev backdrop-blur-xl md:p-5">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.32em] text-muted-foreground">JARVIS CORE</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">{micEnabled ? "Voice Loop Online" : "Console Input Online"}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {phase === "locked"
                  ? "System locked. Initialize to begin."
                  : phase === "booting"
                    ? "Booting subsystems…"
                    : phase === "idle"
                      ? "Text mode ready. Voice capture is disabled."
                      : phase === "listening"
                        ? "Listening for your command."
                        : phase === "thinking"
                          ? "JARVIS is thinking…"
                          : phase === "speaking"
                            ? "Speaking response…"
                            : "Attention required."}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <MicToggleButton
                micEnabled={micEnabled}
                onToggle={(next) => setMicEnabled(next)}
                disabled={!started || phase === "booting"}
              />

              <div className="inline-flex items-center gap-2 rounded-full border border-hud/25 bg-surface/35 px-3 py-1 shadow-elev">
                {micActive ? <Mic className="h-4 w-4 text-primary" /> : <MicOff className="h-4 w-4 text-muted-foreground" />}
                <span className="font-mono text-[10px] tracking-[0.26em] text-muted-foreground">MIC {micActive ? "ACTIVE" : "INACTIVE"}</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-hud/20 bg-surface/25 px-3 py-1">
                <Radar className="h-4 w-4 text-primary/80" />
                <span className="font-mono text-[10px] tracking-[0.26em] text-muted-foreground">
                  {supportsSpeechRecognition ? "WEB SPEECH OK" : "NO SPEECH API"}
                </span>
              </div>

              <div className={cn("inline-flex items-center gap-2 rounded-full border bg-surface/20 px-3 py-1", micEnabled ? "border-primary/25" : "border-hud/15")}>
                <span className={cn("h-2 w-2 rounded-full", micEnabled ? "bg-primary animate-hud-pulse" : "bg-muted-foreground/60")} />
                <span className={cn("font-mono text-[10px] tracking-[0.26em]", micEnabled ? "text-primary" : "text-muted-foreground")}>{modeLabel}</span>
              </div>
            </div>
          </header>

          <div className="mt-6">
            <VoiceVisualizer
              active={micEnabled && (phase === "listening" || phase === "speaking" || phase === "thinking")}
              mode={phase === "thinking" ? "thinking" : phase === "speaking" ? "speaking" : "listening"}
              className="mx-auto"
            />
          </div>

          {error ? (
            <div className="mt-6 rounded-lg border border-destructive/35 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold">{error.title}</p>
                  {error.detail ? <p className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">{error.detail}</p> : null}
                  <div className="mt-4 flex items-center gap-2">
                    <Button variant="hud" size="sm" onClick={retry}>
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <footer className="mt-6 rounded-lg border border-hud/20 bg-surface/20 p-3">
            <p className="font-mono text-[10px] tracking-[0.26em] text-muted-foreground">VOICE LIFECYCLE</p>
            <p className="mt-2 text-xs text-muted-foreground">
              LISTEN → THINK → SPEAK → LISTEN. User mic toggle overrides listening; the system still forces mic OFF while thinking/speaking.
            </p>
          </footer>
        </section>

        <div className="space-y-6">
          <ChatPanel messages={messages} emptyHint={micEnabled ? "Awaiting voice input…" : "Awaiting text command…"} emptySubHint={micEnabled ? "Speak naturally. No typing required." : "Mic is OFF. Type a command below."} />

          {/* Text mode input (only when mic is OFF) */}
          {!micEnabled ? <TextInputPanel disabled={!started || phase === "booting"} onSend={sendText} /> : null}

          <section className="rounded-lg border border-hud/25 bg-surface/25 p-4 shadow-elev backdrop-blur-xl">
            <h2 className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">NOTES</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>On Android Chrome, SpeechRecognition is supported; on iOS Safari it is limited or unavailable.</li>
              <li>
                The backend endpoint is <span className="font-mono text-xs">{apiUrl}</span> and must return{" "}
                <span className="font-mono text-xs">{"{ reply: string }"}</span>.
              </li>
              <li>If the browser auto-stops recognition without results, the system re-arms listening after a short delay.</li>
              <li>Mic OFF stops recognition entirely and enables manual text commands.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
