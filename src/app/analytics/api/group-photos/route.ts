import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase-server";

const STORAGE_BASE = `${process.env.SUPABASE_URL}/storage/v1/object/public/moments`;

function getMediaUrl(imagePath: string | null): string | null {
  if (!imagePath || imagePath === "text_mode") return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${STORAGE_BASE}/${imagePath}`;
}

function inferType(imagePath: string | null): "photo" | "video" | "text" {
  if (!imagePath || imagePath === "text_mode") return "text";
  const path = imagePath.toLowerCase();
  if (path.endsWith(".mp4") || path.endsWith(".mov") || path.endsWith(".avi") || path.endsWith(".webm") || path.endsWith(".mkv")) {
    return "video";
  }
  return "photo";
}

export async function GET(req: NextRequest) {
  const START_DATE = "2026-03-30T00:00:00Z";
  const cookieStore = await cookies();
  if (cookieStore.get("analytics_auth")?.value !== "authorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groupId = req.nextUrl.searchParams.get("groupId");
  if (!groupId) {
    return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
  }

  const [photosRes, profilesRes] = await Promise.all([
    supabase
      .from("photos")
      .select("id, user_id, image_path, note, created_at")
      .eq("group_id", groupId)
      .gte("created_at", START_DATE)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .not("username", "ilike", "%test%"),
  ]);

  if (photosRes.error) {
    return NextResponse.json({ error: photosRes.error.message }, { status: 500 });
  }

  const validUserIds = new Set((profilesRes.data ?? []).map((p) => p.id));
  const userMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p.username ?? "?"])
  );

  const photos = (photosRes.data ?? [])
    .filter((p) => validUserIds.has(p.user_id))
    .map((p) => {
      const type = inferType(p.image_path);
      return {
        id: p.id,
        user_id: p.user_id,
        username: userMap.get(p.user_id) ?? p.user_id.slice(0, 8),
        type,
        note: p.note ?? null,
        url: getMediaUrl(p.image_path),
        created_at: p.created_at,
        date: (p.created_at as string).slice(0, 10),
      };
    });

  return NextResponse.json({ photos });
}
