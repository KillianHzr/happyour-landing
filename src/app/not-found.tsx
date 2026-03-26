import Link from "next/link";
import styles from "./page.module.css";

export default function NotFound() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logo}>[noname]</div>
        <div className={styles.studio}>by La Source</div>
      </header>

      <section className={styles.hero}>
        <div className={styles.badge}>Erreur 404</div>
        <h1 className={styles.title}>Page introuvable.</h1>
        <p className={styles.subtitle}>
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link href="/" style={{ marginTop: "2rem", display: "inline-block", color: "#888", fontSize: "0.9rem", textDecoration: "underline" }}>
          Retour à l'accueil
        </Link>
      </section>

      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
    </main>
  );
}
