"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./contact.module.css";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: wire this up to your email service / backend endpoint.
    setSubmitted(true);
  };

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <Link href="/" className={styles.back}>
          ← Retour à l’accueil
        </Link>

        <header className={styles.head}>
          <h1 className="ds-title ds-text-default">Contact</h1>
          <p className="ds-subheading ds-text-default">
            Une question, un bug, une idée ? Écris-nous, on te répond vite.
          </p>
        </header>

        {submitted ? (
          <p className={styles.success}>Merci ! Ton message a bien été envoyé.</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>Nom</span>
              <input className={styles.input} type="text" name="name" required />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <input className={styles.input} type="email" name="email" required />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Message</span>
              <textarea className={styles.textarea} name="message" rows={5} required />
            </label>

            <button type="submit" className="ds-button">
              Envoyer
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
