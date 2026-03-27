"use client";

import { useState } from "react";
import styles from "./DownloadSection.module.css";

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
    <path fill="#ffffff" d="M17.05 20.28c-.98.95-2.05.8-3.08.35c-1.09-.46-2.09-.48-3.24 0c-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8c1.18-.24 2.31-.93 3.57-.84c1.51.12 2.65.72 3.4 1.8c-3.12 1.87-2.38 5.98.48 7.13c-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25c.29 2.58-2.34 4.5-3.74 4.25"/>
  </svg>
);

const AndroidIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
    <path fill="#ffffff" d="M1 18q.225-2.675 1.638-4.925T6.4 9.5L4.55 6.3q-.15-.225-.075-.475T4.8 5.45q.2-.125.45-.05t.4.3L7.5 8.9Q9.65 8 12 8t4.5.9l1.85-3.2q.15-.225.4-.3t.45.05q.25.125.325.375t-.075.475L17.6 9.5q2.35 1.325 3.762 3.575T23 18zm6.888-3.113q.362-.362.362-.887t-.363-.888T7 12.75t-.888.363T5.75 14t.363.888t.887.362t.888-.363m10 0q.362-.362.362-.887t-.363-.888T17 12.75t-.888.363t-.362.887t.363.888t.887.362t.888-.363"/>
  </svg>
);

export default function DownloadSection() {
  const [modalType, setModalType] = useState<"ios" | "android" | null>(null);
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const APK_URL = "https://expo.dev/artifacts/eas/avz3rLqzjZouk1DwKbX9j4.apk";

  const downloadAPK = () => {
    const link = document.createElement("a");
    link.href = APK_URL;
    link.download = "HappyOur.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const checkPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_BETA_PASSWORD) {
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleCardClick = (type: "ios" | "android") => {
    if (!isUnlocked) return;
    
    if (type === "android") {
      downloadAPK();
    }
    setModalType(type);
  };

  const closeModal = () => setModalType(null);

  if (!isUnlocked) {
    return (
      <div className={styles.passwordContainer}>
        <form onSubmit={checkPassword} className={`${styles.passwordForm} glass-effect`}>
          <h3>Accès Réservé</h3>
          <p>Entrez le code d'invitation pour accéder aux téléchargements.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className={styles.input}
          />
          {error && <p className={styles.error}>Code incorrect</p>}
          <button type="submit" className={styles.button}>Dévérouiller</button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        <div className={`${styles.card} glass-effect`} onClick={() => handleCardClick("ios")}>
          <div className={styles.icon}><AppleIcon /></div>
          <h3>iOS</h3>
          <p>Testez via TestFlight</p>
          <button className={styles.button}>Télécharger</button>
        </div>

        <div className={`${styles.card} glass-effect`} onClick={() => handleCardClick("android")}>
          <div className={styles.icon}><AndroidIcon /></div>
          <h3>Android</h3>
          <p>Téléchargez l'APK</p>
          <button className={styles.button}>Télécharger</button>
        </div>
      </div>

      {modalType && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeModal}>×</button>
            
            {modalType === "ios" ? (
              <div className={styles.tutorial}>
                <h2>Installation sur iOS</h2>
                <div className={styles.steps}>
                  <div className={styles.step}>
                    <span className={styles.stepNumber}>1</span>
                    <div className={styles.stepContent}>
                      <p>Installez l'application <strong>TestFlight</strong> depuis l'App Store.</p>
                      <a href="https://apps.apple.com/fr/app/testflight/id899247664" target="_blank" rel="noopener noreferrer" className={styles.link}>
                        Ouvrir l'App Store
                      </a>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <span className={styles.stepNumber}>2</span>
                    <div className={styles.stepContent}>
                      <p>Rejoignez le programme de test de <strong>HappyOur</strong>.</p>
                      <a href="https://testflight.apple.com/join/gvCHSG89" target="_blank" rel="noopener noreferrer" className={styles.link}>Rejoindre sur TestFlight</a>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <span className={styles.stepNumber}>3</span>
                    <div className={styles.stepContent}>
                      <p>Installez l'application via TestFlight et commencez l'expérience !</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.tutorial}>
                <h2>Installation sur Android</h2>
                <div className={styles.steps}>
                  <div className={styles.step}>
                    <span className={styles.stepNumber}>1</span>
                    <div className={styles.stepContent}>
                      <p>Le téléchargement a commencé. Si ce n'est pas le cas, cliquez sur le lien ci-dessous.</p>
                      <button onClick={downloadAPK} className={styles.link}>Relancer le téléchargement</button>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <span className={styles.stepNumber}>2</span>
                    <div className={styles.stepContent}>
                      <p>Ouvrez le fichier téléchargé. Si demandé, autorisez l'installation de "sources inconnues" dans vos paramètres.</p>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <span className={styles.stepNumber}>3</span>
                    <div className={styles.stepContent}>
                      <p>Suivez les instructions à l'écran pour finaliser l'installation.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
