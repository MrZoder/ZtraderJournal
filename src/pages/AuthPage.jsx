// src/pages/AuthPage.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const accentColor = "#00FFA3";
const backgroundClasses = "bg-gradient-to-br from-gray-900 via-black to-gray-800";

export default function AuthPage() {
  const { user, signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [confirmSent, setConfirmSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (user) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signin") {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setConfirmSent(true);
    }
  };

  const requestReset = async (e) => {
    e.preventDefault();
    setError("");
    const { error } = await resetPassword(email);
    if (error) setError(error.message);
    else setResetSent(true);
  };

  const MobileHero = () => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setHasMounted(true), 10);
    return () => clearTimeout(timeout);
  }, []);

  const content = (
    <div
      className="md:hidden flex flex-col items-center px-6 pt-6 pb-4 text-center"
      style={{
        WebkitFontSmoothing: "antialiased",
        textRendering: "optimizeLegibility",
        transform: "translateZ(0)",
        contain: "layout style"
      }}
    >
      <h1 className="text-2xl font-black text-white mb-2">Unlock Your Edge</h1>
      <p className="text-sm text-gray-300 mb-4">
        Disciplined journaling, real-time analytics, trade insights.
      </p>
      <ul className="space-y-2 w-full">
        {[
          "P&L & R/R Metrics",
          "Session Timers",
          "Cloud Sync",
          "Rich-Text Notes",
        ].map((item) => (
          <li
            key={item}
            className="flex items-center justify-center gap-2"
          >
            <span className="block w-2 h-2 bg-[rgba(0,255,163,0.8)] rounded-full" />
            <span className="text-xs text-gray-200">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (hasMounted) return content;

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {content}
    </motion.div>
  );
};

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row md:items-center items-start justify-center relative overflow-x-hidden overflow-y-auto md:overflow-hidden ${backgroundClasses} will-change-transform antialiased`}
      style={{ WebkitFontSmoothing: "antialiased", backfaceVisibility: "hidden" }}
    >
      {/* ─── Background ─── */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ transform: "translateZ(0)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-[rgba(0,255,163,0.05)] rounded-full blur-3xl -right-20 sm:-right-32 -bottom-20 sm:-bottom-32" />
        <div className="absolute w-56 h-56 sm:w-72 sm:h-72 bg-[rgba(0,255,163,0.05)] rounded-full blur-2xl -left-16 sm:-left-24 -top-16 sm:-top-24" />
      </motion.div>

      {/* ─── Prevent Reflow ─── */}
      <MobileHero />

      <div className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-4xl mx-auto flex flex-col backdrop-blur-lg bg-[rgba(0,0,0,0.6)] rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row">
          {/* Desktop Hero */}
          <div className="hidden md:flex flex-1 flex-col justify-center p-8 lg:p-12 text-white">
            <motion.h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight"
              initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
              Unlock Your Edge<br />Master the Market
            </motion.h1>
            <motion.p className="mb-8 text-lg text-gray-300"
              initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.3 }}>
              Dive into disciplined journaling, real-time analytics, and trade insights.
            </motion.p>
            <motion.ul className="space-y-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.6 }}>
              {["Advanced P&L & R/R Metrics", "Session Timers & Alerts", "Encrypted Cloud Sync", "Rich-Text Trade Notes"].map(item => (
                <li key={item} className="flex items-center gap-4">
                  <span className="block w-3 h-3 bg-[rgba(0,255,163,0.9)] rounded-full" />
                  <span className="text-base text-gray-200">{item}</span>
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Form Panel */}
          <div className="flex-1 p-6 sm:p-8 md:p-12 relative">
            <div className="flex justify-center gap-6 mb-8">
              {['signin', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setConfirmSent(false); setResetSent(false); }}
                  className={`text-xl font-semibold ${mode === m ? 'text-white' : 'text-gray-500'}`}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <div className="relative h-auto md:h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ x: mode === 'signin' ? -80 : 80, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: mode === 'signin' ? 80 : -80, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                  className="md:absolute inset-0"
                >
                  {/* RESET MODE */}
                  {mode === 'reset' ? (
                    <div className="space-y-4 text-center">
                      {resetSent ? (
                        <>
                          <h2 className="text-xl font-bold text-white">Check Your Inbox</h2>
                          <p className="text-sm text-gray-300">If that email exists, you'll receive a reset link shortly.</p>
                          <button onClick={() => setMode('signin')}
                            className="w-full py-2 rounded-lg font-semibold text-black"
                            style={{ background: accentColor }}>
                            Back to Sign In
                          </button>
                        </>
                      ) : (
                        <form onSubmit={requestReset} className="space-y-4">
                          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                          <input
                            type="email"
                            placeholder="Email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-3 bg-transparent border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-[rgba(0,255,163,0.5)] focus:outline-none"
                          />
                          <button type="submit"
                            className="w-full py-2 rounded-lg font-semibold text-black hover:scale-105 transition"
                            style={{ background: accentColor }}>
                            Send Reset Link
                          </button>
                          <p className="text-xs text-gray-400 underline hover:text-white">
                            <button type="button" onClick={() => setMode('signin')}>← Back to Sign In</button>
                          </p>
                        </form>
                      )}
                    </div>
                  ) : confirmSent ? (
                    <div className="space-y-4 text-center">
                      <h2 className="text-xl sm:text-2xl font-bold text-white">Check Your Inbox</h2>
                      <p className="text-sm text-gray-300">We’ve sent a confirmation link. Activate to proceed.</p>
                      <button onClick={() => setConfirmSent(false)}
                        className="w-full py-2 font-semibold rounded-lg text-black"
                        style={{ background: accentColor }}>
                        Back
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={submit} className="space-y-6">
                      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                      <div className="space-y-4">
                        <input
                          type="email"
                          placeholder="Email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full p-4 bg-transparent border border-gray-600 rounded-lg text-white outline-none focus:ring-2 focus:ring-[rgba(0,255,163,0.5)]"
                        />
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-4 bg-transparent border border-gray-600 rounded-lg text-white outline-none focus:ring-2 focus:ring-[rgba(0,255,163,0.5)] pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 rounded-lg font-semibold text-black transform hover:scale-105 transition"
                        style={{ background: accentColor }}
                      >
                        {mode === 'signin' ? 'Enter the Ledger' : 'Forge Your Account'}
                      </button>
                      {mode === 'signin' && (
                        <p className="text-xs text-gray-400 text-center mt-2">
                          <button
                            type="button"
                            onClick={() => { setMode('reset'); setError(''); setResetSent(false); }}
                            className="underline hover:text-white transition"
                          >
                            Forgot Password?
                          </button>
                        </p>
                      )}
                      {mode === 'signup' && (
                        <p className="text-[10px] sm:text-xs text-gray-400 text-center">
                          By signing up you agree to our{' '}
                          <a href="/terms" className="underline">Terms</a> &{' '}
                          <a href="/privacy" className="underline">Privacy</a>
                        </p>
                      )}
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
