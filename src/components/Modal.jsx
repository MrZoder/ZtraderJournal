import React, { useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import useMediaQuery from "../hooks/useMediaQuery";

/**
 * Modal
 * - Desktop: centered, max width ≈ 72rem (max-w-6xl), single vertical scroll with `custom-scrollbar`
 * - Mobile: full-screen sheet with the same `custom-scrollbar`
 * - Click outside & ESC to close. Locks body scroll while open.
 */
export default function Modal({ isOpen, onClose, children }) {
  const isMobile = useMediaQuery("(max-width: 639px)");

  // Close on ESC
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onKeyDown]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Shell */}
      {isMobile ? (
        // Mobile: full screen
        <div className="fixed inset-0 z-[9999]" onClick={onClose}>
          <div
            className="h-full w-full bg-transparent overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* No extra padding/background: child components handle their own UI */}
            {children}
          </div>
        </div>
      ) : (
        // Desktop: centered, “wide enough”
        <div
          className="fixed inset-0 z-[9999] grid place-items-center"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="
              w-[min(90vw,72rem)]    /* ~max-w-6xl, comfy for desktop */
              max-h-[88vh]
              overflow-y-auto custom-scrollbar
            "
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
