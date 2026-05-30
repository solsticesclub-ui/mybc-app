"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { status: "generating_chart",     label: "Casting your natal chart",           pct: 10 },
  { status: "generating_health",    label: "Reading your body & nervous system",  pct: 35 },
  { status: "generating_protocols", label: "Building your daily protocols",       pct: 60 },
  { status: "generating_mission",   label: "Mapping your mission & life cycles",  pct: 85 },
  { status: "complete",             label: "Your blueprint is ready",             pct: 100 },
];

function getStep(status: string) {
  return STEPS.find((s) => s.status === status) ?? STEPS[0];
}

export default function GeneratingPage() {
  const router = useRouter();
  const [status, setStatus] = useState("generating_chart");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let stopped = false;

    async function poll() {
      if (stopped) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("reports")
        .select("generation_status")
        .eq("user_id", user.id)
        .single();

      if (!data) return;

      const s = data.generation_status as string;
      setStatus(s);

      if (s === "complete") {
        setTimeout(() => router.push("/hub"), 1200);
      } else if (s === "failed") {
        setHasError(true);
      }
    }

    poll();
    const timer = setInterval(poll, 4000);
    return () => { stopped = true; clearInterval(timer); };
  }, [router]);

  const step = getStep(status);

  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: "var(--bg)", fontFamily: "var(--font-sans)" }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.18em", color: "#fff" }}>MYBC</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Generation failed</div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 320 }}>
          Something went wrong. Please contact support — your data is safe.
        </p>
      </div>
    );
  }

  const isDone = status === "complete";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: "var(--bg)", fontFamily: "var(--font-sans)", padding: "0 24px" }}>

      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.18em", color: "#fff" }}>MYBC</div>

      {/* Progress ring */}
      <div style={{ position: "relative", width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="44" cy="44" r="38" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
          <circle cx="44" cy="44" r="38"
            stroke={isDone ? "#16a085" : "rgba(255,255,255,0.75)"}
            strokeWidth="6" fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 38}
            strokeDashoffset={2 * Math.PI * 38 * (1 - step.pct / 100)}
            style={{ transition: "stroke-dashoffset 1.2s ease, stroke 0.4s ease" }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff",
        }}>
          {step.pct}%
        </div>
      </div>

      {/* Step label */}
      <div style={{
        fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.85)",
        textAlign: "center", minHeight: 24,
        animation: "fadeMsg 0.4s ease both",
      }}>
        {step.label}
      </div>

      {/* Step list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340 }}>
        {STEPS.slice(0, -1).map((s) => {
          const currentIdx = STEPS.findIndex((x) => x.status === status);
          const stepIdx = STEPS.findIndex((x) => x.status === s.status);
          const done = stepIdx < currentIdx || status === "complete";
          const active = s.status === status;
          return (
            <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: done ? "#16a085" : active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.4s ease",
              }}>
                {done && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {active && !done && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bg)" }} />
                )}
              </div>
              <span style={{
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: done ? "rgba(255,255,255,0.6)" : active ? "#fff" : "rgba(255,255,255,0.3)",
                transition: "color 0.4s ease",
              }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", maxWidth: 300 }}>
        This takes 3–5 minutes. You can close this tab — we&apos;ll finish in the background.
      </p>
    </div>
  );
}
