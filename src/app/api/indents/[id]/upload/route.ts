import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import fs from "fs/promises";
import path from "path";
import { sendEmail, emailNewIndentAlert } from "@/lib/sendEmail";

export async function POST(request: Request, context: unknown) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { params } = context as { params: { id: string } };

    const indentId = params.id;
    if (!indentId) {
      return NextResponse.json({ error: "Missing indent ID" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "indents");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Ensure it's saved nicely
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
    const fileName = `${indentId}-${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, fileName);

    await fs.writeFile(filePath, buffer);

    const uploadedFileUrl = `/uploads/indents/${fileName}`;

    // Update DB
    const indent = await prisma.indent.update({
      where: { id: indentId },
      data: {
        status: "SUBMITTED",
        uploadedFile: uploadedFileUrl,
        uploadedAt: new Date(),
      },
      include: { department: true, items: true },
    });

    // Notify AFO staff now that it's submitted
    try {
      const afoUsers = await prisma.user.findMany({
        where: { role: { in: ["AFO_STAFF", "SUPER_ADMIN"] }, isActive: true },
      });
      const alertEmail = emailNewIndentAlert(
        indent.requisitionNo,
        indent.department.name,
        indent.items.length
      );
      for (const afo of afoUsers) {
        await prisma.notification.create({
          data: {
            userId: afo.id,
            type: "NEW_INDENT",
            message: `New indent ${indent.requisitionNo} from ${indent.department.name} (${indent.items.length} items)`,
            sentVia: "both",
          },
        });
        await sendEmail({ to: afo.email, ...alertEmail }).catch(() => {});
      }
    } catch (e) {
      console.error("Failed to notify AFO:", e);
    }

    return NextResponse.json({ success: true, fileUrl: uploadedFileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
