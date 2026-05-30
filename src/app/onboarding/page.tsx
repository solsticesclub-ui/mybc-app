"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LANGUAGES = [
  { value: "English",    label: "English" },
  { value: "French",     label: "Français" },
  { value: "Spanish",    label: "Español" },
  { value: "German",     label: "Deutsch" },
  { value: "Italian",    label: "Italiano" },
  { value: "Portuguese", label: "Português" },
  { value: "Dutch",      label: "Nederlands" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    language: "English",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Save profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      name: form.name,
      birth_date: form.birthDate,
      birth_time: form.birthTime,
      birth_place: form.birthPlace,
      language: form.language,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    // Create LemonSqueezy checkout
    const res = await fetch("/api/lemonsqueezy/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, email: user.email, name: form.name }),
    });

    if (!res.ok) {
      setError("Could not open checkout. Please try again.");
      setLoading(false);
      return;
    }

    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo">MYBC</div>
        <div className="auth-title">Your birth data</div>
        <p className="auth-sub">
          We use this to cast your natal chart and generate your full personalised report.
          All data is kept private and never shared.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Your first name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Sofia"
              required
              autoComplete="given-name"
            />
          </div>

          <div className="auth-field">
            <label>Date of birth</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => set("birthDate", e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>
              Time of birth{" "}
              <span style={{ fontWeight: 400, opacity: 0.6 }}>(as precise as possible)</span>
            </label>
            <input
              type="time"
              value={form.birthTime}
              onChange={(e) => set("birthTime", e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Place of birth</label>
            <input
              type="text"
              value={form.birthPlace}
              onChange={(e) => set("birthPlace", e.target.value)}
              placeholder="e.g. Verviers, Belgium"
              required
            />
          </div>

          <div className="auth-field">
            <label>Report language</label>
            <select
              value={form.language}
              onChange={(e) => set("language", e.target.value)}
              style={{
                border: "1.5px solid var(--line)", borderRadius: 12,
                padding: "12px 14px", font: "inherit", fontSize: 15,
                color: "var(--ink)", background: "var(--paper)", outline: "none",
                width: "100%", cursor: "pointer",
              }}
              required
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Opening checkout…" : "Continue to payment →"}
          </button>
        </form>

        <p className="auth-sub" style={{ marginTop: 16, fontSize: 12, opacity: 0.5 }}>
          €9/month · 3-month minimum · cancel any time
        </p>
      </div>
    </div>
  );
}
