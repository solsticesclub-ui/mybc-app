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
  // legacy statuses — restart from beginning
  generating_chart:     0,
  generating_health:    0,
  generating_protocols: 0,
  generating_mission:   0,
  // new per-section statuses
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
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const myUrl = `${appUrl}/app/${token}/hub`;

  const [phase, setPhase] = useState<"waiting" | "running" | "done" | "error">(
    errorParam ? "error" : cancelled ? "error" : "waiting"
  );
  const [errorMsg, setErrorMsg] = useState(
    cancelled ? "Your subscription is inactive." : ""
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const running = useRef(false);

  function copy() {
    navigator.clipboard.writeText(myUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    if (running.current || phase === "error") return;

    async function run() {
      running.current = true;

      // Phase 1: wait for subscription confirmation
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

      // Phase 2: run steps from where we left off
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
          // wait 3s before retry
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

  const isDone = phase === "done";
  const isWaiting = phase === "waiting";
  const step = STEPS[Math.min(currentStep, STEPS.length - 1)];
  const pct = isDone ? 100 : isWaiting ? 5 : step.pct;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: "var(--bg)", fontFamily: "var(--font-sans)", padding: "0 24px" }}>

      <img src="/logo-light.png" alt="MYBC" style={{ height: 32, width: "auto" }} />

      {/* Personal URL — shown from the start so user can bookmark immediately */}
      <div style={{
        width: "100%", maxWidth: 340,
        background: "rgba(255,255,255,0.06)", borderRadius: 14,
        padding: "16px 18px", border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
          YOUR PERSONAL APP URL
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", wordBreak: "break-all", marginBottom: 12, lineHeight: 1.5 }}>
          {myUrl}
        </div>
        <button
          onClick={copy}
          style={{
            width: "100%", padding: "10px", background: copied ? "rgba(22,160,133,0.3)" : "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
            fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", font: "inherit",
            transition: "background 0.2s ease",
          }}>
          {copied ? "✓ Copied!" : "Copy link"}
        </button>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", margin: "8px 0 0" }}>
          Bookmark this URL — it&apos;s your permanent access link
        </p>
      </div>

      {phase === "error" ? (
        <div style={{ textAlign: "center", maxWidth: 300 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Something went wrong</div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{errorMsg}</p>
          <button
            onClick={() => { running.current = false; setPhase("waiting"); setCurrentStep(0); }}
            style={{ marginTop: 16, background: "#fff", color: "#111", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            Try again
          </button>
        </div>
      ) : (
        <>
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
            {isDone ? "Your blueprint is ready" : isWaiting ? "Confirming payment…" : step.label}
          </div>

          {/* Section progress: show a window of ±2 around the current step */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 340 }}>
            {STEPS.map((s, i) => {
              const done = isDone || (phase === "running" && i < currentStep);
              const active = phase === "running" && i === currentStep;
              const visible = isDone || Math.abs(i - currentStep) <= 2 || done;
              if (!visible) return null;
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    background: done ? "#16a085" : active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.4s ease",
                  }}>
                    {done && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--bg)", animation: "pulse 1.4s ease infinite" }} />}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: done ? "rgba(255,255,255,0.4)" : active ? "#fff" : "rgba(255,255,255,0.2)", transition: "color 0.4s ease" }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {isDone && (
            <button
              onClick={() => router.push(`/app/${token}/hub`)}
              style={{ background: "#fff", color: "#111", border: "none", borderRadius: 14, padding: "14px 32px", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
              Enter your app →
            </button>
          )}

          {!isDone && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", maxWidth: 300 }}>
              {isWaiting ? "Waiting for payment confirmation. Keep this tab open." : "This takes 3–5 minutes. Keep this tab open."}
            </p>
          )}
        </>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
