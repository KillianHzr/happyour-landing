import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase-server";

const STORAGE_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-c3c80a82b60448dba090aef503e3931b.r2.dev";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const EXCLUDED_GROUP_ID = "7e15ead8-7e24-4d22-b587-7cb834fd38e5"; // HappyOur
const EXCLUDED_USER_ID = "6feff666-5bcb-4b23-a9d8-22e38ceff5ca"; // theolanglade21@gmail.com

function getMediaUrl(imagePath: string | null): string | null {
  if (!imagePath || imagePath === "text_mode") return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${STORAGE_BASE}/${imagePath}`;
}

function getFallbackUrl(imagePath: string | null): string | null {
  if (!imagePath || imagePath === "text_mode") return null;
  if (imagePath.startsWith("http")) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/moments/${imagePath}`;
}

function inferType(imagePath: string | null): "photo" | "video" | "text" | "audio" | "drawing" {
  if (!imagePath || imagePath === "text_mode") return "text";

  const path = imagePath.toLowerCase();
  if (path.includes("_draw")) return "drawing";

  const cleanPath = path.split("?")[0];
  const ext = cleanPath.split(".").pop() ?? "";

  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["m4a", "wav", "mp3", "aac", "oga", "ogg"].includes(ext) || path.includes("_audio")) return "audio";

  return "photo";
}

export async function GET() {
  const START_DATE = "2026-03-30T00:00:00Z";
  const cookieStore = await cookies();
  if (cookieStore.get("analytics_auth")?.value !== "authorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [photosRes, profilesRes, groupsRes] = await Promise.all([
    supabase
      .from("photos")
      .select("id, user_id, group_id, image_path, note, created_at")
      .gte("created_at", START_DATE)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, username")
      .not("username", "ilike", "%test%"),
    supabase.from("groups").select("id, name"),
  ]);

  if (photosRes.error) {
    return NextResponse.json({ error: photosRes.error.message }, { status: 500 });
  }

  const validUserIds = new Set((profilesRes.data ?? []).map((p) => p.id));
  const userMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p.username ?? "?"]));
  const groupMap = new Map((groupsRes.data ?? []).map((g) => [g.id, g.name ?? "?"]));

  const photos = (photosRes.data ?? [])
    .filter(
      (p) =>
        p.group_id !== EXCLUDED_GROUP_ID &&
        p.user_id !== EXCLUDED_USER_ID &&
        validUserIds.has(p.user_id)
    )
    .map((p) => ({
      id: p.id,
      user_id: p.user_id,
      username: userMap.get(p.user_id) ?? p.user_id.slice(0, 8),
      group_id: p.group_id,
      group_name: groupMap.get(p.group_id) ?? "Groupe inconnu",
      type: inferType(p.image_path),
      note: p.note ?? null,
      url: getMediaUrl(p.image_path),
      fallback_url: getFallbackUrl(p.image_path),
      image_path: p.image_path,
      created_at: p.created_at,
      date: (p.created_at as string).slice(0, 10),
    }));

  return NextResponse.json({ photos });
}
