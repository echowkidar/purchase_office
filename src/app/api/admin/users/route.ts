import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: { department: { select: { name: true, code: true } } },
      orderBy: [{ isActive: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(
      users.map((u) => ({ ...u, password: undefined }))
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
