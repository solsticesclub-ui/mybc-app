"use client";

import { useState } from "react";

interface Account {
  name: string;
  status: string;
  url: string;
}

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    if (res.ok) {
      const data = await res.json();
      setAccounts(data.accounts);
      setStatus("found");
    } else {
      setStatus("notfound");
    }
  }

  function copy(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", padding: "0 24px" }}>
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <img src="/logo-dark.png" alt="MYBC" style={{ height: 36, width: "auto", marginBottom: 8 }} />
        <div className="auth-title">Find your app</div>
        <p className="auth-sub">
          Enter the email you used when you signed up. Your personal app URL will appear below.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Your email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sofia@example.com"
              required
              autoComplete="email"
            />
          </div>

          {status === "notfound" && (
            <div className="auth-error">No account found with that email.</div>
          )}

          <button type="submit" className="auth-btn" disabled={status === "loading"}>
            {status === "loading" ? "Looking up…" : "Find my app →"}
          </button>
        </form>

        {status === "found" && accounts.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-soft)", marginBottom: 12 }}>
              YOUR APP {accounts.length > 1 ? "LINKS" : "LINK"}
            </div>
            {accounts.map((acc) => (
              <div key={acc.url} style={{
                background: "var(--paper-dim)", borderRadius: 12,
                padding: "14px 16px", marginBottom: 10,
                border: "1px solid var(--line)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
                  {acc.name} · <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>{acc.status}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", wordBreak: "break-all", marginBottom: 10 }}>
                  {acc.url}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={acc.url}
                    style={{
                      flex: 1, textAlign: "center", padding: "10px", background: "var(--ink)",
                      color: "var(--paper)", borderRadius: 10, fontSize: 13, fontWeight: 600,
                      textDecoration: "none", display: "block",
                    }}>
                    Open →
                  </a>
                  <button
                    onClick={() => copy(acc.url)}
                    style={{
                      flex: 1, padding: "10px", background: "transparent",
                      border: "1px solid var(--line)", borderRadius: 10,
                      fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer", font: "inherit",
                    }}>
                    {copied === acc.url ? "✓ Copied!" : "Copy link"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
