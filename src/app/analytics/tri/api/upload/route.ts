import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadObject, buildImagePath, CONTENT_TYPE, CaptureType } from "@/lib/r2-admin";

const VALID_TYPES: CaptureType[] = ["photo", "video", "audio", "drawing"];

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get("analytics_auth")?.value !== "authorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const groupId = form.get("groupId");
  const userId = form.get("userId");
  const typeRaw = form.get("type");

  if (!(file instanceof File) || typeof groupId !== "string" || typeof userId !== "string") {
    return NextResponse.json({ error: "Missing file, groupId or userId" }, { status: 400 });
  }

  const type: CaptureType = VALID_TYPES.includes(typeRaw as CaptureType)
    ? (typeRaw as CaptureType)
    : "photo";

  try {
    const imagePath = buildImagePath(userId, type);
    const key = `${groupId}/${imagePath}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadObject(key, buffer, file.type || CONTENT_TYPE[type]);
    return NextResponse.json({ image_path: imagePath });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
