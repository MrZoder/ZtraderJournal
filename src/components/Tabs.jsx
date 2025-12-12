import React, { useEffect, useRef, useState } from "react";
import { LayoutDashboard, BookOpen, BarChart3, FileText } from "lucide-react";

const ACCENT = "#00FFA3";

// Define your tabs (icon + name)
const tabs = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Library", icon: BookOpen },
  { name: "Statistics", icon: BarChart3 },
  { name: "Journal", icon: FileText },
];

export function Tabs({ activeTab, setActiveTab }) {
  // keep track of which index is active for the indicator bar
  const activeIndex = tabs.findIndex((t) => t.name === activeTab);
  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Whenever the activeIndex changes, recalc the indicator left/width
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const btns = Array.from(container.querySelectorAll("button"));
    if (btns[activeIndex]) {
      const btn = btns[activeIndex];
      const { offsetLeft, offsetWidth } = btn;
      setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeIndex]);

  return (
    <nav
      ref={containerRef}
      className="relative flex space-x-4 bg-[#101010] p-2 rounded-xl shadow-md overflow-visible"
    >
      {/* Animated underline/indicator */}
      <span
        className="absolute bottom-0 h-1 bg-[rgba(0,255,163,0.8)] rounded-full transition-all duration-300"
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      />

      {tabs.map(({ name, icon: Icon }) => {
        const isActive = activeTab === name;
        return (
          <button
            key={name}
            onClick={() => setActiveTab(name)}
            className={`
              flex items-center space-x-2 px-4 py-2 
              text-sm font-medium 
              transition-colors duration-200 
              rounded-lg
              ${isActive
                ? `text-[${ACCENT}]` 
                : "text-gray-400 hover:text-white"
              }
            `}
          >
            <Icon className={`w-5 h-5 ${isActive ? `text-[${ACCENT}]` : "text-gray-400 group-hover:text-white"}`} />
            <span>{name}</span>
          </button>
        );
      })}
    </nav>
  );
}
