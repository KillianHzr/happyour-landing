"use client";

// Lenis smooth scrolling, applied to the document root (window scroll).
// Wraps the app in layout.tsx. `root` makes Lenis drive html/body scrolling and
// run its own requestAnimationFrame loop, so no manual raf wiring is needed.

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
