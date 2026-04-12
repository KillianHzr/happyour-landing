import type { Metadata } from "next";
import RevealApp from "./RevealApp";

export const metadata: Metadata = {
  title: "HappyOur — Reveal",
  description: "Revivez vos moments partagés de la semaine.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function RevealPage() {
  return <RevealApp />;
}
