"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import DownloadSection from "@/components/DownloadSection";
import EmailVerified from "@/components/EmailVerified";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirection automatique si on détecte un hash de récupération de mot de passe
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      router.replace("/reset-password" + window.location.hash);
    }
  }, [router]);

  return (
    <main className={styles.main}>
      <EmailVerified />
      <header className={styles.header}>
        <div className={styles.logo}>[noname]</div>
        <div className={styles.studio}>by La Source</div>
      </header>

      <section className={styles.hero}>
        <div className={styles.badge}>Beta Test Privée</div>
        <h1 className={styles.title}>Bienvenue dans la beta.</h1>
        <p className={styles.subtitle}>
          Capturez vos moments. Partagez l'intime. Revivez votre semaine.
        </p>
      </section>

      <DownloadSection />

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Studio La Source. Tous droits réservés.</p>
      </footer>

      {/* Background decoration (black/grey only) */}
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
    </main>
  );
}

