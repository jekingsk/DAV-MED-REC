import { NextResponse } from "next/server";

/**
 * Proxy download route to ensure browser downloads external Cloudinary files cleanly
 * without CORS restrictions, while enforcing the exact requested filename.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");
    const requestedFilename = searchParams.get("filename") || "Medical_Proof.pdf";

    if (!targetUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Only allow http/https URLs or internal data URLs
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid target URL scheme" }, { status: 400 });
    }

    const response = await fetch(targetUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Remote resource fetch failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await response.arrayBuffer();

    // Sanitize filename for HTTP header
    const cleanFilename = requestedFilename.replace(/[^a-zA-Z0-9._-]/g, "_");

    return new Response(new Uint8Array(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${cleanFilename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to download proxy file" },
      { status: 500 }
    );
  }
}
