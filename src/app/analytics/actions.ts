"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase-server";

export async function authenticateAnalytics(
  prevState: { error: boolean },
  formData: FormData
): Promise<{ error: boolean }> {
  const code = formData.get("code") as string;
  const secret = process.env.ANALYTICS_SECRET;

  if (!secret || !code || code.trim() !== secret) {
    return { error: true };
  }

  const cookieStore = await cookies();
  cookieStore.set("analytics_auth", "authorized", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8, // 8h
    path: "/analytics",
  });

  // Redirect back to the page the user came from (must stay under /analytics).
  const requested = (formData.get("redirectTo") as string) || "/analytics";
  const target = requested.startsWith("/analytics") ? requested : "/analytics";
  redirect(target);
}

export async function createChallengeTheme(label: string, capture_type: string) {
  const cookieStore = await cookies();
  const auth = cookieStore.get("analytics_auth");
  if (auth?.value !== "authorized") {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("challenge_themes")
    .insert([{ label, capture_type }])
    .select()
    .single();

  if (error) {
    console.error("Error creating theme:", error);
    throw new Error(error.message);
  }

  return data;
}
