"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Sections grouped into 5 parallel batches.
// Within each batch all sections fire simultaneously; batches run sequentially.
const BATCHES = [
  { key: "b0", label: "Calculating your natal chart",           pct:  5, sections: [0] },
  { key: "b1", label: "Body, nervous system & daily protocols", pct: 28, sections: [1, 2, 3, 4] },
  { key: "b2", label: "Nutrition, sport, gut & brain",          pct: 52, sections: [5, 6, 7, 8] },
  { key: "b3", label: "Strengths, career, love & cycles",       pct: 76, sections: [9, 10, 11, 12] },
  { key: "b4", label: "Protocols, astrology & synthesis",       pct: 97, sections: [13, 14, 15, 16] },
];

function getStartBatch(status: string | null): number {
  if (!status || status === "pending") return 0;
  if (["generating_chart", "generating_health", "generating_protocols", "generating_mission", "failed"].includes(status)) return 0;
  if (status === "section_0") return 1;
  if (["section_1", "section_2", "section_3", "section_4"].includes(status)) return 2;
  if (["section_5", "section_6", "section_7", "section_8"].includes(status)) return 3;
  if (["section_9", "section_10", "section_11", "section_12"].includes(status)) return 4;
  return 0;
}

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
  const [currentBatch, setCurrentBatch] = useState(0);
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

    async function runSection(section: number): Promise<void> {
      const res = await fetch("/api/generate/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, section }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Section ${section} failed`);
      }
    }

    async function run() {
      running.current = true;

      // Wait for user to be active (instant for beta)
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
      const startBatch = getStartBatch(reportStatus);

      try {
        for (let i = startBatch; i < BATCHES.length; i++) {
          setCurrentBatch(i);
          await Promise.all(BATCHES[i].sections.map(runSection));
        }
        setPhase("done");
        setTimeout(() => router.push(`/app/${token}/hub`), 1500);
      } catch (err) {
        setPhase("error");
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    }

    run();
  }, [token, phase, router]);

  const isDone = phase === "done";
  const isWaiting = phase === "waiting";
  const batch = BATCHES[Math.min(currentBatch, BATCHES.length - 1)];
  const pct = isDone ? 100 : isWaiting ? 3 : batch.pct;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: "var(--bg)", fontFamily: "var(--font-sans)", padding: "0 24px" }}
    >
      <img src="/logo-light.png" alt="MYBC" style={{ height: 32, width: "auto" }} />

      {/* Personal URL */}
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
            width: "100%", padding: "10px",
            background: copied ? "rgba(22,160,133,0.3)" : "rgba(255,255,255,0.1)",
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
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{errorMsg}</p>
          <button
            onClick={() => { running.current = false; setPhase("waiting"); setCurrentBatch(0); }}
            style={{ background: "#fff", color: "#111", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Progress ring */}
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
            {isDone ? "Your blueprint is ready" : isWaiting ? "Starting generation…" : batch.label}
          </div>

          {/* 5 batch steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
            {BATCHES.map((b, i) => {
              const done = isDone || (phase === "running" && i < currentBatch);
              const active = phase === "running" && i === currentBatch;
              return (
                <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: done ? "#16a085" : active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.4s ease",
                  }}>
                    {done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bg)", animation: "pulse 1.4s ease infinite" }} />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: done ? "rgba(255,255,255,0.4)" : active ? "#fff" : "rgba(255,255,255,0.2)", transition: "color 0.4s ease" }}>
                    {b.label}
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
              {isWaiting ? "Preparing your profile…" : "Takes 3–5 minutes. Keep this tab open."}
            </p>
          )}
        </>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
