import type { Metadata } from "next";
import { cookies } from "next/headers";
import CodeGate from "../CodeGate";
import { supabase } from "@/lib/supabase-server";
import TriClient from "./TriClient";

export const metadata: Metadata = {
  title: "HappyOur — Tri Reveal",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export const dynamic = "force-dynamic";

export default async function TriPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("analytics_auth")?.value === "authorized";

  if (!isAuthenticated) {
    return <CodeGate redirectTo="/analytics/tri" />;
  }

  // Restrict the tri tool to groups whose name contains "Gobelin" (anywhere,
  // case-insensitive).
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name")
    .ilike("name", "%Gobelin%")
    .order("name");

  return <TriClient groups={groups ?? []} />;
}
