// src/components/LeftNav.jsx
import React from 'react';

export default function LeftNav({ active, onChange, items }) {
  return (
    <nav className="flex-shrink-0 w-16 flex flex-col items-center py-4 bg-[#2a2a2a] space-y-6">
      {items.map(({ key, icon: Icon, title }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          title={title}
          className={`p-2 rounded-lg transition \
            ${active === key 
              ? 'bg-teal-400 text-gray-900'
              : 'hover:bg-[#3a3a3a] text-gray-400'}`}
        >
          <Icon className="w-6 h-6" />
        </button>
      ))}
    </nav>
  );
}