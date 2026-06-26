"use client";

import { useState } from "react";
import styles from "./Footer.module.css";

const EMAIL = "hello@disclose-app.com";

export default function CopyEmailButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context) — ignore silently
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={styles.copyEmail}
      aria-label={`Copier l’adresse e-mail ${EMAIL}`}
    >
      <span className={styles.copyEmailText}>{EMAIL}</span>
      <span className={styles.copyEmailHint}>{copied ? "Copié !" : "Copier"}</span>
    </button>
  );
}
