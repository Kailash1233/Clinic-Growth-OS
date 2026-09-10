import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error("Cloudflare R2 credentials are not configured");
    }
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

/** Uploads a fetched Places photo (or logo) to R2 and returns its public URL. */
export async function uploadToR2(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;
  if (!bucket) throw new Error("CLOUDFLARE_R2_BUCKET is not configured");
  if (!publicBase) throw new Error("CLOUDFLARE_R2_PUBLIC_BASE_URL is not configured");

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );

  return `${publicBase.replace(/\/$/, "")}/${params.key}`;
}

/** Downloads a Google Places photo and re-hosts it on R2 under the clinic's namespace. */
export async function mirrorPlacesPhotoToR2(sourceUrl: string, clinicId: string, index: number): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to fetch source photo: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = contentType.includes("png") ? "png" : "jpg";

  return uploadToR2({
    key: `clinics/${clinicId}/photos/${index}.${ext}`,
    body: buffer,
    contentType,
  });
}
