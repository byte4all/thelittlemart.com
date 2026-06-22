import { NextResponse } from "next/server";
import { requireAdminApi } from "../_utils";

// Standby — image upload disabled for now. Restore imports below when re-enabling.
// import { writeFile, mkdir } from "fs/promises";
// import path from "path";
// import ImageKit, { toFile } from "@imagekit/nodejs";
// import { getImageKitUploadFolder, isImageKitServerUploadConfigured } from "@/lib/imagekit";

// const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
// const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const forbidden = await requireAdminApi(request);
  if (forbidden) return forbidden;

  return NextResponse.json(
    { success: false, error: "Image upload is temporarily disabled." },
    { status: 503 }
  );

  /*
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Max 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".png";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;

    if (isImageKitServerUploadConfigured()) {
      const ik = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY! });
      const uploaded = await ik.files.upload({
        file: await toFile(buffer, safeName, { type: file.type }),
        fileName: safeName,
        folder: getImageKitUploadFolder(),
      });
      const url = uploaded.url;
      if (!url) {
        return NextResponse.json(
          { success: false, error: "ImageKit upload did not return a URL" },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: true, url, source: "imagekit" as const });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, buffer);
    const url = `/uploads/${safeName}`;
    return NextResponse.json({ success: true, url, source: "local" as const });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
  */
}
