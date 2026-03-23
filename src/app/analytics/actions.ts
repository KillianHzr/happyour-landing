"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

  redirect("/analytics");
}
