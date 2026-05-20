import type { OsKey } from "@/data/releases";
import { OS_ICONS } from "@/components/OsIcon";

export function OsTile({
  os,
  name,
  tagline,
  selected,
  onSelect,
}: {
  os: OsKey;
  name: string;
  tagline: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`os-tile${selected ? " selected" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="os-icon">{OS_ICONS[os]}</div>
      <div className="os-name">{name}</div>
      <div className="os-sub">{tagline}</div>
    </div>
  );
}
