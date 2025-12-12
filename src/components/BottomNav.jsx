// src/components/BottomNav.jsx
import React from 'react';

export default function BottomNav({ active, onChange, items }) {
  return (
    <nav className="flex justify-around bg-[#2a2a2a] py-2 backdrop-blur-lg md:hidden">
      {items.map(({ key, icon: Icon, title }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex flex-col items-center text-xs transition ${
            active === key
              ? 'text-teal-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Icon className="w-6 h-6" />
          <span className="mt-1">{title}</span>
        </button>
      ))}
    </nav>
  );
}
