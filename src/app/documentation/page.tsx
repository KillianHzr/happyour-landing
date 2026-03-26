import type { Metadata } from "next";
import styles from "./documentation.module.css";
import pageStyles from "../page.module.css";

export const metadata: Metadata = {
  title: "[noname] — Documentation",
  description: "Documentation de l'application [noname].",
};

export default function DocumentationPage() {
  return (
    <main className={pageStyles.main}>
      <header className={pageStyles.header}>
        <div className={pageStyles.logo}>[noname]</div>
        <div className={pageStyles.studio}>by La Source</div>
      </header>

      <section className={pageStyles.hero}>
        <div className={pageStyles.badge}>Documentation</div>
        <h1 className={pageStyles.title}>En construction.</h1>
        <p className={pageStyles.subtitle}>
          La documentation arrive bientôt.
        </p>
      </section>

      <div className={pageStyles.bgGlow1} />
      <div className={pageStyles.bgGlow2} />
    </main>
  );
}
