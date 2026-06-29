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
    return <CodeGate />;
  }

  const { data: groups } = await supabase.from("groups").select("id, name").order("name");

  return <TriClient groups={groups ?? []} />;
}
