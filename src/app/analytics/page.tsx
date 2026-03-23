import type { Metadata } from "next";
import { cookies } from "next/headers";
import CodeGate from "./CodeGate";
import Dashboard from "./Dashboard";
import { fetchAnalyticsData } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "[noname] — Analytics",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("analytics_auth");
  const isAuthenticated = auth?.value === "authorized";

  if (!isAuthenticated) {
    return <CodeGate />;
  }

  const data = await fetchAnalyticsData();
  return <Dashboard data={data} />;
}
