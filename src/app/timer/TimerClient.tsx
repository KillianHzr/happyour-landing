"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DiscloseLogo from "./DiscloseLogo";
import styles from "./timer.module.css";

const START_MS = 30 * 60 * 1000; // 30 minutes → 00:30:00
const FAST_MULTIPLIER = 6; // "k" makes the clock run x6 faster
const SLOW_MULTIPLIER = 1 / 6; // "j" makes the clock run x6 slower
const SYNC_MS = 30 * 1000; // "l" re-times the clock to hit 0 in 30 seconds

function format(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

export default function TimerClient() {
  // Remaining time lives in a ref so the rAF loop stays stable; `display` mirrors
  // it for rendering. `running` / `fast` drive the loop and re-render the chrome.
  const remainingRef = useRef(START_MS);
  const lastTickRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [display, setDisplay] = useState(START_MS);
  const [running, setRunning] = useState(true);

  // Speed multiplier applied to the countdown (1 = real time). "k" toggles x6
  // faster, "j" toggles x6 slower, "l" sets a dynamic rate so the clock reaches
  // 0 in exactly 30 seconds.
  const rateRef = useRef(1);

  // Mirror state into refs so the stable rAF loop reads the latest values.
  const runningRef = useRef(running);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  // Single requestAnimationFrame loop using elapsed wall-clock time, so the
  // countdown stays accurate regardless of frame rate.
  useEffect(() => {
    const tick = (now: number) => {
      if (lastTickRef.current == null) lastTickRef.current = now;
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      if (runningRef.current && remainingRef.current > 0) {
        remainingRef.current = Math.max(0, remainingRef.current - delta * rateRef.current);
        setDisplay(remainingRef.current);
        if (remainingRef.current === 0) setRunning(false);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    // Don't resume a finished timer on click.
    if (remainingRef.current <= 0) return;
    setRunning((r) => !r);
  }, []);

  // Keyboard controls:
  //   "k" toggles the x6 fast-forward so the timer reaches 0 sooner.
  //   "j" toggles the x6 slow-down so the timer reaches 0 later.
  //   "l" re-times the countdown so it hits 0 in 30s from now — press it again
  //       anytime to re-sync (e.g. to land the end of a speech on 0).
  //   "t" jumps the timer straight to 0 (triggers the logo reveal).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "k") {
        e.preventDefault();
        rateRef.current = rateRef.current === FAST_MULTIPLIER ? 1 : FAST_MULTIPLIER;
      } else if (key === "j") {
        e.preventDefault();
        rateRef.current = rateRef.current === SLOW_MULTIPLIER ? 1 : SLOW_MULTIPLIER;
      } else if (key === "l") {
        e.preventDefault();
        if (remainingRef.current > 0) {
          // Constant rate over 30s lands the clock on exactly 0 at t = 30s.
          rateRef.current = remainingRef.current / SYNC_MS;
          setRunning(true);
        }
      } else if (key === "t") {
        e.preventDefault();
        remainingRef.current = 0;
        setDisplay(0);
        setRunning(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const done = display <= 0;

  return (
    <main
      className={styles.page}
      onClick={toggle}
      role="button"
      tabIndex={0}
      aria-label={running ? "Mettre en pause" : "Reprendre"}
    >
      <div className={styles.center}>
        {done ? (
          <DiscloseLogo className={styles.logo} />
        ) : (
          <time
            className={styles.time}
            dateTime={`PT${Math.ceil(display / 1000)}S`}
          >
            {format(display)
              .split("")
              .map((ch, i) => (
                <span
                  key={i}
                  className={ch === ":" ? styles.colon : styles.digit}
                >
                  {ch}
                </span>
              ))}
          </time>
        )}
      </div>
    </main>
  );
}
