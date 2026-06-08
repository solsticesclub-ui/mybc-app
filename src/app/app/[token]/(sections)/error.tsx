"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SectionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[section error]", error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, textAlign: "center", padding: "0 24px" }}>
      <div style={{ fontSize: 28 }}>⚠</div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>This section failed to load</div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
        Something went wrong rendering this page. Try reloading, or go back to the hub.
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={reset}
          style={{ padding: "10px 20px", background: "var(--ink)", color: "var(--paper)", borderRadius: 12, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", font: "inherit" }}>
          Retry
        </button>
        <button
          onClick={() => router.back()}
          style={{ padding: "10px 20px", background: "transparent", color: "var(--ink)", borderRadius: 12, border: "1px solid var(--line)", fontSize: 13, fontWeight: 600, cursor: "pointer", font: "inherit" }}>
          ← Hub
        </button>
      </div>
    </div>
  );
}
