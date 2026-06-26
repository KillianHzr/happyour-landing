"use client";

// Sticky site header.
//  - Reveals on scroll-up, hides on scroll-down, always shown near the very top.
//  - Background (and logo colour, via currentColor) tracks the section currently
//    under the header, read from each section's data-header attribute
//    ("transparent" | "white" | "black").

import { useCallback, useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import styles from "./Header.module.css";
import AnimatedButton from "./AnimatedButton";
import { openStore } from "@/lib/store";

type Mode = "transparent" | "white" | "black";

// Pixel line below the top edge used to decide which section "owns" the header.
const DETECT_LINE = 64;

export default function Header() {
  const [mode, setMode] = useState<Mode>("transparent");
  const [hidden, setHidden] = useState(false);

  const update = useCallback((scroll: number, direction: number) => {
    // Show/hide: always visible near the top, hide going down, reveal going up.
    if (scroll < 80) setHidden(false);
    else if (direction === 1) setHidden(true);
    else if (direction === -1) setHidden(false);

    // Colour mode = the section crossing the detection line under the header.
    const sections = document.querySelectorAll<HTMLElement>("[data-header]");
    let current: Mode = "transparent";
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= DETECT_LINE && rect.bottom > DETECT_LINE) {
        current = (section.dataset.header as Mode) ?? "transparent";
      }
    });
    setMode(current);
  }, []);

  useLenis(({ scroll, direction }) => update(scroll, direction));

  // Set the correct colour on first paint (e.g. when loading already scrolled),
  // deferred to a frame so we measure laid-out sections, not mid-render.
  useEffect(() => {
    const id = requestAnimationFrame(() => update(window.scrollY, -1));
    return () => cancelAnimationFrame(id);
  }, [update]);

  return (
    <header
      className={`${styles.header} ${hidden ? styles.hidden : ""}`}
      data-mode={mode}
    >
      <a href="#" className={styles.logo} aria-label="Disclose" />
      <AnimatedButton onClick={openStore} shortLabel="Télécharger">
        Télécharger l’application
      </AnimatedButton>
    </header>
  );
}
