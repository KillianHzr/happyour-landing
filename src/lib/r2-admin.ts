/**
 * Server-only Cloudflare R2 operations for the /analytics/tri admin tool.
 *
 * R2 object key convention (matches the HappyOur app): `{group_id}/{image_path}`
 * where image_path stored in the DB is the filename only, e.g.
 * `{user_id}_{timestamp}.jpg`. Moving a capture to another group therefore
 * requires physically copying the object to the destination group's prefix.
 *
 * Requires server env vars (copy values from HappyOur/.env EXPO_PUBLIC_R2_*):
 *   R2_ENDPOINT, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 */
import { S3Client, PutObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";

const ENDPOINT = process.env.R2_ENDPOINT;
const BUCKET = process.env.R2_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!ENDPOINT || !BUCKET || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new Error(
      "R2 not configured: set R2_ENDPOINT, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.local"
    );
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: ENDPOINT,
      credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
    });
  }
  return client;
}

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
  );
}

function isNoSuchKey(e: unknown): boolean {
  const err = e as { name?: string; Code?: string };
  return err?.name === "NoSuchKey" || err?.Code === "NoSuchKey" || err?.name === "NotFound";
}

/**
 * Copy the first existing source key to destKey. The R2 key convention has
 * varied (with/without the group_id prefix), so we probe candidates and skip
 * gracefully if none exist in R2 (e.g. media that lives only in the legacy
 * Supabase bucket). Returns true if a copy succeeded.
 */
export async function copyObjectFromCandidates(
  srcKeys: string[],
  destKey: string
): Promise<boolean> {
  for (const srcKey of srcKeys) {
    if (srcKey === destKey) return true;
    try {
      await getClient().send(
        new CopyObjectCommand({
          Bucket: BUCKET,
          CopySource: `${BUCKET}/${encodeURI(srcKey)}`,
          Key: destKey,
        })
      );
      return true;
    } catch (e) {
      if (isNoSuchKey(e)) continue;
      throw e; // auth / network / config errors should surface
    }
  }
  return false;
}

export type CaptureType = "photo" | "video" | "audio" | "drawing";

const EXT: Record<CaptureType, string> = {
  photo: "jpg",
  drawing: "jpg",
  video: "mp4",
  audio: "m4a",
};

export const CONTENT_TYPE: Record<CaptureType, string> = {
  photo: "image/jpeg",
  drawing: "image/jpeg",
  video: "video/mp4",
  audio: "audio/m4a",
};

/** Build the DB image_path (filename only) following the app convention. */
export function buildImagePath(userId: string, type: CaptureType): string {
  const suffix = type === "drawing" ? "_draw" : "";
  return `${userId}_${Date.now()}${suffix}.${EXT[type]}`;
}
