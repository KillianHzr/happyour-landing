import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase-server";

const STORAGE_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-c3c80a82b60448dba090aef503e3931b.r2.dev";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const EXCLUDED_GROUP_ID = "7e15ead8-7e24-4d22-b587-7cb834fd38e5"; // HappyOur
const EXCLUDED_USER_ID = "6feff666-5bcb-4b23-a9d8-22e38ceff5ca"; // theolanglade21@gmail.com

function getMediaUrl(groupId: string, imagePath: string | null): string | null {
  if (!imagePath || imagePath === "text_mode") return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${STORAGE_BASE}/${groupId}/${imagePath}`;
}

function getFallbackUrl(imagePath: string | null): string | null {
  if (!imagePath || imagePath === "text_mode") return null;
  if (imagePath.startsWith("http")) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/moments/${imagePath}`;
}

function inferType(imagePath: string | null, note: string | null): "photo" | "video" | "text" | "audio" | "drawing" {
  if (!imagePath || imagePath === "text_mode") return "text";
  if (imagePath.includes("_draw")) return "drawing";
  const ext = imagePath.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["m4a", "wav", "mp3", "aac"].includes(ext)) return "audio";
  return "photo";
}


export async function GET(req: NextRequest) {
  const START_DATE = "2026-03-30T00:00:00Z";
  const cookieStore = await cookies();
  if (cookieStore.get("analytics_auth")?.value !== "authorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const photosRes = await supabase
    .from("photos")
    .select("id, image_path, note, created_at, group_id, groups:group_id(name)")
    .eq("user_id", userId)
    .gte("created_at", START_DATE)
    .order("created_at", { ascending: false });

  if (photosRes.error) {
    return NextResponse.json({ error: photosRes.error.message }, { status: 500 });
  }

  const photos = (photosRes.data ?? []).map((p) => {
    const type = inferType(p.image_path, p.note);
    const date = (p.created_at as string).slice(0, 10);
    return {
      id: p.id,
      type,
      note: p.note ?? null,
      url: getMediaUrl(p.group_id, p.image_path),
      fallback_url: getFallbackUrl(p.image_path),
      image_path: p.image_path,
      created_at: p.created_at,
      date,
      group_name: (p.groups as any)?.name ?? null,
    };
  });

  return NextResponse.json({ photos });
}
