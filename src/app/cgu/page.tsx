"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { initTableOfContents } from "@/app/javascript/cgu";
import "@/app/cgu.css";
import styles from "./cgu.module.css";

export default function CguPage() {
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

      <h1 className={styles.title}>Conditions Générales d’Utilisation</h1>

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
            Dernière mise à jour : 09/06/2026. En utilisant Disclose, vous acceptez les présentes conditions.
            Veuillez les lire attentivement.
          </p>

          <h2>Description du service</h2>
          <p>
            Disclose est une application mobile de partage de moments en groupe. Les utilisateurs capturent des
            photos, vidéos, dessins et messages audio au fil de la semaine ; le contenu est révélé collectivement
            lors d’un événement hebdomadaire (le « Reveal »).
          </p>
          <p>Disclose est édité par Source Studio.</p>

          <h2>Conditions d’accès</h2>
          <p>Pour utiliser Disclose, vous devez :</p>
          <ul role="list">
            <li>Avoir au moins 16 ans</li>
            <li>Disposer d’une adresse e-mail valide</li>
            <li>Créer un compte individuel et personnel</li>
            <li>Ne pas créer de compte pour le compte d’une autre personne sans son consentement</li>
          </ul>
          <p>En créant un compte, vous déclarez avoir au moins 16 ans et accepter ces conditions.</p>

          <h2>Votre compte</h2>
          <p>Vous êtes seul responsable :</p>
          <ul role="list">
            <li>De la confidentialité de vos identifiants de connexion</li>
            <li>De toutes les actions effectuées depuis votre compte</li>
            <li>De l’exactitude des informations de votre profil</li>
          </ul>
          <p>
            En cas de perte ou d’accès non autorisé, contactez-nous immédiatement à :{" "}
            <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
          </p>

          <h2>Contenu partagé</h2>
          <p>
            Vous conservez l’intégralité des droits sur le contenu que vous publiez. En le partageant, vous
            accordez à Disclose une licence limitée, non exclusive et révocable pour :
          </p>
          <ul role="list">
            <li>Afficher votre contenu aux membres de votre groupe</li>
            <li>Le stocker sur nos serveurs sécurisés</li>
            <li>Le transmettre dans le cadre du fonctionnement du Reveal</li>
          </ul>
          <p>Cette licence prend fin à la suppression du contenu ou du compte.</p>

          <h2>Contenus interdits</h2>
          <p>Il est strictement interdit de publier :</p>
          <ul role="list">
            <li>Du contenu illégal, diffamatoire, haineux ou discriminatoire</li>
            <li>Du contenu sexuellement explicite ou violent</li>
            <li>Des données personnelles de tiers sans leur consentement</li>
            <li>Du contenu portant atteinte aux droits de propriété intellectuelle</li>
            <li>Des spams, publicités ou contenus à caractère commercial non autorisé</li>
            <li>Tout contenu impliquant des mineurs à caractère sexuel</li>
          </ul>
          <p>
            Tout contenu en violation de ces règles peut être supprimé sans préavis. Le compte peut être suspendu
            ou supprimé.
          </p>

          <h2>Comportements interdits</h2>
          <p>Sont également interdits :</p>
          <ul role="list">
            <li>Le harcèlement, l’intimidation ou toute forme d’abus envers d’autres utilisateurs</li>
            <li>La tentative de contournement des mesures de sécurité</li>
            <li>L’ingénierie inverse, le décompilage ou l’extraction du code de l’application</li>
            <li>L’utilisation de bots ou de scripts automatisés</li>
            <li>La création de plusieurs comptes pour contourner une suspension</li>
          </ul>

          <h2>Signalement, blocage et modération</h2>
          <p>
            Disclose applique une politique de <strong>tolérance zéro</strong> à l’égard des contenus
            répréhensibles (« objectionable content ») et des comportements abusifs. En utilisant l’application,
            vous acceptez de ne publier aucun contenu et de n’adopter aucun comportement interdit par les sections
            ci-dessus.
          </p>
          <p>Pour assurer la sécurité de la communauté, Disclose met à votre disposition les moyens suivants :</p>
          <ul role="list">
            <li>
              <strong>Signaler</strong> tout contenu ou utilisateur répréhensible via Profil → Paramètres → Aide et
              assistance → Problème
            </li>
            <li>
              <strong>Bloquer</strong> à tout moment un autre utilisateur, ce qui empêche tout contact et masque
              ses contenus
            </li>
            <li>
              <strong>Nous contacter</strong> directement à{" "}
              <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
            </li>
          </ul>
          <p>
            Nous nous engageons à examiner les signalements et à retirer les contenus répréhensibles, ainsi qu’à
            suspendre ou exclure les utilisateurs concernés, dans un délai de <strong>24 heures</strong> suivant le
            signalement. La modération est effectuée a posteriori, sur la base des signalements reçus.
          </p>

          <h2>Disponibilité du service</h2>
          <p>Disclose s’efforce d’assurer la disponibilité continue du service, mais ne peut garantir :</p>
          <ul role="list">
            <li>Une disponibilité sans interruption (maintenance, incidents techniques)</li>
            <li>L’absence d’erreurs ou de bugs</li>
            <li>La conservation indéfinie des données en cas de cessation d’activité</li>
          </ul>
          <p>
            Nous vous notifierons dans l’application ou par e-mail en cas d’interruption planifiée significative.
          </p>

          <h2>Propriété intellectuelle</h2>
          <p>
            L’application Disclose, son design, son logo, ses fonctionnalités et son code source sont la propriété
            exclusive de Source Studio et protégés par le droit de la propriété intellectuelle.
          </p>
          <p>
            Toute reproduction, modification ou distribution sans autorisation écrite préalable est interdite.
          </p>

          <h2>Résiliation</h2>
          <p>Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l’application.</p>
          <p>
            Source Studio se réserve le droit de suspendre ou supprimer tout compte en cas de violation des
            présentes conditions, sans préavis ni remboursement.
          </p>

          <h2>Limitation de responsabilité</h2>
          <p>
            Dans les limites autorisées par la loi, Source Studio ne saurait être tenu responsable des dommages
            indirects, accessoires ou consécutifs résultant de l’utilisation ou de l’impossibilité d’utiliser le
            service.
          </p>
          <p>
            Le service est fourni « tel quel », sans garantie d’adéquation à un usage particulier.
          </p>

          <h2>Droit applicable</h2>
          <p>
            Les présentes conditions sont régies par le droit français. En cas de litige, et à défaut de
            résolution amiable, les tribunaux compétents du ressort du siège social de Source Studio seront seuls
            compétents. Les consommateurs résidant dans l’UE peuvent recourir à la plateforme européenne de
            règlement en ligne des litiges (<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>).
          </p>

          <h2>Contact</h2>
          <p>Pour toute question relative à ces conditions :</p>
          <ul role="list">
            <li>Société : Source Studio</li>
            <li>Adresse : Annecy, France</li>
            <li>
              E-mail : <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
