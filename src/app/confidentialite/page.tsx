"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { initTableOfContents } from "@/app/javascript/cgu";
import "@/app/cgu.css";
import styles from "../cgu/cgu.module.css";

export default function ConfidentialitePage() {
  const lenis = useLenis();

  useEffect(() => {
    const cleanup = initTableOfContents({ lenis });
    return () => cleanup?.();
  }, [lenis]);

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <Link href="/" className={styles.back}>
          ← Retour à l’accueil
        </Link>
      </div>

      <h1 className={styles.title}>Politique de confidentialité</h1>

      <div data-toc-offset="80" data-toc-wrap="" data-toc-levels="h2,h3" className="toc-layout">
        <aside className="toc-sidebar">
          <p className="toc-hero__label">on this page</p>
          <nav data-toc-list="" className="toc-list">
            {/* Template link — cloned per heading by the TOC script */}
            <a data-toc-link="" data-toc-item="" data-toc-status="active" href="#" className="toc-link">
              <span data-toc-text="" />
            </a>
          </nav>
        </aside>

        <div data-toc-content="" className="toc-article">
          <p>
            Mise à jour le 09/06/2026. Ce document explique comment Disclose traite vos données personnelles.
          </p>

          <h2>Responsable du traitement</h2>
          <p>Le responsable du traitement des données est :</p>
          <ul role="list">
            <li>Société : Source Studio</li>
            <li>Adresse : Annecy, France</li>
            <li>
              E-mail : <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
            </li>
          </ul>

          <h2>Données collectées</h2>
          <p>Uniquement les données nécessaires au service :</p>
          <ul role="list">
            <li>Compte : e-mail, pseudo, photo de profil</li>
            <li>E-mail de récupération (optionnel)</li>
            <li>Contenu publié : photos, vidéos, dessins, audio, textes</li>
            <li>Métadonnées : date/heure de publication, groupe</li>
            <li>Interactions : réactions, commentaires</li>
            <li>Préférences : thème, langue, notifications</li>
            <li>Technique : token push, identifiant de session</li>
          </ul>
          <p>
            Aucune donnée de localisation ni identifiant publicitaire. Aucun profilage commercial.
          </p>

          <h2>Utilisation de vos données</h2>
          <p>Vos données servent exclusivement à :</p>
          <ul role="list">
            <li>Gérer votre compte et authentification</li>
            <li>Faire fonctionner les groupes, reveals et archives</li>
            <li>Afficher réactions et commentaires dans vos groupes</li>
            <li>Envoyer des notifications push liées à votre activité</li>
            <li>Personnaliser votre expérience (thème, langue, rappels)</li>
            <li>Assurer la sécurité et prévenir les abus</li>
          </ul>
          <p>
            Bases légales (RGPD) : exécution du contrat (art. 6.1.b) ; intérêt légitime (art. 6.1.f) pour la
            sécurité ; consentement (art. 6.1.a) pour les notifications.
          </p>

          <h2>Partage des données</h2>
          <p>
            Vos données ne sont jamais vendues. Votre contenu est visible uniquement des membres de votre groupe.
          </p>
          <p>Sous-traitants techniques :</p>
          <ul role="list">
            <li>Supabase Inc. — base de données et authentification (serveurs en Europe, Frankfurt, Allemagne)</li>
            <li>Cloudflare Inc. — stockage des fichiers médias (R2)</li>
            <li>Expo Inc. — infrastructure de notifications push</li>
          </ul>
          <p>
            Ces prestataires agissent sur nos instructions dans le respect du RGPD. Les éventuels transferts hors
            UE sont encadrés par des clauses contractuelles types (CCT) approuvées par la Commission européenne.
          </p>

          <h2>Conservation des données</h2>
          <ul role="list">
            <li>Données actives : conservées pendant toute la durée de votre compte</li>
            <li>Suppression de compte : toutes vos données effacées sous 30 jours</li>
            <li>Archives de reveals : disponibles tant que votre compte est actif</li>
            <li>Tokens de session et push : supprimés à la déconnexion</li>
          </ul>

          <h2>Sécurité</h2>
          <ul role="list">
            <li>Chiffrement de toutes les communications (HTTPS/TLS)</li>
            <li>Accès aux médias contrôlé au niveau du groupe</li>
            <li>Authentification sécurisée via Supabase Auth</li>
            <li>Row Level Security sur toutes les tables</li>
          </ul>

          <h2>Vos droits (RGPD)</h2>
          <p>
            Conformément au Règlement (UE) 2016/679 (RGPD), vous disposez des droits suivants en tant que
            résident(e) de l’UE :
          </p>
          <ul role="list">
            <li>Accès (art. 15) : obtenir une copie de vos données</li>
            <li>Rectification (art. 16) : corriger des informations inexactes</li>
            <li>Effacement (art. 17) : supprimer votre compte et toutes vos données</li>
            <li>Portabilité (art. 20) : recevoir vos données dans un format standard</li>
            <li>Opposition (art. 21) : vous opposer aux traitements fondés sur l’intérêt légitime</li>
            <li>Limitation (art. 18) : restreindre temporairement un traitement</li>
            <li>Retrait du consentement : désactiver les notifications depuis les paramètres</li>
          </ul>
          <p>
            Pour exercer vos droits :{" "}
            <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
          </p>
          <p>
            Vous pouvez aussi déposer une réclamation auprès de la CNIL (
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>).
          </p>

          <h2>Mineurs</h2>
          <p>
            Disclose est réservé aux personnes de 16 ans ou plus. Si un mineur de moins de 16 ans a créé un
            compte, contactez-nous à <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a> pour que
            ses données soient supprimées.
          </p>

          <h2>Évolution de cette politique</h2>
          <p>
            Nous pouvons mettre à jour cette politique à tout moment. En cas de modification substantielle, vous
            serez notifié dans l’application ou par e-mail. La poursuite de l’utilisation vaut acceptation.
          </p>

          <h2>Digital Services Act (UE 2022/2065) — DSA</h2>
          <p>
            Disclose est qualifié de « petite plateforme » au sens du DSA (moins de 45 millions d’utilisateurs
            actifs mensuels dans l’UE). À ce titre, certaines obligations renforcées du DSA ne s’appliquent pas,
            mais Source Studio s’engage à respecter les obligations de base :
          </p>
          <ul role="list">
            <li>Fournir un point de contact unique pour les autorités (cf. coordonnées ci-dessous)</li>
            <li>Mettre en place un mécanisme de signalement de contenus illicites</li>
            <li>Traiter les signalements de manière diligente et non arbitraire</li>
            <li>Informer les utilisateurs des décisions de modération</li>
            <li>Ne pas utiliser de dark patterns pour tromper les utilisateurs</li>
            <li>Protéger les mineurs contre les contenus inappropriés</li>
          </ul>
          <p>
            Pour signaler un contenu illicite, utilisez le formulaire disponible dans Profil → Paramètres → Aide et
            assistance → Problème.
          </p>

          <h2>Droits des consommateurs (Directive 2011/83/UE)</h2>
          <p>
            Disclose est une application gratuite. Aucun frais d’abonnement n’est prélevé sans consentement
            explicite préalable. En cas d’achat futur intégré à l’application :
          </p>
          <ul role="list">
            <li>Le prix total sera clairement affiché avant confirmation</li>
            <li>Un droit de rétractation de 14 jours s’applique pour les achats numériques non commencés</li>
            <li>Les conditions spécifiques seront communiquées au moment de l’achat</li>
          </ul>

          <h2>Accessibilité (Directive UE 2019/882)</h2>
          <p>
            Disclose s’engage à améliorer progressivement l’accessibilité de son application conformément à la
            directive européenne sur l’accessibilité des produits et services numériques, applicable aux nouvelles
            applications à partir du 28 juin 2025.
          </p>
          <ul role="list">
            <li>Compatibilité avec les lecteurs d’écran (VoiceOver / TalkBack)</li>
            <li>Contrastes de couleurs respectant les recommandations WCAG 2.1 AA</li>
            <li>Options de thème et d’accessibilité dans les paramètres</li>
            <li>Sous-titres à venir pour les contenus audio et vidéo</li>
          </ul>

          <h2>Cookies et traceurs</h2>
          <p>
            L’application mobile Disclose n’utilise pas de cookies. Les identifiants techniques (tokens de session
            et tokens push) sont strictement nécessaires au fonctionnement du service et ne requièrent pas de
            consentement préalable au sens de la directive ePrivacy.
          </p>
          <p>
            Aucun cookie publicitaire, aucun traceur de navigation, aucun partage de données à des fins de ciblage
            publicitaire.
          </p>

          <h2>Contact et autorité de contrôle</h2>
          <p>Pour toute question relative à vos données personnelles :</p>
          <ul role="list">
            <li>Société : Source Studio</li>
            <li>Adresse : Annecy, France</li>
            <li>
              E-mail : <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
            </li>
          </ul>
          <p>Autorité de contrôle compétente pour la France :</p>
          <ul role="list">
            <li>CNIL — Commission Nationale de l’Informatique et des Libertés</li>
            <li>3 Place de Fontenoy, 75007 Paris</li>
            <li>
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a> — 01 53 73 22 22
            </li>
          </ul>
          <p>
            Plateforme européenne de règlement en ligne des litiges (RLL) :{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>
          </p>
        </div>
      </div>
    </main>
  );
}
