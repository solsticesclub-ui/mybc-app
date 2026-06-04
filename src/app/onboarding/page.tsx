"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const LANGUAGES = [
  { value: "English",    label: "English" },
  { value: "French",     label: "Français" },
  { value: "Spanish",    label: "Español" },
  { value: "German",     label: "Deutsch" },
  { value: "Italian",    label: "Italiano" },
  { value: "Portuguese", label: "Português" },
  { value: "Dutch",      label: "Nederlands" },
];

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: { name: string; country?: string; state?: string; city?: string };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    birthFullName: "",
    email: "",
    birthDate: "",
    birthTime: "",
    language: "English",
  });

  // Location autocomplete state
  const [locationQuery, setLocationQuery] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Fetch Photon suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (locationQuery.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(locationQuery)}&limit=5&layer=city&layer=district`
        );
        const json = await res.json();
        setSuggestions(json.features ?? []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, [locationQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectLocation(f: PhotonFeature) {
    const [lng, lat] = f.geometry.coordinates;
    const parts = [f.properties.name, f.properties.state, f.properties.country]
      .filter(Boolean)
      .join(", ");
    setLocationLabel(parts);
    setLocationQuery(parts);
    setLocationLat(lat);
    setLocationLng(lng);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locationLat === null || locationLng === null) {
      setError("Please select a birth place from the suggestions.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        birthFullName: form.birthFullName,
        birthDate: form.birthDate,
        birthTime: form.birthTime,
        birthPlace: locationLabel,
        birthLat: locationLat,
        birthLng: locationLng,
        language: form.language,
      }),
    });

    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    const { token } = await res.json();
    router.push(`/app/${token}/generating`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <img src="/logo-dark.png" alt="MYBC" style={{ height: 36, width: "auto", marginBottom: 8 }} />
        <div className="auth-title">Your birth data</div>
        <p className="auth-sub">
          We use this to cast your natal chart and generate your full personalised report.
          All data is kept private and never shared.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>
              Full name on birth certificate{" "}
              <span style={{ fontWeight: 400, opacity: 0.6 }}>(for numerology)</span>
            </label>
            <input
              type="text"
              value={form.birthFullName}
              onChange={(e) => set("birthFullName", e.target.value)}
              placeholder="e.g. Sofia Marie Dupont"
              required
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label>Your email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="e.g. sofia@example.com"
              required
              autoComplete="email"
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

          <div className="auth-field" ref={containerRef} style={{ position: "relative" }}>
            <label>Place of birth</label>
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                setLocationLabel("");
                setLocationLat(null);
                setLocationLng(null);
              }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="e.g. Paris, France"
              required
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 12,
                marginTop: 4, padding: "4px 0", listStyle: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              }}>
                {suggestions.map((f, i) => {
                  const parts = [f.properties.name, f.properties.state, f.properties.country]
                    .filter(Boolean).join(", ");
                  return (
                    <li
                      key={i}
                      onMouseDown={() => selectLocation(f)}
                      style={{
                        padding: "10px 14px", cursor: "pointer", fontSize: 14,
                        color: "var(--ink)", borderBottom: i < suggestions.length - 1 ? "1px solid var(--line)" : "none",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {parts}
                    </li>
                  );
                })}
              </ul>
            )}
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
            {loading ? "Creating your profile…" : "Generate my report →"}
          </button>
        </form>

        <p className="auth-sub" style={{ marginTop: 16, fontSize: 12, opacity: 0.5 }}>
          Beta access · free for now · keep this page bookmarked
        </p>
      </div>
    </div>
  );
}
