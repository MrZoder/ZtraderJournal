import { useEffect, useRef, useState } from "react";

/**
 * Debounced autosave hook.
 * - Triggers `delay` ms after the last payload change.
 * - Flushes on tab hide/page hide.
 * - Returns "idle" | "saving" | "saved" | "error".
 */
export default function useAutosave({ payload, onSave, delay = 1200, enabled = true }) {
  const [state, setState] = useState("idle");
  const timerRef = useRef(null);
  const lastJsonRef = useRef(JSON.stringify(payload));

  useEffect(() => {
    if (!enabled) return;
    const json = JSON.stringify(payload);
    if (json === lastJsonRef.current) return;
    lastJsonRef.current = json;

    setState("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await onSave(payload);
        setState("saved");
      } catch (e) {
        console.error("Autosave failed:", e);
        setState("error");
      }
    }, delay);

    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [payload, enabled, delay, onSave]);

  useEffect(() => {
    const flush = async () => {
      if (!enabled) return;
      if (!timerRef.current) return;
      clearTimeout(timerRef.current);
      timerRef.current = null;
      try {
        await onSave(payload);
        setState("saved");
      } catch {
        setState("error");
      }
    };
    const onVis = () => document.hidden && flush();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, [payload, enabled, onSave]);

  return state;
}
