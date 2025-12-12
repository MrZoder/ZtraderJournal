// src/components/PageLayout.jsx
import React from "react";
import { motion } from "framer-motion";

export default function PageLayout({ children, className = "", fullPage = false }) {
  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden ${className}`}
    >
      {/* 
        Optional background blobs or visuals here if you want, or leave blank
      */}
      <div className={
        fullPage
          ? "relative z-10 flex flex-col w-full h-full min-h-screen"
          : "relative z-10 flex flex-col items-center pt-1 px-4 md:px-6 lg:px-8"
      }>
        {children}
      </div>
    </div>
  );
}
