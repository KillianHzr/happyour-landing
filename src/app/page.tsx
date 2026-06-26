"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import EmailVerified from "@/components/EmailVerified";
import Toast from "@/components/Toast";
import HeroCursorTrail from "@/components/HeroCursorTrail";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShutterTransition from "@/components/ShutterTransition";
import AnimatedButton from "@/components/AnimatedButton";
import { FlowerShape, SmileShape, PillowShape, DotShape, StackShape, HornShape, RingShape } from "@/components/shapes";
import { initShutterScrollTransition } from "@/app/javascript/shutter-transition";
import { openStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build every shutter transition once, after all wrappers are in the DOM.
  useEffect(() => {
    const cleanup = initShutterScrollTransition();
    return () => cleanup?.();
  }, []);

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
        <div className={styles.logo} style={{ opacity: 0.8 }}>HappyOur</div>
        <p style={{ marginTop: "1rem", opacity: 0.5, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Redirection sécurisée...
        </p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Header />
      <EmailVerified />

      {error && (
        <Toast
          message={error}
          type="error"
          onClose={() => setError(null)}
        />
      )}

      {/* Section 1 — Hero */}
      <section className={`ds-section ${styles.hero}`} data-trail="wrapper" data-header="transparent">
        <HeroCursorTrail />

        <div className={`ds-stack ds-center ds-gap-64 ${styles.heroContent}`}>
          <div className={`ds-stack ds-center ds-gap-xl ${styles.heroText}`}>
            <h1 className="ds-title ds-text-inverse">Aucun algorithmes. Juste tes potes</h1>
            <p className="ds-subheading ds-text-inverse">
              La seule application sociale qui instaure un moment commun pour la (re)découverte du quotidien de tes proches !
            </p>
          </div>
          <AnimatedButton
            onClick={openStore}
            shortLabel="Télécharger l’application"
            className={styles.heroButton}
          >
            Télécharger l’application
          </AnimatedButton>
        </div>

        {/* Wipe into the white Capture section */}
        <ShutterTransition color="#ffffff" />
      </section>

      {/* Section 2 — Capture (grey) */}
      <section className={`${styles.feature} ${styles.featureGrey}`} data-header="white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.featurePhone} src="/img/phone.png" alt="" />

        <div className={styles.featureMiddle}>
          <div className={styles.featureText}>
            <h2 className="ds-title-hero ds-text-default">Capture</h2>
            <p className="ds-subheading ds-text-default">
              Capture des moments tout au long de la semaine que ça soit de la vidéo, des photos ou du dessin !
            </p>
          </div>
          <div className={styles.featureIcons}>
            <FlowerShape className={styles.featureIcon} />

            <PillowShape className={styles.featureIcon} />
            <SmileShape className={styles.featureIcon} />
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.featureSideImage} src="/img/section_image_1.jpg" alt="" />

        {/* Wipe into the dark Enrichit section */}
        <ShutterTransition color="#0c0c0d" />
      </section>

      {/* Section 4 — Enrichit (dark, reversed) */}
      <section className={`${styles.feature} ${styles.featureReverse}`} data-theme="dark" data-header="black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.featurePhone} src="/img/phone_2.png" alt="" />

        <div className={styles.featureMiddle}>
          <div className={styles.featureText}>
            <h2 className="ds-title-hero ds-text-default">Enrichit</h2>
            <p className={`ds-subheading ${styles.subOnDark}`}>
              Rajoute du contexte à tout ces moments grâce à l’ajout de description vocal ou textuelle !
            </p>
          </div>
          <div className={styles.featureIcons}>
            <StackShape className={styles.featureIcon} />
            <HornShape className={styles.featureIcon} />
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.featureSideImage} src="/img/section_image_2.png" alt="" />

        {/* Wipe into the white Attends section */}
        <ShutterTransition color="#ffffff" />
      </section>

      {/* Section 5 — Attends (grey) */}
      <section className={`${styles.feature} ${styles.featureGrey}`} data-header="white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.featurePhone} src="/img/phone_3.png" alt="" />

        <div className={styles.featureMiddle}>
          <div className={styles.featureText}>
            <h2 className="ds-title-hero ds-text-default">Attends</h2>
            <p className="ds-subheading ds-text-default">
              Tout au long de la semaine les moments sont cachés et s’accumule, apprends à prendre le temps d’attendre.
            </p>
          </div>
          <div className={styles.featureIcons}>
            <DotShape className={styles.featureIcon} />
            <DotShape className={styles.featureIcon} />


            <DotShape className={styles.featureIcon} />

          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.featureSideImage} src="/img/section_image_3.jpg" alt="" />

        {/* Wipe into the dark Revis section */}
        <ShutterTransition color="#0c0c0d" />
      </section>

      {/* Section 6 — Revis (black, text block + 3 phones) */}
      <section className={styles.showcase} data-theme="dark" data-header="black">
        <div className={styles.showcaseText}>
          <div className={styles.showcaseCopy}>
            <h2 className="ds-title-hero ds-text-default">Reveal</h2>
            <p className={`ds-subheading ${styles.subOnDark}`}>
              En fin de semaine, le dimanche à 20h, fin du suspens. Tout les moments sont dévoilés ! Profite de cet instant pour rédécouvrir le quotidien de tes proches et le tiens en meme temps qu’eux !
            </p>
          </div>
                      <RingShape className={styles.featureIcon} />

        </div>

        <div className={styles.showcasePhones}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.showcasePhone} src="/img/phone.png" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.showcasePhone} src="/img/phone_2.png" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.showcasePhone} src="/img/phone_3.png" alt="" />
        </div>
      </section>

      <Footer />

      {/* Background decoration (black/grey only) */}
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
    </main>
  );
}
