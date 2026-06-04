"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SEC = "/api/generate/section";
const STEPS = [
  { key: "s00", label: "Calculating your natal chart",       pct:  5, endpoint: SEC, params: { section: 0 } },
  { key: "s01", label: "Physical appearance & body",         pct: 11, endpoint: SEC, params: { section: 1 } },
  { key: "s02", label: "Nervous system analysis",            pct: 17, endpoint: SEC, params: { section: 2 } },
  { key: "s03", label: "Daily energy protocol",              pct: 23, endpoint: SEC, params: { section: 3 } },
  { key: "s04", label: "Expression & communication",         pct: 29, endpoint: SEC, params: { section: 4 } },
  { key: "s05", label: "Nutrition & supplements",            pct: 35, endpoint: SEC, params: { section: 5 } },
  { key: "s06", label: "Sport & movement week plan",         pct: 41, endpoint: SEC, params: { section: 6 } },
  { key: "s07", label: "Gut health protocol",                pct: 47, endpoint: SEC, params: { section: 7 } },
  { key: "s08", label: "Brain optimization",                 pct: 53, endpoint: SEC, params: { section: 8 } },
  { key: "s09", label: "Strengths, weaknesses & shadow",     pct: 59, endpoint: SEC, params: { section: 9 } },
  { key: "s10", label: "Career & life mission",              pct: 65, endpoint: SEC, params: { section: 10 } },
  { key: "s11", label: "Relationships & social life",        pct: 71, endpoint: SEC, params: { section: 11 } },
  { key: "s12", label: "Moon calendar & annual cycles",      pct: 77, endpoint: SEC, params: { section: 12 } },
  { key: "s13", label: "Superhuman protocols & rituals",     pct: 82, endpoint: SEC, params: { section: 13 } },
  { key: "s14", label: "Chinese astrology & TCM",            pct: 88, endpoint: SEC, params: { section: 14 } },
  { key: "s15", label: "Annual cycles & Saturn",             pct: 93, endpoint: SEC, params: { section: 15 } },
  { key: "s16", label: "Your superhuman synthesis",          pct: 97, endpoint: SEC, params: { section: 16 } },
];

const STATUS_TO_STEP: Record<string, number> = {
  pending:              0,
  generating_chart:     0,
  generating_health:    0,
  generating_protocols: 0,
  generating_mission:   0,
  section_0:            1,
  section_1:            2,
  section_2:            3,
  section_3:            4,
  section_4:            5,
  section_5:            6,
  section_6:            7,
  section_7:            8,
  section_8:            9,
  section_9:            10,
  section_10:           11,
  section_11:           12,
  section_12:           13,
  section_13:           14,
  section_14:           15,
  section_15:           16,
};

const ZODIAC = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

const AMBIENT_MSGS = [
  "Reading the positions of your planets…",
  "Mapping your natal chart to the ephemeris…",
  "Analysing your elemental balance…",
  "Cross-referencing your numerology…",
  "Decoding your nervous system signature…",
  "Mapping your cognitive blueprint…",
  "Casting your Moon calendar…",
  "Reading your Saturn cycle…",
  "Consulting the Chinese almanac…",
  "Synthesising your life mission…",
  "This report is one of a kind. Keep this tab open.",
  "Almost every section is unique to your exact birth data.",
  "Your rising sign is being calculated to the minute…",
  "Weaving your strengths and shadow sides…",
  "Mapping your ideal career paths…",
  "Building your 12-month forecast…",
  "Finalising your daily protocol…",
];

export default function GeneratingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; cancelled?: string }>;
}) {
  const { token } = use(params);
  const { error: errorParam, cancelled } = use(searchParams);

  const router = useRouter();
  const [phase, setPhase] = useState<"waiting" | "running" | "done" | "error">(
    errorParam ? "error" : cancelled ? "error" : "waiting"
  );
  const [errorMsg, setErrorMsg] = useState(
    cancelled ? "Your subscription is inactive." : ""
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [ambientIdx, setAmbientIdx] = useState(0);
  const running = useRef(false);

  // Cycle ambient messages every 4s
  useEffect(() => {
    if (phase === "done" || phase === "error") return;
    const id = setInterval(() => setAmbientIdx((i) => (i + 1) % AMBIENT_MSGS.length), 4000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (running.current || phase === "error") return;

    async function run() {
      running.current = true;

      let userStatus = "pending";
      let reportStatus: string | null = null;

      for (let i = 0; i < 20; i++) {
        try {
          const res = await fetch(`/api/status/${token}`);
          if (res.ok) {
            const body = await res.json();
            userStatus = body.userStatus;
            reportStatus = body.reportStatus;
          }
        } catch {}
        if (userStatus === "active" || userStatus === "cancelled") break;
        await new Promise((r) => setTimeout(r, 3000));
      }

      if (userStatus === "cancelled") {
        setPhase("error");
        setErrorMsg("Your subscription is not active. Please contact support.");
        return;
      }

      if (reportStatus === "complete") {
        setPhase("done");
        setTimeout(() => router.push(`/app/${token}/hub`), 1500);
        return;
      }

      setPhase("running");
      const startStep = STATUS_TO_STEP[reportStatus ?? "pending"] ?? 0;

      for (let i = startStep; i < STEPS.length; i++) {
        setCurrentStep(i);
        const step = STEPS[i];
        let sectionError = "";
        let success = false;

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const res = await fetch(step.endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, ...step.params }),
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              sectionError = body.error ?? `Section ${i} failed`;
            } else {
              success = true;
              break;
            }
          } catch (err) {
            sectionError = err instanceof Error ? err.message : "Network error";
          }
          if (attempt === 0) await new Promise((r) => setTimeout(r, 3000));
        }

        if (!success) {
          setPhase("error");
          setErrorMsg(sectionError);
          return;
        }
      }

      setPhase("done");
      setTimeout(() => router.push(`/app/${token}/hub`), 1500);
    }

    run();
  }, [token, phase, router]);

  const isDone  = phase === "done";
  const isWaiting = phase === "waiting";
  const step = STEPS[Math.min(currentStep, STEPS.length - 1)];
  const pct  = isDone ? 100 : isWaiting ? 3 : step.pct;
  const R = 38;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="gen-page" style={{ minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, background: "var(--bg)", fontFamily: "var(--font-sans)", padding: "32px 24px" }}>

      <img src="/logo-light.png" alt="MYBC" style={{ height: 28, width: "auto", opacity: 0.85 }} />

      {phase === "error" ? (
        <div style={{ textAlign: "center", maxWidth: 300 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Something went wrong</div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{errorMsg}</p>
          <button
            onClick={() => { running.current = false; setPhase("waiting"); setCurrentStep(0); }}
            style={{ background: "#fff", color: "#111", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Zodiac orbit + progress ring */}
          <div style={{ position: "relative", width: 160, height: 160 }}>

            {/* Outer rotating zodiac ring */}
            <div className="zodiac-orbit" style={{ position: "absolute", inset: 0 }}>
              {ZODIAC.map((g, i) => {
                const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
                const rx = 72, ry = 72;
                const x = 80 + rx * Math.cos(angle);
                const y = 80 + ry * Math.sin(angle);
                return (
                  <span key={g} style={{
                    position: "absolute",
                    left: x, top: y,
                    transform: "translate(-50%,-50%)",
                    fontSize: 13,
                    color: i % 3 === 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)",
                    userSelect: "none",
                  }}>{g}</span>
                );
              })}
            </div>

            {/* Progress ring */}
            <div style={{ position: "absolute", inset: 16 }}>
              <svg width="128" height="128" viewBox="0 0 88 88" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="44" cy="44" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" />
                {/* Glow track */}
                <circle cx="44" cy="44" r={R}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="9" fill="none"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - pct / 100)} />
                {/* Main arc */}
                <circle cx="44" cy="44" r={R}
                  stroke={isDone ? "#16a085" : "rgba(255,255,255,0.82)"}
                  strokeWidth="5" fill="none" strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - pct / 100)}
                  style={{ transition: "stroke-dashoffset 1.6s ease, stroke 0.4s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                {isDone ? "✓" : `${pct}%`}
              </div>
            </div>
          </div>

          {/* Current step label */}
          <div style={{ textAlign: "center", maxWidth: 300 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
              {isDone ? "Your blueprint is ready" : isWaiting ? "Confirming…" : step.label}
            </div>
            {!isDone && (
              <div className="ambient-msg" style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", minHeight: 18 }}>
                {AMBIENT_MSGS[ambientIdx]}
              </div>
            )}
          </div>

          {/* Step list — small, compact */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7, width: "100%", maxWidth: 300 }}>
            {STEPS.map((s, i) => {
              const done   = isDone || (phase === "running" && i < currentStep);
              const active = phase === "running" && i === currentStep;
              if (!isDone && Math.abs(i - currentStep) > 3 && !done) return null;
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                    background: done ? "#16a085" : active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.4s ease",
                  }}>
                    {done   && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    {active && <div className="dot-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--bg)" }} />}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: done ? "rgba(255,255,255,0.3)" : active ? "#fff" : "rgba(255,255,255,0.18)", transition: "color 0.4s ease" }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {isDone ? (
            <button
              onClick={() => router.push(`/app/${token}/hub`)}
              style={{ background: "#fff", color: "#111", border: "none", borderRadius: 14, padding: "14px 32px", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
              Enter your app →
            </button>
          ) : (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
              {isWaiting ? "Waiting for confirmation. Keep this tab open." : "This takes 4–6 minutes. Keep this tab open — your report is being written right now."}
            </p>
          )}
        </>
      )}

      <style>{`
        @keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:0.25 } }
        @keyframes fadecycle { 0%,90%{ opacity:1 } 95%,5%{ opacity:0 } }
        .zodiac-orbit { animation: orbit 40s linear infinite; transform-origin: center; }
        .dot-pulse { animation: pulse 1.4s ease infinite; }
        .ambient-msg { animation: fadecycle 4s ease infinite; }
      `}</style>
    </div>
  );
}
