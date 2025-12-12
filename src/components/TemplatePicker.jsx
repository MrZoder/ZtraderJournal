// src/components/TemplatePicker.jsx
import React, { useMemo } from "react";
import SuperSelect from "./ui/SuperSelect";
import { Sparkles, ClipboardList, NotebookPen, FlaskConical } from "lucide-react";

export default function TemplatePicker({
  templates = [],             // [{id,name,type:'plan'|'review'|'strategy', description}]
  value,
  onChoose,                   // (template) => void
  placeholder = "Use template…",
  className = "",
}) {
  const items = useMemo(() => {
    const iconFor = (t) =>
      t.type === "review" ? NotebookPen :
      t.type === "strategy" ? FlaskConical : ClipboardList;

    return templates.map((t) => ({
      value: String(t.id),
      label: t.name,
      desc: t.description || (t.type[0].toUpperCase() + t.type.slice(1)),
      icon: iconFor(t),
      section: t.type === "plan" ? "Plan" : t.type === "review" ? "Review" : "Strategy",
      raw: t,
    }));
  }, [templates]);

  return (
    <SuperSelect
      items={items}
      value={value || ""}
      onChange={(val) => {
        const picked = items.find(i => i.value === val)?.raw;
        picked && onChoose?.(picked);
      }}
      placeholder={placeholder}
      className={`min-w-[220px] ${className}`}
      renderLabel={(it) =>
        it ? (
          <span className="inline-flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-300" />
            <span className="truncate">{it.label}</span>
          </span>
        ) : (
          <span className="text-zinc-300 inline-flex items-center gap-2">
            <Sparkles size={14} /> {placeholder}
          </span>
        )
      }
    />
  );
}
