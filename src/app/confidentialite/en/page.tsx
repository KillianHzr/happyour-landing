"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { initTableOfContents } from "@/app/javascript/cgu";
import "@/app/cgu.css";
import styles from "../../cgu/cgu.module.css";

export default function ConfidentialiteEnPage() {
  const lenis = useLenis();

  useEffect(() => {
    const cleanup = initTableOfContents({ lenis });
    return () => cleanup?.();
  }, [lenis]);

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <Link href="/" className={styles.back}>
          ← Back to home
        </Link>
      </div>

      <h1 className={styles.title}>Privacy Policy</h1>

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
            Updated on 06/09/2026. This document explains how Disclose processes your personal data.
          </p>

          <h2>Data controller</h2>
          <p>The data controller is:</p>
          <ul role="list">
            <li>Company: Source Studio</li>
            <li>Address: Annecy, France</li>
            <li>
              Email: <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
            </li>
          </ul>

          <h2>Data collected</h2>
          <p>Only the data necessary for the service:</p>
          <ul role="list">
            <li>Account: email, username, profile picture</li>
            <li>Recovery email (optional)</li>
            <li>Published content: photos, videos, drawings, audio, text</li>
            <li>Metadata: publication date/time, group</li>
            <li>Interactions: reactions, comments</li>
            <li>Preferences: theme, language, notifications</li>
            <li>Technical: push token, session identifier</li>
          </ul>
          <p>
            No location data and no advertising identifiers. No commercial profiling.
          </p>

          <h2>Use of your data</h2>
          <p>Your data is used exclusively to:</p>
          <ul role="list">
            <li>Manage your account and authentication</li>
            <li>Operate groups, reveals and archives</li>
            <li>Display reactions and comments within your groups</li>
            <li>Send push notifications related to your activity</li>
            <li>Personalize your experience (theme, language, reminders)</li>
            <li>Ensure security and prevent abuse</li>
          </ul>
          <p>
            Legal bases (GDPR): performance of the contract (art. 6.1.b); legitimate interest (art. 6.1.f) for
            security; consent (art. 6.1.a) for notifications.
          </p>

          <h2>Data sharing</h2>
          <p>
            Your data is never sold. Your content is visible only to members of your group.
          </p>
          <p>Technical subprocessors:</p>
          <ul role="list">
            <li>Supabase Inc. — database and authentication (servers in Europe, Frankfurt, Germany)</li>
            <li>Cloudflare Inc. — media file storage (R2)</li>
            <li>Expo Inc. — push notification infrastructure</li>
          </ul>
          <p>
            These providers act on our instructions in compliance with the GDPR. Any transfers outside the EU are
            governed by standard contractual clauses (SCCs) approved by the European Commission.
          </p>

          <h2>Data retention</h2>
          <ul role="list">
            <li>Active data: kept for the entire duration of your account</li>
            <li>Account deletion: all your data erased within 30 days</li>
            <li>Reveal archives: available as long as your account is active</li>
            <li>Session and push tokens: deleted on logout</li>
          </ul>

          <h2>Security</h2>
          <ul role="list">
            <li>Encryption of all communications (HTTPS/TLS)</li>
            <li>Media access controlled at the group level</li>
            <li>Secure authentication via Supabase Auth</li>
            <li>Row Level Security on all tables</li>
          </ul>

          <h2>Your rights (GDPR)</h2>
          <p>
            In accordance with Regulation (EU) 2016/679 (GDPR), you have the following rights as an EU resident:
          </p>
          <ul role="list">
            <li>Access (art. 15): obtain a copy of your data</li>
            <li>Rectification (art. 16): correct inaccurate information</li>
            <li>Erasure (art. 17): delete your account and all your data</li>
            <li>Portability (art. 20): receive your data in a standard format</li>
            <li>Objection (art. 21): object to processing based on legitimate interest</li>
            <li>Restriction (art. 18): temporarily restrict a processing operation</li>
            <li>Withdrawal of consent: disable notifications from the settings</li>
          </ul>
          <p>
            To exercise your rights:{" "}
            <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
          </p>
          <p>
            You can also lodge a complaint with the CNIL (
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>).
          </p>

          <h2>Minors</h2>
          <p>
            Disclose is reserved for people aged 16 or over. If a minor under 16 has created an account, contact us
            at <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a> so that their data is deleted.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this policy at any time. In the event of a substantial change, you will be notified in the
            application or by email. Continued use constitutes acceptance.
          </p>

          <h2>Digital Services Act (EU 2022/2065) — DSA</h2>
          <p>
            Disclose qualifies as a “small platform” within the meaning of the DSA (fewer than 45 million monthly
            active users in the EU). As such, some of the DSA’s enhanced obligations do not apply, but Source Studio
            is committed to complying with the basic obligations:
          </p>
          <ul role="list">
            <li>Provide a single point of contact for authorities (see contact details below)</li>
            <li>Set up a mechanism for reporting illegal content</li>
            <li>Handle reports diligently and non-arbitrarily</li>
            <li>Inform users of moderation decisions</li>
            <li>Not use dark patterns to deceive users</li>
            <li>Protect minors from inappropriate content</li>
          </ul>
          <p>
            To report illegal content, use the form available in Profile → Settings → Help and support → Problem.
          </p>

          <h2>Consumer rights (Directive 2011/83/EU)</h2>
          <p>
            Disclose is a free application. No subscription fee is charged without prior explicit consent. In the
            event of a future in-app purchase:
          </p>
          <ul role="list">
            <li>The total price will be clearly displayed before confirmation</li>
            <li>A 14-day right of withdrawal applies to digital purchases that have not started</li>
            <li>Specific conditions will be communicated at the time of purchase</li>
          </ul>

          <h2>Accessibility (EU Directive 2019/882)</h2>
          <p>
            Disclose is committed to progressively improving the accessibility of its application in accordance with
            the European directive on the accessibility of digital products and services, applicable to new
            applications from June 28, 2025.
          </p>
          <ul role="list">
            <li>Compatibility with screen readers (VoiceOver / TalkBack)</li>
            <li>Color contrasts meeting WCAG 2.1 AA recommendations</li>
            <li>Theme and accessibility options in the settings</li>
            <li>Subtitles coming soon for audio and video content</li>
          </ul>

          <h2>Cookies and trackers</h2>
          <p>
            The Disclose mobile application does not use cookies. The technical identifiers (session tokens and push
            tokens) are strictly necessary for the operation of the service and do not require prior consent within
            the meaning of the ePrivacy directive.
          </p>
          <p>
            No advertising cookies, no browsing trackers, no data sharing for advertising targeting purposes.
          </p>

          <h2>Contact and supervisory authority</h2>
          <p>For any question regarding your personal data:</p>
          <ul role="list">
            <li>Company: Source Studio</li>
            <li>Address: Annecy, France</li>
            <li>
              Email: <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
            </li>
          </ul>
          <p>Competent supervisory authority for France:</p>
          <ul role="list">
            <li>CNIL — Commission Nationale de l’Informatique et des Libertés</li>
            <li>3 Place de Fontenoy, 75007 Paris</li>
            <li>
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a> — 01 53 73 22 22
            </li>
          </ul>
          <p>
            European online dispute resolution (ODR) platform:{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>
          </p>
        </div>
      </div>
    </main>
  );
}
