"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import styles from "./reset-password.module.css";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setMessage({ type: "error", text: "Configuration Supabase manquante (NEXT_PUBLIC_...)." });
      setChecking(false);
      return;
    }

    // Analyse du hash d'URL pour les erreurs Supabase (type=recovery_expired etc)
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("error=access_denied") || hash.includes("error_code=otp_expired")) {
      setMessage({ 
        type: "error", 
        text: "Le lien de réinitialisation est invalide ou a expiré. Merci de refaire une demande depuis l'application." 
      });
      setChecking(false);
      return;
    }

    // Tentative de récupération de session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Le mot de passe doit faire au moins 6 caractères." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMessage({ type: "success", text: "Ton mot de passe a été mis à jour avec succès !" });
      setPassword("");
      setConfirmPassword("");
      
      // On déconnecte après succès
      await supabase.auth.signOut();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Une erreur est survenue." });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className={styles.main}>
        <div className={styles.card}>
          <p className={styles.subtitle}>Vérification du lien...</p>
        </div>
      </main>
    );
  }

  if (!session && message?.type === "error") {
    return (
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.logo}>[noname]</div>
          <div className={styles.studio}>by La Source</div>
        </header>
        <div className={styles.card}>
          <h1 className={styles.title}>Lien invalide</h1>
          <div className={`${styles.message} ${styles.error}`}>
            {message.text}
          </div>
          <p className={styles.subtitle} style={{ marginTop: "1rem" }}>
            Retourne sur l'application [noname] pour demander un nouveau lien.
          </p>
        </div>
      </main>
    );
  }

  if (!session && !loading && !message) {
    return (
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.logo}>[noname]</div>
          <div className={styles.studio}>by La Source</div>
        </header>
        <div className={styles.card}>
          <h1 className={styles.title}>Lien invalide</h1>
          <p className={styles.subtitle}>
            Ce lien est expiré ou corrompu. Merci de refaire une demande depuis l'application.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logo}>[noname]</div>
        <div className={styles.studio}>by La Source</div>
      </header>

      <div className={styles.card}>
        <h1 className={styles.title}>Nouveau mot de passe</h1>
        <p className={styles.subtitle}>Choisis un mot de passe sécurisé pour ton compte.</p>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {message?.type !== "success" && (
          <form className={styles.form} onSubmit={handleReset}>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Nouveau mot de passe</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
            </button>
          </form>
        )}

        {message?.type === "success" && (
          <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.875rem", opacity: 0.6 }}>
            Tu peux maintenant retourner sur l'application pour te connecter.
          </p>
        )}
      </div>

      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
    </main>
  );
}
