"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticateAnalytics } from "./actions";
import styles from "./analytics.module.css";

const initialState = { error: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.button} disabled={pending}>
      {pending ? "Vérification..." : "Accéder"}
    </button>
  );
}

export default function CodeGate() {
  const [state, formAction] = useActionState(authenticateAnalytics, initialState);

  return (
    <main className={styles.gatePage}>
      <header className={styles.gateHeader}>
        <div className={styles.logo}>[noname]</div>
        <div className={styles.studio}>by La Source</div>
      </header>

      <div className={styles.gateContainer}>
        <form action={formAction} className={`${styles.gateForm} glass-effect`}>
          <h3>Accès Réservé</h3>
          <p>Entrez le code d'accès pour consulter les analytics.</p>
          <input
            type="password"
            name="code"
            placeholder="Code d'accès"
            className={styles.input}
            autoComplete="off"
            autoFocus
          />
          {state.error && (
            <p className={styles.error}>Code incorrect. Réessayez.</p>
          )}
          <SubmitButton />
        </form>
      </div>

      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
    </main>
  );
}
