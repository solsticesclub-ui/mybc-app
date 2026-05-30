interface Props { value?: number; max?: number; }

export default function EnergyRing({ value = 7, max = 10 }: Props) {
  const pct = value / max;
  const C = 2 * Math.PI * 18;
  return (
    <div className="energy-ring-mid">
      <svg viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,0.15)" strokeWidth="4" fill="none" />
        <circle cx="22" cy="22" r="18" stroke="#e7e7e7" strokeWidth="4" fill="none"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - C * pct}
          transform="rotate(-90 22 22)" />
      </svg>
      <div className="center">{value}</div>
    </div>
  );
}
