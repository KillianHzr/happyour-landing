"use client";

import { useEffect, useState } from "react";
import styles from "./toast.module.css";

interface ToastProps {
  message: string;
  type?: "error" | "success";
  onClose: () => void;
}

export default function Toast({ message, type = "error", onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Temps pour l'animation de sortie
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${styles[type]} ${visible ? styles.show : styles.hide}`}>
      <div className={styles.content}>
        <span className={styles.icon}>{type === "error" ? "✕" : "✓"}</span>
        <p className={styles.message}>{message}</p>
      </div>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className={styles.close}>
        ✕
      </button>
    </div>
  );
}
