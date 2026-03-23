import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase-server";

const STORAGE_BASE = `${process.env.SUPABASE_URL}/storage/v1/object/public/moments`;

function inferType(imagePath: string | null): "photo" | "video" | "text" {
  if (!imagePath || imagePath === "text_mode") return "text";
  const ext = imagePath.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  return "photo";
}

export async function GET(req: NextRequest) {
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
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, username, avatar_url"),
  ]);

  if (photosRes.error) {
    return NextResponse.json({ error: photosRes.error.message }, { status: 500 });
  }

  const userMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p.username ?? "?"])
  );

  const photos = (photosRes.data ?? []).map((p) => {
    const type = inferType(p.image_path);
    return {
      id: p.id,
      user_id: p.user_id,
      username: userMap.get(p.user_id) ?? p.user_id.slice(0, 8),
      type,
      note: p.note ?? null,
      url:
        type !== "text"
          ? `${STORAGE_BASE}/${p.image_path}`
          : null,
      created_at: p.created_at,
      date: (p.created_at as string).slice(0, 10),
    };
  });

  return NextResponse.json({ photos });
}
