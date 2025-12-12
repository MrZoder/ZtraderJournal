// src/components/SessionToggle.jsx
import React from 'react';

export default function SessionToggle({ session, onChange }) {
  return (
    <div className="flex space-x-3">
      {['preMarket', 'endOfDay'].map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition \
            ${session === m 
              ? 'bg-teal-400 text-gray-900'
              : 'bg-[#3a3a3a] hover:bg-[#4a4a4a] text-gray-400'}`}
        >
          {m === 'preMarket' ? 'Pre‑Market' : 'End‑of‑Day'}
        </button>
      ))}
    </div>
  );
}
