"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { key: "step1", status: "generating_chart",     label: "Casting your natal chart",           pct: 10, endpoint: "/api/generate/step1" },
  { key: "step2", status: "generating_health",    label: "Reading your body & nervous system",  pct: 35, endpoint: "/api/generate/step2" },
  { key: "step3", status: "generating_protocols", label: "Building your daily protocols",       pct: 60, endpoint: "/api/generate/step3" },
  { key: "step4", status: "generating_mission",   label: "Mapping your mission & life cycles",  pct: 85, endpoint: "/api/generate/step4" },
];

export default function GeneratingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0); // index into STEPS
  const [isDone, setIsDone] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const running = useRef(false);

  useEffect(() => {
    if (running.current) return;

    async function run() {
      running.current = true;
      const supabase = createClient();

      // Wait for subscription to be active (LS webhook may take a few seconds)
      let subActive = false;
      for (let i = 0; i < 15; i++) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setHasError(true); setErrorMsg("Not logged in."); return; }

        const { data: sub } = await supabase
          .from("subscriptions").select("status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1).maybeSingle();

        if (sub?.status === "active") { subActive = true; break; }

        // Also check if report already has data (subscription confirmed earlier)
        const { data: rep } = await supabase.from("reports").select("generation_status").eq("user_id", user.id).maybeSingle();
        if (rep && rep.generation_status !== "pending" && rep.generation_status !== null) { subActive = true; break; }

        await new Promise((r) => setTimeout(r, 3000));
      }

      if (!subActive) {
        setHasError(true);
        setErrorMsg("Subscription not confirmed yet. Please refresh in a moment.");
        return;
      }

      // Run steps sequentially
      for (let i = 0; i < STEPS.length; i++) {
        setCurrentStep(i);
        const step = STEPS[i];

        try {
          const res = await fetch(step.endpoint, { method: "POST" });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error ?? `Step ${i + 1} failed`);
          }
        } catch (err) {
          setHasError(true);
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
          return;
        }
      }

      setIsDone(true);
      setTimeout(() => router.push("/hub"), 1500);
    }

    run();
  }, [router]);

  const step = STEPS[Math.min(currentStep, STEPS.length - 1)];
  const pct = isDone ? 100 : step.pct;

  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: "var(--bg)", fontFamily: "var(--font-sans)", padding: "0 24px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.18em", color: "#fff" }}>MYBC</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Something went wrong</div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 300 }}>{errorMsg}</p>
        <button onClick={() => { running.current = false; setHasError(false); setCurrentStep(0); }}
          style={{ background: "#fff", color: "#111", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: "var(--bg)", fontFamily: "var(--font-sans)", padding: "0 24px" }}>

      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.18em", color: "#fff" }}>MYBC</div>

      {/* Ring */}
      <div style={{ position: "relative", width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="44" cy="44" r="38" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
          <circle cx="44" cy="44" r="38"
            stroke={isDone ? "#16a085" : "rgba(255,255,255,0.75)"}
            strokeWidth="6" fill="none" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 38}
            strokeDashoffset={2 * Math.PI * 38 * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 1.5s ease, stroke 0.4s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff" }}>
          {isDone ? "✓" : `${pct}%`}
        </div>
      </div>

      <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.85)", textAlign: "center" }}>
        {isDone ? "Your blueprint is ready" : step.label}
      </div>

      {/* Step list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340 }}>
        {STEPS.map((s, i) => {
          const done = isDone || i < currentStep;
          const active = !isDone && i === currentStep;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: done ? "#16a085" : active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.4s ease",
              }}>
                {done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bg)", animation: "pulse 1.4s ease infinite" }} />}
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: done ? "rgba(255,255,255,0.5)" : active ? "#fff" : "rgba(255,255,255,0.25)", transition: "color 0.4s ease" }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", maxWidth: 300 }}>
        This takes 3–5 minutes. Keep this tab open.
      </p>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
