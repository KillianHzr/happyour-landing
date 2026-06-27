"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { initTableOfContents } from "@/app/javascript/cgu";
import "@/app/cgu.css";
import styles from "../cgu.module.css";

export default function CguEnPage() {
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

      <h1 className={styles.title}>Terms of Service</h1>

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
            Last updated: 06/09/2026. By using Disclose, you agree to these terms. Please read them carefully.
          </p>

          <h2>Service description</h2>
          <p>
            Disclose is a mobile application for sharing moments within a group. Users capture photos, videos,
            drawings and audio messages throughout the week; the content is revealed collectively during a weekly
            event (the “Reveal”).
          </p>
          <p>Disclose is published by Source Studio.</p>

          <h2>Access conditions</h2>
          <p>To use Disclose, you must:</p>
          <ul role="list">
            <li>Be at least 16 years old</li>
            <li>Have a valid email address</li>
            <li>Create an individual and personal account</li>
            <li>Not create an account on behalf of another person without their consent</li>
          </ul>
          <p>By creating an account, you declare that you are at least 16 years old and accept these terms.</p>

          <h2>Your account</h2>
          <p>You are solely responsible for:</p>
          <ul role="list">
            <li>The confidentiality of your login credentials</li>
            <li>All actions taken from your account</li>
            <li>The accuracy of your profile information</li>
          </ul>
          <p>
            In case of loss or unauthorized access, contact us immediately at:{" "}
            <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
          </p>

          <h2>Shared content</h2>
          <p>
            You retain all rights to the content you publish. By sharing it, you grant Disclose a limited,
            non-exclusive and revocable license to:
          </p>
          <ul role="list">
            <li>Display your content to members of your group</li>
            <li>Store it on our secure servers</li>
            <li>Transmit it as part of the operation of the Reveal</li>
          </ul>
          <p>This license ends when the content or account is deleted.</p>

          <h2>Prohibited content</h2>
          <p>It is strictly forbidden to publish:</p>
          <ul role="list">
            <li>Illegal, defamatory, hateful or discriminatory content</li>
            <li>Sexually explicit or violent content</li>
            <li>Personal data of third parties without their consent</li>
            <li>Content that infringes intellectual property rights</li>
            <li>Spam, advertising or unauthorized commercial content</li>
            <li>Any content involving minors of a sexual nature</li>
          </ul>
          <p>
            Any content in violation of these rules may be removed without notice. The account may be suspended or
            deleted.
          </p>

          <h2>Prohibited behavior</h2>
          <p>The following are also prohibited:</p>
          <ul role="list">
            <li>Harassment, intimidation or any form of abuse toward other users</li>
            <li>Attempting to bypass security measures</li>
            <li>Reverse engineering, decompiling or extracting the application’s code</li>
            <li>The use of bots or automated scripts</li>
            <li>Creating multiple accounts to circumvent a suspension</li>
          </ul>

          <h2>Reporting, blocking and moderation</h2>
          <p>
            Disclose applies a <strong>zero-tolerance</strong> policy toward objectionable content and abusive
            behavior. By using the application, you agree not to publish any content and not to engage in any
            behavior prohibited by the sections above.
          </p>
          <p>To keep the community safe, Disclose provides you with the following means:</p>
          <ul role="list">
            <li>
              <strong>Report</strong> any objectionable content or user via Profile → Settings → Help and support →
              Problem
            </li>
            <li>
              <strong>Block</strong> another user at any time, which prevents any contact and hides their content
            </li>
            <li>
              <strong>Contact us</strong> directly at{" "}
              <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
            </li>
          </ul>
          <p>
            We are committed to reviewing reports and removing objectionable content, as well as suspending or
            removing the users concerned, within <strong>24 hours</strong> of the report. Moderation is performed
            after the fact, based on the reports received.
          </p>

          <h2>Service availability</h2>
          <p>Disclose strives to ensure the continuous availability of the service, but cannot guarantee:</p>
          <ul role="list">
            <li>Uninterrupted availability (maintenance, technical incidents)</li>
            <li>The absence of errors or bugs</li>
            <li>Indefinite data retention in the event of cessation of activity</li>
          </ul>
          <p>
            We will notify you in the application or by email in the event of significant planned interruptions.
          </p>

          <h2>Intellectual property</h2>
          <p>
            The Disclose application, its design, logo, features and source code are the exclusive property of
            Source Studio and protected by intellectual property law.
          </p>
          <p>
            Any reproduction, modification or distribution without prior written authorization is prohibited.
          </p>

          <h2>Termination</h2>
          <p>You may delete your account at any time from the application settings.</p>
          <p>
            Source Studio reserves the right to suspend or delete any account in the event of a violation of these
            terms, without notice or refund.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the extent permitted by law, Source Studio cannot be held liable for indirect, incidental or
            consequential damages resulting from the use or inability to use the service.
          </p>
          <p>
            The service is provided “as is”, without warranty of fitness for a particular purpose.
          </p>

          <h2>Governing law</h2>
          <p>
            These terms are governed by French law. In the event of a dispute, and failing amicable resolution, the
            competent courts of the jurisdiction of Source Studio’s registered office shall have sole jurisdiction.
            Consumers residing in the EU may use the European online dispute resolution platform (<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>).
          </p>

          <h2>Contact</h2>
          <p>For any question regarding these terms:</p>
          <ul role="list">
            <li>Company: Source Studio</li>
            <li>Address: Annecy, France</li>
            <li>
              Email: <a href="mailto:hello@disclose-app.com">hello@disclose-app.com</a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
