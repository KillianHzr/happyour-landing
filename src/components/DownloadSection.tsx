"use client";

import { useState } from "react";
import styles from "./DownloadSection.module.css";

const AppleIcon = () => (
  <svg width="40" height="40" viewBox="0 0 256 315" fill="currentColor">
    <path d="M213.803 167.03c.442 47.58 41.74 63.413 42.147 63.615-.35 1.116-6.599 22.563-21.757 44.716-13.103 19.143-26.677 38.223-48.237 38.618-21.17.39-27.99-12.495-52.207-12.495-24.22 0-31.785 12.096-52.204 12.892-20.787.794-36.565-20.738-49.773-39.814C6.88 250.245-12.24 186.136 12.158 143.953c12.115-20.947 33.64-34.193 57.062-34.522 17.896-.328 34.793 12.03 45.753 12.03 10.96 0 31.436-15.035 52.883-12.86 8.976.372 34.205 3.61 50.413 27.283-.1.545-30.413 17.747-30.466 51.146zm-41.93-116.305c9.55-11.55 15.98-27.603 14.212-43.655-13.792.557-30.462 9.17-40.353 20.72-8.87 10.312-16.634 26.745-14.534 42.422 15.38 1.192 31.125-7.937 40.675-19.487z" />
  </svg>
);

const AndroidIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.523 15.3414C17.0673 15.3414 16.6974 14.9715 16.6974 14.5158C16.6974 14.0601 17.0673 13.6902 17.523 13.6902C17.9787 13.6902 18.3486 14.0601 18.3486 14.5158C18.3486 14.9715 17.9787 15.3414 17.523 15.3414ZM6.47703 15.3414C6.02133 15.3414 5.65143 14.9715 5.65143 14.5158C5.65143 14.0601 6.02133 13.6902 6.47703 13.6902C6.93273 13.6902 7.30263 14.0601 7.30263 14.5158C7.30263 14.9715 6.93273 15.3414 6.47703 15.3414ZM17.9427 11.2311L19.8647 7.90226C19.9673 7.7245 19.9064 7.49755 19.7286 7.39494C19.5509 7.29232 19.3239 7.35323 19.2213 7.531L17.2755 10.9012C15.756 10.2104 14.0049 9.81641 12.1311 9.81641C10.2573 9.81641 8.50624 10.2104 6.98671 10.9012L5.0409 7.531C4.93828 7.35323 4.71134 7.29232 4.53358 7.39494C4.35581 7.49755 4.2949 7.7245 4.39751 7.90226L6.31952 11.2311C3.21989 12.9157 1.09668 16.0354 1.00078 19.6841H23.2614C23.1655 16.0354 21.0423 12.9157 17.9427 11.2311Z" />
  </svg>
);

export default function DownloadSection() {
  const [modalType, setModalType] = useState<"ios" | "android" | null>(null);

  const openModal = (type: "ios" | "android") => setModalType(type);
  const closeModal = () => setModalType(null);

  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        {/* iOS Card */}
        <div className={`${styles.card} glass-effect`} onClick={() => openModal("ios")}>
          <div className={styles.icon}><AppleIcon /></div>
          <h3>iOS</h3>
          <p>Testez via TestFlight</p>
          <button className={styles.button}>Commencer</button>
        </div>

        {/* Android Card */}
        <div className={`${styles.card} glass-effect`} onClick={() => openModal("android")}>
          <div className={styles.icon}><AndroidIcon /></div>
          <h3>Android</h3>
          <p>Téléchargez l'APK</p>
          <button className={styles.button}>Télécharger</button>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={`${styles.modal} glass-effect`} onClick={(e) => e.stopPropagation()}>
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
                      <p>Rejoignez le programme de test de <strong>[noname]</strong>.</p>
                      <a href="#" className={styles.link}>Lien TestFlight</a>
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
                      <p>Téléchargez le fichier APK directement sur votre appareil.</p>
                      <a href="#" className={styles.link}>Télécharger l'APK</a>
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
