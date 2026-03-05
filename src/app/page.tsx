import styles from "./page.module.css";
import DownloadSection from "@/components/DownloadSection";

export default function Home() {
  return (
    <main className={styles.main}>
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
