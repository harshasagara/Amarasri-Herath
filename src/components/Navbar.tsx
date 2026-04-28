"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Trophy,
  LineChart,
  History,
  Settings,
  Menu,
  X,
  ArrowLeft,
  Maximize,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Student Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Analytics", href: "/analytics", icon: LineChart },
  { name: "History", href: "/history", icon: History },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [logoZoomed, setLogoZoomed] = useState(false);
  const [showZoomOverlay, setShowZoomOverlay] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login state on mount and listen for changes
  useEffect(() => {
    const checkLogin = () => setIsLoggedIn(!!localStorage.getItem("studentUser"));
    checkLogin();

    // Listen for storage changes (cross-tab) and custom event (same-tab)
    window.addEventListener("storage", checkLogin);
    window.addEventListener("loginStateChanged", checkLogin);
    // Poll periodically as fallback for same-tab localStorage changes
    const interval = setInterval(checkLogin, 500);
    return () => {
      window.removeEventListener("storage", checkLogin);
      window.removeEventListener("loginStateChanged", checkLogin);
      clearInterval(interval);
    };
  }, []);

  // Filter nav items based on login state
  const visibleNavItems = isLoggedIn
    ? navItems
    : navItems.filter((item) => item.href === "/");

  // Double tap / double click detection
  const lastTapRef = useRef<number>(0);
  const handleLogoInteract = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      // Double tap/click
      setShowZoomOverlay(true);
      setLogoZoomed(true);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, []);

  const closeZoomOverlay = () => {
    setShowZoomOverlay(false);
    setLogoZoomed(false);
  };

  return (
    <>
      {/* ===================== NAVBAR ===================== */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between mx-2 mt-2 md:mx-3 md:mt-3 landscape:mx-1 landscape:mt-1 px-3 py-2 md:px-4 md:py-2.5 landscape:px-2 landscape:py-1.5"
        style={{
          background: "rgba(6, 11, 25, 0.72)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: "18px",
          border: "1px solid rgba(220,20,60,0.28)",
          boxShadow:
            "0 0 0 1px rgba(220,20,60,0.08), 0 8px 40px rgba(0,0,0,0.55), 0 0 60px rgba(220,20,60,0.06)",
        }}
      >
        {/* Top shimmer line */}
        <div
          className="absolute top-0 left-10 right-10 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(220,20,60,0.6), rgba(220,20,60,0.5), rgba(255,255,255,0.25), transparent)",
          }}
        />

        {/* ---- LEFT: Logo + Brand ---- */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo wrapper — double tap/click to zoom */}
          <div
            className="relative flex-shrink-0 cursor-pointer select-none w-10 h-10 md:w-12 md:h-12 landscape:w-8 landscape:h-8"
            onClick={handleLogoInteract}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleLogoInteract();
            }}
            title="Double tap to enlarge"
          >
            {/* Rotating conic ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              style={{
                background:
                  "conic-gradient(from 0deg, #3b82f6, #ef4444, #818cf8, #3b82f6)",
                padding: "2.5px",
                borderRadius: "9999px",
              }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{ background: "rgba(6,11,25,1)" }}
              />
            </motion.div>

            {/* Ping halos */}
            <div
              className="absolute rounded-full animate-ping pointer-events-none"
              style={{
                inset: "-5px",
                background: "rgba(59,130,246,0.16)",
                animationDuration: "2s",
              }}
            />
            <div
              className="absolute rounded-full animate-ping pointer-events-none"
              style={{
                inset: "-5px",
                background: "rgba(239,68,68,0.10)",
                animationDuration: "2.8s",
                animationDelay: "0.7s",
              }}
            />

            {/* Static ambient neon glow */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: "-7px",
                boxShadow:
                  "0 0 18px 6px rgba(59,130,246,0.45), 0 0 36px 10px rgba(239,68,68,0.18), 0 0 54px 14px rgba(99,102,241,0.12)",
                borderRadius: "9999px",
              }}
            />

            {/* Logo image */}
            <motion.div
              className="absolute rounded-full overflow-hidden"
              style={{
                inset: "3px",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
              animate={logoZoomed ? { scale: 1.15 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <img
                src="/logo-person.jpg"
                alt="Amarasri Herath Logo"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </motion.div>
          </div>

          {/* Brand text — visible on all screens now */}
          <div className="flex flex-col leading-tight gap-0.5 min-w-0">
            <span
              className="font-black tracking-tight truncate"
              style={{
                fontSize: "clamp(13px, 3vw, 19px)",
                background:
                  "linear-gradient(90deg, #DC143C, #ffffff, #DC143C, #ffffff)",
                backgroundSize: "250% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "gradientShift 3.5s linear infinite",
                filter: "drop-shadow(0 0 6px rgba(220,20,60,0.4))",
              }}
            >
              Amarasri Herath
            </span>
            <span
              className="font-bold uppercase truncate"
              style={{
                fontSize: "clamp(7px, 1.5vw, 9px)",
                letterSpacing: "0.18em",
                background:
                  "linear-gradient(90deg, rgba(220,20,60,0.85), rgba(255,255,255,0.85))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ✦ Master of IQ ✦
            </span>
          </div>
        </div>

        {/* ---- CENTER: Desktop Nav with Sliding Glass Pill ---- */}
        <div className="hidden md:flex items-center gap-1 relative">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-200"
                style={{
                  color: isActive ? "#fff" : "rgba(148,163,184,0.85)",
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = "rgba(148,163,184,0.85)";
                  }
                }}
              >
                {/* Sliding glass box — only renders on active tab */}
                {isActive && (
                  <motion.div
                    layoutId="nav-glass-pill"
                    className="absolute inset-0 rounded-xl nav-sliding-glass"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(220,20,60,0.22), rgba(220,20,60,0.12))",
                      border: "1px solid rgba(220,20,60,0.45)",
                      boxShadow:
                        "0 0 18px rgba(220,20,60,0.25), 0 0 40px rgba(220,20,60,0.08), inset 0 1px 0 rgba(255,255,255,0.1)",
                      zIndex: -1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                      mass: 0.8,
                    }}
                  />
                )}
                <Icon className="w-4 h-4 flex-shrink-0 relative z-[1]" />
                <span className="hidden lg:inline relative z-[1]">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* ---- RIGHT: Badge + Mobile Menu ---- */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* System Active badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
            style={{
              background: "rgba(16,185,129,0.09)",
              border: "1px solid rgba(16,185,129,0.32)",
              color: "rgba(52,211,153,0.95)",
              boxShadow:
                "0 0 10px rgba(16,185,129,0.18), inset 0 0 6px rgba(16,185,129,0.05)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="hidden lg:inline">System Active</span>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl text-white transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-5 h-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* ===================== MOBILE NAV OVERLAY ===================== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-40 flex flex-col gap-2 md:hidden"
            style={{
              background: "rgba(6,11,25,0.97)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              paddingTop: "88px",
              paddingLeft: "16px",
              paddingRight: "16px",
              paddingBottom: "24px",
            }}
          >
            {visibleNavItems.map((item, i) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all w-full"
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(135deg, rgba(220,20,60,0.2), rgba(220,20,60,0.12))",
                            border: "1px solid rgba(220,20,60,0.4)",
                            color: "#fff",
                            boxShadow: "0 0 20px rgba(220,20,60,0.2)",
                          }
                        : {
                            color: "rgba(255,255,255,0.7)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            background: "rgba(255,255,255,0.02)",
                          }
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                </motion.div>
              );
            })}

            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: visibleNavItems.length * 0.06 }}
              onClick={() => {
                setIsOpen(false);
                const docElm = document.documentElement;
                if (docElm.requestFullscreen) {
                  docElm.requestFullscreen().then(() => {
                    if (screen.orientation && (screen.orientation as any).lock) {
                      (screen.orientation as any).lock("landscape").catch((e: any) => console.log(e));
                    }
                  }).catch((e: any) => console.log(e));
                }
              }}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all w-full text-left"
              style={{
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <Maximize className="w-5 h-5 flex-shrink-0" />
              Landscape Mode (16:9)
            </motion.button>

            {/* Bottom badge in mobile */}
            <div className="mt-auto flex items-center justify-center gap-2 py-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "rgba(52,211,153,0.8)" }}
              >
                System Active
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== LOGO ZOOM OVERLAY (Double tap) ===================== */}
      <AnimatePresence>
        {showZoomOverlay && (
          <motion.div
            key="logo-zoom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(16px)",
            }}
            onClick={closeZoomOverlay}
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Big logo */}
              <div className="relative" style={{ width: 200, height: 200 }}>
                {/* Rotating ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  style={{
                    background:
                      "conic-gradient(from 0deg, #3b82f6, #ef4444, #818cf8, #3b82f6)",
                    padding: "4px",
                    borderRadius: "9999px",
                  }}
                >
                  <div
                    className="w-full h-full rounded-full"
                    style={{ background: "rgba(6,11,25,1)" }}
                  />
                </motion.div>
                {/* Ambient glow */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: "-20px",
                    boxShadow:
                      "0 0 60px 20px rgba(59,130,246,0.4), 0 0 100px 30px rgba(239,68,68,0.2), 0 0 140px 40px rgba(99,102,241,0.15)",
                    borderRadius: "9999px",
                  }}
                />
                {/* Ping halos */}
                <div
                  className="absolute rounded-full animate-ping pointer-events-none"
                  style={{
                    inset: "-10px",
                    background: "rgba(59,130,246,0.12)",
                    animationDuration: "1.8s",
                  }}
                />
                {/* Image */}
                <div
                  className="absolute rounded-full overflow-hidden"
                  style={{
                    inset: "5px",
                    border: "2px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <img
                    src="/logo-person.jpg"
                    alt="Amarasri Herath Logo"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Name under zoomed logo */}
              <div className="flex flex-col items-center gap-1 text-center">
                <span
                  className="text-3xl font-black tracking-tight"
                  style={{
                    background:
                      "linear-gradient(90deg, #DC143C, #ffffff, #DC143C, #ffffff)",
                    backgroundSize: "250% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "gradientShift 3s linear infinite",
                    filter: "drop-shadow(0 0 10px rgba(220,20,60,0.5))",
                  }}
                >
                  Amarasri Herath
                </span>
                <span
                  className="text-sm font-semibold uppercase tracking-[0.25em]"
                  style={{ color: "rgba(148,163,184,0.7)" }}
                >
                  ✦ Master of IQ ✦
                </span>
              </div>

              {/* Buttons under zoomed logo */}
              <div className="flex flex-col items-center gap-3 mt-2">
                <Link
                  href={pathname === "/admin" ? "/" : "/admin"}
                  onClick={closeZoomOverlay}
                  className="px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                  style={{
                    background: pathname === "/admin" 
                      ? "linear-gradient(135deg, rgba(220,20,60,0.15), rgba(220,20,60,0.25))"
                      : "linear-gradient(135deg, rgba(220,20,60,0.15), rgba(220,20,60,0.25))",
                    border: pathname === "/admin"
                      ? "1px solid rgba(220,20,60,0.4)"
                      : "1px solid rgba(220,20,60,0.4)",
                    color: "#fff",
                    boxShadow: pathname === "/admin"
                      ? "0 0 20px rgba(220,20,60,0.2)"
                      : "0 0 20px rgba(220,20,60,0.2)",
                  }}
                >
                  {pathname === "/admin" ? (
                    <>
                      <ArrowLeft className="w-4 h-4" /> Back to Home
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4" /> Admin Login
                    </>
                  )}
                </Link>

                <button
                  onClick={closeZoomOverlay}
                  className="px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white/5"
                  style={{
                    color: "rgba(148,163,184,0.6)",
                  }}
                >
                  Tap anywhere to close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
