"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface UserRow {
  token: string;
  name: string;
  email: string;
  birth_date: string;
  birth_place: string;
  language: string;
  created_at: string;
  generation_status: string;
  generated_at: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  complete:    "#16a085",
  failed:      "#c0392b",
  "no report": "#999",
};

function statusColor(s: string) {
  if (STATUS_COLOR[s]) return STATUS_COLOR[s];
  return "#e67e22"; // in progress
}

function AdminPanel({ secret }: { secret: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users", { headers: { "x-admin-secret": secret } });
    if (res.status === 401) { setError("Wrong secret key."); setLoading(false); return; }
    const json = await res.json();
    setUsers(json.users ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function regenerate(token: string, name: string) {
    if (!confirm(`Re-generate report for ${name}? This will erase their current data.`)) return;
    setResetting(token);
    const res = await fetch("/api/admin/reset-report", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) { alert("Reset failed."); setResetting(null); return; }
    // Redirect to the generating page which will start fresh
    router.push(`/app/${token}/generating`);
  }

  if (error) return <p style={{ padding: 32, color: "#c0392b" }}>{error}</p>;

  return (
    <div style={{ padding: 32, fontFamily: "Inter, sans-serif", maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <img src="/logo-dark.png" alt="MYBC" style={{ height: 28 }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Admin — Users</div>
          <div style={{ fontSize: 12, color: "#999" }}>{users.length} users · <button onClick={load} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 12, padding: 0 }}>Refresh</button></div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#999" }}>Loading…</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
              {["Name", "Email", "Birth date", "Place", "Lang", "Status", "Generated", ""].map((h) => (
                <th key={h} style={{ padding: "8px 12px", fontWeight: 600, color: "#555" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.token} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: "10px 12px", color: "#555" }}>{u.email}</td>
                <td style={{ padding: "10px 12px" }}>{u.birth_date}</td>
                <td style={{ padding: "10px 12px", color: "#555", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.birth_place}</td>
                <td style={{ padding: "10px 12px" }}>{u.language}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(u.generation_status), background: `${statusColor(u.generation_status)}18`, padding: "3px 8px", borderRadius: 20 }}>
                    {u.generation_status}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: "#999", fontSize: 11 }}>
                  {u.generated_at ? new Date(u.generated_at).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    onClick={() => regenerate(u.token, u.name)}
                    disabled={resetting === u.token}
                    style={{
                      background: resetting === u.token ? "#eee" : "#1f2125",
                      color: resetting === u.token ? "#999" : "#fff",
                      border: "none", borderRadius: 8, padding: "6px 14px",
                      fontSize: 12, fontWeight: 600, cursor: resetting === u.token ? "default" : "pointer",
                    }}>
                    {resetting === u.token ? "Resetting…" : "Re-generate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AdminGate() {
  const params = useSearchParams();
  const secret = params.get("key") ?? "";

  if (!secret) return (
    <div style={{ padding: 32, fontFamily: "Inter, sans-serif" }}>
      <p style={{ color: "#999" }}>Access: <code>/admin?key=YOUR_SECRET</code></p>
    </div>
  );

  return <AdminPanel secret={secret} />;
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminGate />
    </Suspense>
  );
}
