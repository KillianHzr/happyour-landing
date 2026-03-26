"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import DownloadSection from "@/components/DownloadSection";
import EmailVerified from "@/components/EmailVerified";
import Toast from "@/components/Toast";

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      
      // Cas 1 : Lien de récupération valide
      if (hash.includes("type=recovery") && !hash.includes("error")) {
        setIsRedirecting(true);
        router.replace("/reset-password" + hash);
        return;
      }

      // Cas 2 : Erreur (Lien expiré, etc.)
      if (hash.includes("error=access_denied") || hash.includes("error_code=otp_expired")) {
        setError("Le lien est invalide ou a expiré. Merci de refaire une demande.");
        // Nettoyer l'URL sans recharger
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [router]);

  if (isRedirecting) {
    return (
      <main className={styles.main} style={{ justifyContent: "center" }}>
        <div className={styles.logo} style={{ opacity: 0.8 }}>[noname]</div>
        <p style={{ marginTop: "1rem", opacity: 0.5, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Redirection sécurisée...
        </p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <EmailVerified />
      
      {error && (
        <Toast 
          message={error} 
          type="error" 
          onClose={() => setError(null)} 
        />
      )}

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
