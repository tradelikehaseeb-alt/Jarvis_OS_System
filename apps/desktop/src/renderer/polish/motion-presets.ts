import type { Transition, Variants } from "framer-motion";

/** Shared Framer Motion presets for Jarvis UI (Phase 92). */
export const JARVIS_EASE: Transition["ease"] = [0.22, 1, 0.36, 1];

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

export const orbPulse: Variants = {
  idle: { scale: 1, opacity: 0.85 },
  active: {
    scale: [1, 1.04, 1],
    opacity: [0.85, 1, 0.85],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
};

export const overlayTransition: Transition = {
  duration: 0.28,
  ease: JARVIS_EASE,
};

export const panelTransition: Transition = {
  duration: 0.32,
  ease: JARVIS_EASE,
};
