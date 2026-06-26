/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import CopyEmailButton from "./CopyEmailButton";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} data-header="white">
      {/* First section — brand logo + social */}
      <div className={styles.brandCol}>
        <span className={styles.logo} aria-label="Disclose" />
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.social}
          aria-label="Instagram"
        >
          <img className={styles.socialIcon} src="/icons/Logo%20Instagram.png" alt="Instagram" />
        </a>
        <CopyEmailButton />
      </div>

      {/* Second section — Legal heading + link grid */}
      <div className={styles.legalCol}>
        <span className={styles.legalTitle}>Legal</span>
        <nav className={styles.linkGrid}>
          <Link href="/confidentialite" className={styles.link}>Privacy policy</Link>
          <Link href="/cgu" className={styles.link}>CGU</Link>
          <a href="#" className={styles.link}>Cookie Policy</a>
          <Link href="/contact" className={styles.link}>Contact</Link>
          <a href="#" className={styles.link}>Developers</a>
          <a href="#" className={styles.link}>Ressource Library</a>
        </nav>
      </div>
    </footer>
  );
}
