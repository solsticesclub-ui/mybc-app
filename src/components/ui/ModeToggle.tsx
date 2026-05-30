"use client";

interface Props { mode: string; setMode: (m: string) => void; }

export default function ModeToggle({ mode, setMode }: Props) {
  return (
    <div className="mode-toggle">
      <button className={mode === "plain" ? "active" : ""} onClick={() => setMode("plain")}>Plain</button>
      <button className={mode === "expert" ? "active" : ""} onClick={() => setMode("expert")}>Expert</button>
    </div>
  );
}
