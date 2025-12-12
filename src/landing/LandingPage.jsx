// src/LandingPage.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  ArrowRight, 
  BarChart2, 
  ShieldCheck, 
  Zap, 
  Layout, 
  Calendar, 
  Target, 
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  Smartphone
} from "lucide-react";

// --- ASSETS ---
import Logo from "/src/landing/ZtraderLogo.png";

// IMPORTANT: Ensure these filenames match exactly what you have in src/assets/
import DashboardHeroImg from "/src/landing/Dashboard.png";   // Main Dashboard
import StatsImg from "/src/landing/Statistics.png";           // Statistics Graph
import JournalPlanImg from "/src/landing/Journal.png";          // Pre-Market Plan
import TradeDetailImg from "/src/landing/Tradeview.png";        // Trade Details
import LibraryImg from "/src/landing/Library.png";              // Grid View
import MobileImg from "/src/landing/phone.png";                 // Mobile View

// --- COMPONENTS ---

const Navbar = ({ onLoginClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-[#0B0B0C]/80 backdrop-blur-xl border-white/10 py-3"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={Logo} alt="ZTrader" className="h-8 w-auto" />
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">ZTraderJournal</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#philosophy" className="hover:text-white transition-colors">Philosophy</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#showcase" className="hover:text-white transition-colors">Interface</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={onLoginClick}
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Log In
          </button>
          <button 
            onClick={onLoginClick}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-black transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #00FFA3 0%, #06b6d4 100%)",
              boxShadow: "0 0 20px -5px rgba(0, 255, 163, 0.4)"
            }}
          >
            Get Access
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0B0B0C] border-b border-white/10 overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-4 text-center">
              <a href="#features" onClick={() => setMobileOpen(false)} className="text-zinc-400">Features</a>
              <button onClick={onLoginClick} className="text-white font-semibold">Log In</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ onLoginClick }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden px-6">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-emerald-500/10 opacity-30 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-emerald-400 mb-8 backdrop-blur-md">
            <Zap size={12} className="fill-emerald-400" />
            <span>The Professional Trading Operating System</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
            Your Trading Command Center. <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Not Just a Journal.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Designed for traders who want consistency, discipline, and growth. 
            Stop just tracking <em>what</em> you traded. Start tracking <em>why</em>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button 
              onClick={onLoginClick}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-black bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(0,255,163,0.3)]"
            >
              Start Your Command Center
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              View Live Demo
            </button>
          </div>
        </motion.div>

        {/* 3D Dashboard Mockup using the Main Dashboard Image */}
        <motion.div 
          style={{ y, opacity }}
          className="relative max-w-6xl mx-auto perspective-1000"
        >
          <div 
            className="relative rounded-xl bg-[#0E0E12] p-2 border border-white/10 shadow-2xl overflow-hidden group"
            style={{ 
              transform: "rotateX(20deg) scale(0.95)",
              boxShadow: "0 50px 100px -20px rgba(0,0,0,0.7)"
            }}
          >
            <img 
              src={DashboardHeroImg} 
              alt="Dashboard" 
              className="rounded-lg w-full h-auto opacity-100 group-hover:opacity-95 transition-opacity"
            />
            {/* Gloss Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Philosophy = () => {
  return (
    <section id="philosophy" className="py-24 bg-[#0B0B0C] relative border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">Core Philosophy</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">Why Traders actually stick with ZTraderJournal.</h3>
            <p className="text-zinc-400 text-lg mb-8">
              Most traders fail not because of strategy, but because of emotional decisions and poor adherence to rules. Spreadsheets can't fix psychology.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="p-3 rounded-full bg-red-500/10 text-red-400 h-fit">
                  <XCircle size={24} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">The Old Way</h4>
                  <p className="text-zinc-400 text-sm">Cluttered spreadsheets, fragmented notes, mental tracking, and forgotten rules.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 h-fit">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">The ZTrader Way</h4>
                  <p className="text-zinc-300 text-sm">Psychology tracking, daily rules, performance analytics, and session planning in one OS.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 blur-[100px] rounded-full opacity-40" />
             <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-[#121215] p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                  <BrainCircuit size={40} className="text-purple-400 mb-4" />
                  <span className="text-white font-semibold">Psychology</span>
                </div>
                <div className="bg-[#121215] p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center mt-8">
                  <ShieldCheck size={40} className="text-emerald-400 mb-4" />
                  <span className="text-white font-semibold">Discipline</span>
                </div>
                <div className="bg-[#121215] p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center -mt-8">
                  <Target size={40} className="text-cyan-400 mb-4" />
                  <span className="text-white font-semibold">Targets</span>
                </div>
                <div className="bg-[#121215] p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                  <BarChart2 size={40} className="text-orange-400 mb-4" />
                  <span className="text-white font-semibold">Analytics</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const BentoGrid = () => {
  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Built for the 1% <br /> who treat this as a business.</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          No clutter. No friction. Just the tools you need to execute.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* Large Item: Analytics Graph */}
        <div className="md:col-span-2 row-span-2 rounded-3xl bg-[#0E0E12] border border-white/10 p-0 relative overflow-hidden group">
          <div className="absolute top-6 left-6 z-10 bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/10">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-emerald-400" />
              <span className="text-sm font-bold text-white">Performance Analytics</span>
            </div>
          </div>
          <img 
            src={StatsImg} 
            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" 
            alt="Statistics UI"
          />
          {/* Bottom Gradient for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0E0E12] to-transparent" />
          <div className="absolute bottom-6 left-6 z-10">
             <h3 className="text-2xl font-bold text-white mb-1">Visualise Your Edge</h3>
             <p className="text-zinc-400 text-sm">Know your best setups, session performance, and equity curve in real-time.</p>
          </div>
        </div>

        {/* Tall Item: Rules & Discipline (Pre-Market Plan) */}
        <div className="md:col-span-1 row-span-2 rounded-3xl bg-[#0E0E12] border border-white/10 p-0 flex flex-col relative overflow-hidden group">
           <div className="absolute top-6 left-6 z-10 bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/10">
             <div className="flex items-center gap-2">
               <ShieldCheck size={16} className="text-cyan-400" />
               <span className="text-sm font-bold text-white">Discipline Engine</span>
             </div>
           </div>
           
           <img 
              src={JournalPlanImg} 
              className="absolute inset-0 w-full h-full object-cover object-left-top opacity-80 group-hover:opacity-100 transition-opacity duration-500"
              alt="Pre-Market Plan"
           />
           <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/80 to-transparent" />
           
           <div className="absolute bottom-6 left-6 right-6 z-10">
              <h3 className="text-xl font-bold text-white mb-2">Plan Your Trade. Trade Your Plan.</h3>
              <p className="text-zinc-400 text-sm">Force yourself to check off rules before you even look at a chart.</p>
           </div>
        </div>

        {/* Wide Item: Mobile Responsiveness */}
        <div className="md:col-span-3 rounded-3xl bg-[#0E0E12] border border-white/10 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="flex-1 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 mb-4">
               <Smartphone size={14} />
               <span>Mobile Optimized</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Your Edge, Anywhere.</h3>
            <p className="text-zinc-400">
              Fully responsive design allows you to review trades, check your P&L, and journal your thoughts from your phone. 
              Never miss a review session just because you aren't at your desk.
            </p>
          </div>
          <div className="flex-1 w-full h-64 md:h-auto flex items-center justify-center relative">
             {/* Glowing effect behind phone */}
             <div className="absolute w-40 h-40 bg-emerald-500/20 blur-[80px] rounded-full" />
             <img 
               src={MobileImg} 
               alt="Mobile App View" 
               className="h-full w-auto object-contain drop-shadow-2xl rotate-[-5deg] hover:rotate-0 transition-transform duration-500"
               style={{ maxHeight: "300px" }}
             />
          </div>
        </div>

      </div>
    </section>
  );
};

// --- INTERACTIVE FEATURE TABS ---
const featureTabs = [
  {
    id: 'logging',
    label: 'Detailed Logging',
    title: 'Log trades in seconds, not minutes.',
    desc: 'Capture everything: Entry, Exit, Fees, and Screenshots. Tag your strategy and track your psychological state.',
    icon: Zap,
    img: TradeDetailImg 
  },
  {
    id: 'library',
    label: 'Trade Library',
    title: 'Your entire history, organized.',
    desc: 'Filter by date, strategy, or outcome. Review past winning streaks to regain confidence.',
    icon: Layout,
    img: LibraryImg 
  },
  {
    id: 'calendar',
    label: 'Dashboard',
    title: 'The command center.',
    desc: 'Daily streak tracking, P&L targets, and rule adherence all in one view.',
    icon: Calendar,
    img: DashboardHeroImg
  }
];

const InteractiveShowcase = () => {
  const [activeTab, setActiveTab] = useState(featureTabs[0]);

  return (
    <section id="showcase" className="py-24 bg-[#0B0B0C] relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Controls */}
          <div className="lg:w-1/3 flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-white mb-6">See it in action</h2>
            {featureTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab)}
                className={`text-left p-6 rounded-2xl border transition-all duration-300 ${
                  activeTab.id === tab.id 
                    ? "bg-[#1A1A1E] border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(0,255,163,0.15)]" 
                    : "bg-transparent border-transparent hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <tab.icon size={20} className={activeTab.id === tab.id ? "text-emerald-400" : "text-zinc-500"} />
                  <span className={`font-bold ${activeTab.id === tab.id ? "text-white" : "text-zinc-400"}`}>
                    {tab.label}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {tab.title}
                </p>
              </button>
            ))}
          </div>

          {/* Preview Window */}
          <div className="lg:w-2/3">
             <div className="relative h-[400px] md:h-[500px] rounded-3xl bg-[#0E0E12] border border-white/10 p-2 shadow-2xl overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full relative"
                  >
                    <img 
                      src={activeTab.img} 
                      alt={activeTab.label} 
                      className="w-full h-full object-cover object-top rounded-2xl"
                    />
                    {/* Gradient Fade at bottom to blend image if it's too long */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0E0E12] to-transparent" />
                    
                    {/* Floating Caption */}
                    <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10">
                      <p className="text-emerald-400 font-bold mb-1">{activeTab.title}</p>
                      <p className="text-zinc-300 text-sm">{activeTab.desc}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const CTA = ({ onLoginClick }) => (
  <section className="py-32 relative overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C] to-emerald-950/20 pointer-events-none" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

    <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
      <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Ready to scale your edge?</h2>
      <p className="text-xl text-zinc-400 mb-10">
        Join the traders who are treating this as a career, not a casino. 
        One avoided revenge trade pays for a lifetime of access.
      </p>
      <button 
        onClick={onLoginClick}
        className="px-10 py-5 rounded-full font-bold text-black text-lg transition-transform hover:scale-105"
        style={{ 
          background: "linear-gradient(135deg, #00FFA3 0%, #22d3ee 100%)",
          boxShadow: "0 0 50px -15px rgba(0,255,163,0.6)" 
        }}
      >
        Start Trading Professionally
      </button>
      <p className="mt-6 text-sm text-zinc-500">No credit card required for trial.</p>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-[#050505] py-12 border-t border-white/10 text-sm text-zinc-500">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
           <img src={Logo} alt="Logo" className="h-6 w-auto grayscale opacity-50" />
           <span className="font-semibold text-zinc-400">ZTraderJournal</span>
        </div>
        <p className="text-xs">© 2025 ZTrader. Built for consistency.</p>
      </div>
      <div className="flex gap-8">
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <a href="#" className="hover:text-white transition-colors">Terms</a>
        <a href="#" className="hover:text-white transition-colors">Twitter</a>
      </div>
    </div>
  </footer>
);

export default function LandingPage({ onLoginClick }) {
  // If the user didn't pass a prop (testing mode), we just log it
  const handleLogin = onLoginClick || (() => console.log("Navigate to Auth"));

  return (
    <div className="min-h-screen w-full bg-[#0B0B0C] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <Navbar onLoginClick={handleLogin} />
      <Hero onLoginClick={handleLogin} />
      <Philosophy />
      <BentoGrid />
      <InteractiveShowcase />
      <CTA onLoginClick={handleLogin} />
      <Footer />
    </div>
  );
}