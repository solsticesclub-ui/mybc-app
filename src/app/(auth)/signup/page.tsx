"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="auth-card">
        <div className="auth-logo">MYBC</div>
        <div className="auth-title">Check your email</div>
        <p className="auth-sub">
          We sent a confirmation link to <strong>{email}</strong>.<br />
          Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">MYBC</div>
      <div className="auth-title">Create account</div>
      <p className="auth-sub">Your birth chart, decoded for life.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{" "}
        <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
