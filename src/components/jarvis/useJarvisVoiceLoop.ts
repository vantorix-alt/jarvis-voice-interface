import { useEffect, useMemo, useRef, useState } from "react";

export type JarvisRole = "user" | "assistant";

export type JarvisMessage = {
  id: string;
  role: JarvisRole;
  content: string;
  ts: number;
};

export type JarvisPhase = "locked" | "booting" | "idle" | "listening" | "thinking" | "speaking" | "error";

export type JarvisError = {
  title: string;
  detail?: string;
};

export function useJarvisVoiceLoop({
  started,
  apiUrl,
  micEnabled,
}: {
  started: boolean;
  apiUrl: string;
  micEnabled: boolean;
}) {
  const [phase, setPhase] = useState<JarvisPhase>(started ? "booting" : "locked");
  const [micActive, setMicActive] = useState(false);
  const [error, setError] = useState<JarvisError | null>(null);
  const [messages, setMessages] = useState<JarvisMessage[]>([]);

  const lastTranscriptRef = useRef<string>("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speakingRef = useRef(false);
  const thinkingAbortRef = useRef<AbortController | null>(null);
  const micEnabledRef = useRef<boolean>(micEnabled);

  const supportsSpeechRecognition = useMemo(() => {
    return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  // ---------- Helpers ----------
  const pushMessage = (role: JarvisRole, content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        content,
        ts: Date.now(),
      },
    ]);
  };

  const stopListeningHard = () => {
    setMicActive(false);
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.abort();
    } catch {
      // ignore
    }
  };

  const speak = async (text: string) => {
    // Voice lifecycle rule: while speaking -> mic MUST stay OFF.
    stopListeningHard();
    setPhase("speaking");

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      // If TTS isn't available, we still move to next phase after a short delay.
      await new Promise((r) => setTimeout(r, 900));
      setPhase(micEnabledRef.current ? "listening" : "idle");
      return;
    }

    // Cancel any queued utterances to avoid overlaps.
    window.speechSynthesis.cancel();

    await new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      u.pitch = 1.0;
      u.volume = 1.0;

      u.onstart = () => {
        speakingRef.current = true;
        stopListeningHard();
      };
      u.onend = () => {
        speakingRef.current = false;
        resolve();
      };
      u.onerror = () => {
        speakingRef.current = false;
        resolve();
      };

      window.speechSynthesis.speak(u);
    });

    // LISTEN → THINK → SPEAK → LISTEN (or idle if mic is user-disabled)
    setPhase(micEnabledRef.current ? "listening" : "idle");
  };

  const callBackend = async (text: string) => {
    // Rule: while thinking -> mic MUST stay OFF.
    stopListeningHard();
    setPhase("thinking");

    const controller = new AbortController();
    thinkingAbortRef.current?.abort();
    thinkingAbortRef.current = controller;

    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, messages }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || `Request failed (${resp.status})`);
      }

      const data = (await resp.json()) as { reply?: string };
      const reply = (data.reply ?? "").trim();
      if (!reply) throw new Error("Backend returned an empty reply.");

      pushMessage("assistant", reply);
      await speak(reply);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError({
        title: "Connection / response error",
        detail:
          msg +
          "\n\nExpected backend response: { reply: string }. Configure VITE_JARVIS_API_URL to your API endpoint.",
      });
      setPhase("error");
    }
  };

  const startListening = async () => {
    if (!supportsSpeechRecognition) {
      setError({
        title: "SpeechRecognition not supported",
        detail:
          "This browser does not support the Web Speech API SpeechRecognition interface. Use Chrome on Android/Desktop.",
      });
      setPhase("error");
      return;
    }

    if (phase !== "listening") return;
    if (speakingRef.current) return;

    // Cleanly request microphone permission once after boot.
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setError({
        title: "Microphone permission denied",
        detail:
          "Please allow microphone access to use hands-free voice mode. On Android Chrome: site settings → microphone → allow.",
      });
      setPhase("error");
      return;
    }

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    recognitionRef.current = rec;

    // --- Voice automation rules ---
    // We keep recognition NOT continuous. We listen for one utterance.
    // When user stops speaking: recognition ends -> we send transcript, then speak, then re-enable listening.
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    lastTranscriptRef.current = "";

    rec.onstart = () => {
      setMicActive(true);
    };

    rec.onresult = (ev) => {
      const result = ev.results?.[0]?.[0]?.transcript ?? "";
      lastTranscriptRef.current = result.trim();
    };

    rec.onerror = (ev) => {
      setMicActive(false);
      // Common: 'not-allowed', 'audio-capture', 'network'
      setError({ title: "Voice input error", detail: `${ev.error}${ev.message ? `: ${ev.message}` : ""}` });
      setPhase("error");
    };

    rec.onend = () => {
      // Mic turns OFF immediately when user finishes speaking.
      setMicActive(false);

      const transcript = lastTranscriptRef.current.trim();
      if (!transcript) {
        // No speech captured: auto-rearm listening after a short pause.
        if (phase === "listening" && micEnabledRef.current) {
          window.setTimeout(() => startListening(), 450);
        }
        return;
      }

      // Send to backend
      pushMessage("user", transcript);
      void callBackend(transcript);
    };

    try {
      rec.start();
    } catch (e) {
      setMicEnabled(false);
      setError({ title: "Could not start microphone", detail: e instanceof Error ? e.message : "Unknown error" });
      setPhase("error");
    }
  };

  // Keep a ref to avoid stale reads inside async callbacks.
  useEffect(() => {
    micEnabledRef.current = micEnabled;

    // User override: if mic is OFF, recognition must be fully disabled.
    if (!micEnabled) {
      stopListeningHard();
      // Only move to idle if we're not in an active think/speak/error state.
      setPhase((p) => (p === "thinking" || p === "speaking" || p === "error" ? p : started ? "idle" : "locked"));
    } else {
      // If user toggles mic back ON, return to listening (which will re-arm recognition).
      setPhase((p) => (p === "idle" ? "listening" : p));
    }
  }, [micEnabled, started]);

  // Boot sequence after clicking Start Machine
  useEffect(() => {
    if (!started) {
      setPhase("locked");
      return;
    }

    setError(null);
    setPhase("booting");

    const t = window.setTimeout(() => {
      setPhase(micEnabledRef.current ? "listening" : "idle");
    }, 1600);

    return () => window.clearTimeout(t);
  }, [started]);

  // Auto-start mic when phase becomes listening
  useEffect(() => {
    if (!started) return;
    if (!micEnabledRef.current) {
      stopListeningHard();
      return;
    }

    if (phase !== "listening") {
      stopListeningHard();
      return;
    }

    // Give the UI a beat to settle before starting recognition.
    const t = window.setTimeout(() => {
      void startListening();
    }, 250);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, started]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      thinkingAbortRef.current?.abort();
      stopListeningHard();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    micActive,
    supportsSpeechRecognition,
    error,
    messages,
    sendText: async (text: string) => {
      const safe = text.trim();
      if (!safe) return;
      pushMessage("user", safe);
      await callBackend(safe);
    },
    retry: () => {
      setError(null);
      setPhase(micEnabledRef.current ? "listening" : "idle");
    },
  };
}
