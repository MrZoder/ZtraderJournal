import React from 'react';
import { X } from 'lucide-react';
import { useTheme, themePresets } from '../context/ThemeContext';

export default function ThemeSettings({ onClose }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-2xl space-y-4 w-80">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Theme Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(themePresets).map(([key, preset]) => {
            const isActive = preset === theme;
            return (
              <button
                key={key}
                onClick={() => setTheme(preset)}
                className={`
                  w-full text-left px-4 py-2 rounded-lg transition
                  \${isActive
                    ? \`\${theme.accentBg} text-white\`
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}
                `}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
