// src/components/SaveStatus.jsx
import React from 'react';
import { Save } from 'lucide-react';

export default function SaveStatus({ isSaving }) {
  return (
    <div className="flex items-center space-x-1 text-sm">
      <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
      <span>{isSaving ? 'Saving…' : 'All changes saved'}</span>
    </div>
  );
}
