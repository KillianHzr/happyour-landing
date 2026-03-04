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

      <section className={styles.features}>
        <div className={styles.featureCard}>
          <h3>Captures</h3>
          <p>Photos, vocaux, vidéos, dessins... Immortalisez votre quotidien sans filtre.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Cercles Intimes</h3>
          <p>Un espace réservé à vos amis les plus proches, loin du bruit des réseaux sociaux.</p>
        </div>
        <div className={styles.featureCard}>
          <h3>Le Rewind</h3>
          <p>À la fin de la semaine, découvrez le condensé de vos moments et ceux de vos potes.</p>
        </div>
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
