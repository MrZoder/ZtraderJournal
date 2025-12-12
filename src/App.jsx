// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// Services & Context
import { addTrade, updateTrade } from "./utils/tradeService";
import { useAuth } from "./context/AuthContext";

// Pages
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Statistics from "./pages/Statistics";
import JournalPage from "./pages/JournalPage";
import AuthPage from "./pages/AuthPage";
import UpdatePassword from "./pages/UpdatePassword";
import LandingPage from "./landing/LandingPage"; // Ensure this matches where you saved the file

// Components
import Modal from "./components/Modal";
import TradeForm from "./components/TradeForm";
import PageLayout from "./components/PageLayout";
import PageLoader from "./components/PageLoader";

// Assets
import Logo from "./assets/ZtraderLogo.png";
import {
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  FileText,
  ChevronDown,
  Bell,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";

const tabs = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Library", icon: BookOpen },
  { name: "Statistics", icon: BarChart3 },
  { name: "Journal", icon: FileText },
];

export default function App() {
  const { user, signOut } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [showAuth, setShowAuth] = useState(false); // Controls Landing vs Auth view
  
  // UI State
  const [isModalOpen, setModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  // Animation settings
  const prefersReduced = useReducedMotion();
  const pageVariants = prefersReduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.18 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : {
        initial: { opacity: 0, y: 12, filter: "blur(2px)" },
        animate: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { type: "spring", stiffness: 420, damping: 34, mass: 0.8 },
        },
        exit: {
          opacity: 0,
          y: -10,
          filter: "blur(2px)",
          transition: { duration: 0.18, ease: "easeInOut" },
        },
      };

  // Reset UI states when tabs change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAvatarOpen(false);
  }, [activeTab]);

  // Page loader effect
  useEffect(() => {
    setPageLoading(true);
    const t = setTimeout(() => setPageLoading(false), 600);
    return () => clearTimeout(t);
  }, [activeTab]);

  // Toast Helper
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Compute User Initials
  const initials = useMemo(() => {
    const src = user?.user_metadata?.full_name || user?.email || "U";
    const parts = String(src).replace(/@.*/, "").split(/[.\s_-]/).filter(Boolean);
    const chars = parts.slice(0, 2).map((p) => p[0].toUpperCase());
    return chars.join("") || "U";
  }, [user]);

  // Route Handling
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const showUpdate = path === "/auth/update-password";
  const isAuthed = !!user;

  return (
    <div
      className="relative text-white overflow-hidden bg-gradient-to-br from-[#0B0B0C] via-[#0E0E12] to-[#15151A]"
      style={{ minHeight: "100dvh" }}
    >
      {/* ===== ROUTE LOGIC ===== */}
      
      {/* 1. Update Password Route */}
      {showUpdate ? (
        <UpdatePassword />
      ) : !isAuthed ? (
        // 2. Public Routes (Landing or Auth)
        <AnimatePresence mode="wait">
          {showAuth ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <AuthPage />
              {/* Optional: Add a "Back to Home" button here if needed */}
            </motion.div>
          ) : (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full"
            >
              <LandingPage onLoginClick={() => setShowAuth(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        // 3. Authenticated App (Dashboard)
        <>
          {/* ===== NAVBAR ===== */}
          <header
            className="sticky top-0 z-50"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingTopFallback: "constant(safe-area-inset-top)",
              WebkitPaddingBefore: "env(safe-area-inset-top)",
            }}
          >
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-x-0 -bottom-[1px] h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(0,255,163,0.35) 20%, rgba(34,211,238,0.35) 80%, transparent 100%)",
                }}
              />
              <div className="bg-[rgba(10,10,12,0.55)] backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 pt-4 sm:pt-3">
                  {/* Left: Brand + Nav */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    <a className="h-8 sm:h-9 w-auto select-none inline-flex items-center" href="#top">
                      <img src={Logo} alt="Ztrader Logo" className="h-full w-auto object-contain" />
                    </a>
                    <nav className="hidden md:flex items-center gap-1">
                      {tabs.map(({ name, icon: Icon }) => {
                        const is = activeTab === name;
                        return (
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            key={name}
                            onClick={() => setActiveTab(name)}
                            className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                              is ? "text-black" : "text-zinc-300 hover:text-white"
                            }`}
                            style={{
                              background: is
                                ? "linear-gradient(135deg, rgba(0,255,163,0.9), rgba(34,211,238,0.9))"
                                : "transparent",
                            }}
                          >
                            <Icon size={16} className={is ? "opacity-90" : "opacity-70"} />
                            {name}
                            {is && (
                              <motion.span
                                layoutId="nav-active"
                                className="absolute inset-0 rounded-xl -z-10"
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => setModalOpen(true)}
                      className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-black hover:brightness-110 transition"
                      style={{
                        background: "linear-gradient(135deg, rgba(0,255,163,0.95), rgba(34,211,238,0.95))",
                        boxShadow: "0 6px 30px -10px rgba(0,255,163,0.4)",
                      }}
                    >
                      <Sparkles size={16} /> Log Trade
                    </button>

                    <button
                      className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                      title="Notifications"
                    >
                      <Bell size={18} className="opacity-80" />
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0E0E12]" />
                    </button>

                    {/* Avatar Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setAvatarOpen((s) => !s)}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg.white/10 px-2 py-1.5 border border-white/10"
                      >
                        <span className="inline-grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-white/10 text-[12px] font-bold">
                          {initials}
                        </span>
                        <ChevronDown size={16} className="text-zinc-400" />
                      </button>
                      <AnimatePresence>
                        {avatarOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                            className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
                            onMouseLeave={() => setAvatarOpen(false)}
                          >
                            <div className="px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
                              Signed in as
                              <div className="truncate text-zinc-200 font-medium">{user?.email}</div>
                            </div>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5">
                              <UserIcon size={16} className="opacity-80" />
                              Profile
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5">
                              <SettingsIcon size={16} className="opacity-80" />
                              Settings
                            </button>
                            <div className="border-t border-white/10 my-1" />
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
                              onClick={() => {
                                setAvatarOpen(false);
                                setConfirmLogout(true);
                              }}
                            >
                              <LogOut size={16} />
                              Logout
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                      onClick={() => setMobileMenuOpen((o) => !o)}
                      className="md:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition"
                    >
                      {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.nav
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="md:hidden bg-[rgba(12,12,16,0.96)] backdrop-blur-xl border-b border-white/10 shadow-2xl"
                  style={{
                    paddingTop: "env(safe-area-inset-top)",
                    WebkitPaddingBefore: "env(safe-area-inset-top)",
                  }}
                >
                  <ul className="flex flex-col divide-y divide-white/10">
                    {tabs.map(({ name, icon: Icon }) => {
                      const is = activeTab === name;
                      return (
                        <li key={name}>
                          <motion.button
                            whileTap={{ scale: 0.995 }}
                            onClick={() => setActiveTab(name)}
                            className={`w-full flex items-center gap-4 px-5 py-4 transition-all ${
                              is ? "text-emerald-300 bg-emerald-500/10" : "text-zinc-200 hover:bg-white/5"
                            }`}
                          >
                            <div
                              className={`h-9 w-9 grid place-items-center rounded-lg border ${
                                is ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5"
                              }`}
                            >
                              <Icon size={18} />
                            </div>
                            <span className="text-base font-semibold">{name}</span>
                          </motion.button>
                        </li>
                      );
                    })}
                    <li>
                      <div
                        className="px-5 py-4 flex items-center justify-between"
                        style={{
                          paddingBottom: "env(safe-area-inset-bottom)",
                          WebkitPaddingAfter: "env(safe-area-inset-bottom)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-grid place-items-center h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-white/10 text-sm font-bold">
                            {initials}
                          </span>
                          <div className="text-sm">
                            <div className="text-zinc-200 font-semibold truncate max-w-[180px]">{user?.email}</div>
                            <div className="text-zinc-500 text-xs">Signed in</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmLogout(true)}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </li>
                  </ul>
                </motion.nav>
              )}
            </AnimatePresence>
          </header>

          {/* ===== MAIN CONTENT ===== */}
          <main className="relative flex-1">
            {pageLoading ? (
              <PageLoader pageName={activeTab} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  className="h-full"
                >
                  <PageLayout fullPage={["Dashboard", "Journal", "Library"].includes(activeTab)}>
                    {activeTab === "Dashboard" && <Dashboard />}
                    {activeTab === "Library" && <Library />}
                    {activeTab === "Statistics" && <Statistics />}
                    {activeTab === "Journal" && <JournalPage />}
                  </PageLayout>
                </motion.div>
              </AnimatePresence>
            )}
          </main>

          {/* ===== LOG TRADE MODAL ===== */}
          <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
            <TradeForm
              initialDate={dayjs().format("YYYY-MM-DD")}
              onSave={async (idOrObj, maybeObj) => {
                if (maybeObj !== undefined) await updateTrade(idOrObj, maybeObj);
                else await addTrade(idOrObj);
                setModalOpen(false);
                showToast("✅ Trade logged!");
              }}
              onClose={() => setModalOpen(false)}
            />
          </Modal>

          {/* ===== LOGOUT CONFIRM ===== */}
          <ConfirmDialog
            open={confirmLogout}
            title="Sign out?"
            message="You can sign back in anytime."
            confirmLabel="Logout"
            onCancel={() => setConfirmLogout(false)}
            onConfirm={async () => {
              setConfirmLogout(false);
              setShowAuth(false); // Reset landing state on logout
              await signOut();
            }}
          />

          {/* ===== TOAST ===== */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="fixed bottom-6 right-6 bg-emerald-500 text-black px-4 py-2 rounded-full shadow-lg z-50"
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

/* ============== Confirm Dialog ============== */
function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", onCancel, onConfirm }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur p-5"
          >
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{message}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-xl px-4 py-2 bg-white/5 hover:bg-white/10 text-sm" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="rounded-xl px-4 py-2 text-sm text-black font-semibold hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, rgba(244,63,94,0.95), rgba(251,113,133,0.95))",
                  boxShadow: "0 6px 26px -10px rgba(244,63,94,0.45)",
                }}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}