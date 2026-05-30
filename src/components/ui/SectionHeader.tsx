import ModeToggle from "./ModeToggle";

interface Props {
  onBack: () => void;
  backLabel?: string;
  eyebrow: string;
  title: string;
  mode?: string;
  setMode?: (m: string) => void;
}

export default function SectionHeader({ onBack, backLabel = "Hub", eyebrow, title, mode, setMode }: Props) {
  return (
    <div className="header-row" style={{ alignItems: "flex-start" }}>
      <div className="greeting">
        <button className="page-back" onClick={onBack}>← {backLabel}</button>
        <div className="eyebrow" style={{ marginTop: 4 }}>{eyebrow}</div>
        <div className="h2" style={{ marginTop: 2 }}>{title}</div>
      </div>
      {setMode && mode && <ModeToggle mode={mode} setMode={setMode} />}
    </div>
  );
}
