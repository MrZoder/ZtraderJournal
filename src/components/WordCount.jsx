// src/components/WordCount.jsx
import React from 'react';

export default function WordCount({ count }) {
  return (
    <div className="text-sm text-gray-400">{count} words</div>
  );
}