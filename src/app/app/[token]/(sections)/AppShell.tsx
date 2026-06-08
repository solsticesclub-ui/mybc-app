"use client";

import { createContext, useContext, useEffect } from "react";
import type { Report, UserProfile } from "@/lib/types";

interface AppCtx {
  report: Report;
  profile: UserProfile;
  token: string;
  mode: string;
  setMode: (m: string) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppShell");
  return ctx;
}

export function useNav() {
  const { token } = useApp();
  return (path: string) => `/app/${token}/${path}`;
}

interface Props {
  report: Report;
  profile: UserProfile;
  token: string;
  isDemo?: boolean;
  children: React.ReactNode;
}

export default function AppShell({ report, profile, token, isDemo, children }: Props) {
  const mode = "plain";
  const setMode = () => {};
  const now = new Date();

  useEffect(() => {
    if (!isDemo && token) {
      try { localStorage.setItem("mybc_token", token); } catch {}
    }
  }, [token, isDemo]);
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });

  return (
    <Ctx.Provider value={{ report, profile, token, mode, setMode }}>
      {isDemo && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "rgba(22,160,133,0.92)", color: "#fff",
          textAlign: "center", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.1em", padding: "5px 0",
          fontFamily: "Inter, sans-serif", backdropFilter: "blur(4px)",
        }}>
          DEMO MODE — Fanny&apos;s chart · interface preview only
        </div>
      )}
      <div className="shell" style={isDemo ? { paddingTop: 26 } : undefined}>
        <div className="device">
          <div className="app">
            <div className="status-bar">
              <span>{timeStr}</span>
              <span className="right">MYBC</span>
            </div>
            <div className="scroll-area">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
