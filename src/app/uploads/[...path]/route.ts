import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    
    // Construct the file path securely
    // We join the path segments from the URL, but prevent directory traversal
    const safePath = path.normalize(path.join(...(segments || []))).replace(/^(\.\.(\/|\\|$))+/, "");
    
    const filepath = path.join(process.cwd(), "public", "uploads", safePath);

    const stat = await fs.stat(filepath);
    if (!stat.isFile()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const fileBuffer = await fs.readFile(filepath);
    
    const ext = path.extname(filepath).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".pdf") contentType = "application/pdf";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("Not Found", { status: 404 });
  }
}
