import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase-server";

const STORAGE_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-c3c80a82b60448dba090aef503e3931b.r2.dev";
const SUPABASE_URL = process.env.SUPABASE_URL || "";

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

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const photosRes = await supabase
    .from("photos")
    .select("id, image_path, note, created_at, group_id, groups:group_id(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (photosRes.error) {
    return NextResponse.json({ error: photosRes.error.message }, { status: 500 });
  }

  const photos = (photosRes.data ?? []).map((p) => {
    const type = inferType(p.image_path);
    const date = (p.created_at as string).slice(0, 10);
    return {
      id: p.id,
      type,
      note: p.note ?? null,
      url: getMediaUrl(p.image_path),
      fallback_url: getFallbackUrl(p.image_path),
      image_path: p.image_path,
      created_at: p.created_at,
      date,
      group_name: (p.groups as any)?.name ?? null,
    };
  });

  return NextResponse.json({ photos });
}
