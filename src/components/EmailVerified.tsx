"use client";

import { useEffect, useState } from "react";

export default function EmailVerified() {
  const [isVerification, setIsVerification] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=signup") && hash.includes("access_token")) {
      setIsVerification(true);
    }
  }, []);

  if (!isVerification) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "#000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "24px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "48px", marginBottom: "24px" }}>✓</div>
      <h1 style={{
        color: "#fff",
        fontSize: "28px",
        fontWeight: "700",
        marginBottom: "16px",
        letterSpacing: "-0.5px",
      }}>
        Email vérifié
      </h1>
      <p style={{
        color: "rgba(255,255,255,0.5)",
        fontSize: "16px",
        lineHeight: "1.6",
        maxWidth: "320px",
      }}>
        Votre adresse email a bien été confirmée. Vous pouvez fermer cette page et revenir sur l&apos;application.
      </p>
    </div>
  );
}
