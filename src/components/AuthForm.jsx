// src/components/AuthForm.jsx
import React from "react";

export default function AuthForm({ title, children, onSubmit }) {
  return (
    <div className="min-h-screen flex items-center justify-center page-bg">
      <form
        onSubmit={onSubmit}
        className="panel rounded-3xl p-8 w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-semibold text-white text-center">
          {title}
        </h2>
        {children}
      </form>
    </div>
  );
}
