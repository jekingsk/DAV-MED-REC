import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get("appId");
    const fileName = searchParams.get("file");

    if (!appId || !fileName) {
      return NextResponse.json({ error: "Missing appId or file parameter" }, { status: 400 });
    }

    const cleanAppId = appId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanFileName = path.basename(fileName);
    const filePath = path.join(process.cwd(), "data", "temp_cloudinary_proofs", cleanAppId, cleanFileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Proof document not found or expired" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(cleanFileName).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${cleanFileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Streaming failed" }, { status: 500 });
  }
}
