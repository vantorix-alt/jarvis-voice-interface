import { useEffect, useMemo, useState } from "react";
import { JarvisCore } from "@/components/jarvis/JarvisCore";
import { StartMachineModal } from "@/components/jarvis/StartMachineModal";
import { PinGate } from "@/components/jarvis/PinGate";

const Index = () => {
  const [started, setStarted] = useState(false);
  const [pinAuthorized, setPinAuthorized] = useState(false);

  // Backend endpoint for the Jarvis response.
  // You can set this in your environment: VITE_JARVIS_API_URL
  const apiUrl = useMemo(() => {
    return import.meta.env.VITE_JARVIS_API_URL || "/api/jarvis";
  }, []);

  // Signature moment: pointer-driven arc-reactor glow field.
  useEffect(() => {
    const el = document.documentElement;
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="jarvis-canvas relative min-h-screen overflow-hidden">
      {/* Background texture layers */}
      <div className="pointer-events-none absolute inset-0 jarvis-grid" />
      <div className="pointer-events-none absolute inset-0 jarvis-scanlines" />

      {/* Main UI stays "locked" (blurred + non-interactive) until Start Machine */}
      <div className={started ? "" : "pointer-events-none blur-sm"}>
        <JarvisCore started={started} apiUrl={apiUrl} />
      </div>

      {/* Security layer: must pass PIN gate before Start Machine can activate. */}
      <PinGate
        open={!pinAuthorized}
        onAuthorized={() => {
          setPinAuthorized(true);
          setStarted(true);
        }}
      />

      {/* Keep the original Start Machine modal available, but only after security gate. */}
      <StartMachineModal open={!started && pinAuthorized} onStart={() => setStarted(true)} />
    </div>
  );
};

export default Index;
