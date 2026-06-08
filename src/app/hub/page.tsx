"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HubRedirect() {
  const router = useRouter();

  useEffect(() => {
    let token: string | null = null;
    try { token = localStorage.getItem("mybc_token"); } catch {}
    if (token) {
      router.replace(`/app/${token}/hub`);
    } else {
      router.replace("/recover");
    }
  }, [router]);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100svh", background: "#1a1c21", color: "rgba(255,255,255,0.6)",
      fontSize: 14, fontFamily: "Inter, sans-serif",
    }}>
      Loading…
    </div>
  );
}
