import type { Metadata } from "next";
import TimerClient from "./TimerClient";

export const metadata: Metadata = {
  title: "HappyOur — Timer",
  description: "Compte à rebours.",
  robots: { index: false, follow: false },
};

export default function TimerPage() {
  return <TimerClient />;
}
