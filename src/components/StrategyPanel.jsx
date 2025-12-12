// src/components/StrategyPanel.jsx
import React, { useMemo } from "react";
import RichTextEditor from "./RichTextEditor";

function htmlToWordCount(html = "") {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

export default function StrategyPanel({ data, onChange, onWordCount }) {
  const html = useMemo(() => (typeof data === "string" ? data : ""), [data]);

  const handleChange = (nextHTML) => {
    onChange?.(nextHTML);
    onWordCount?.(htmlToWordCount(nextHTML));
  };

  return (
    <div className="space-y-3">
      <RichTextEditor content={html || "<p></p>"} onContentChange={handleChange} />
      <p className="text-xs text-gray-500">Your strategy is saved automatically.</p>
    </div>
  );
}
