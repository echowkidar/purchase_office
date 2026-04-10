import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/indents/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const indent = await prisma.indent.findUnique({
      where: { id },
      include: {
        department: true,
        requestedBy: { select: { id: true, name: true, designation: true, email: true, phone: true } },
        items: {
          include: {
            item: { include: { category: true, variants: true } },
          },
        },
      },
    });

    if (!indent) {
      return NextResponse.json({ error: "Indent not found" }, { status: 404 });
    }

    // Department users can only view their own indents
    if (
      session.user.role === "DEPT_USER" &&
      indent.requestedById !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(indent);
  } catch (error) {
    console.error("Error fetching indent:", error);
    return NextResponse.json({ error: "Failed to fetch indent" }, { status: 500 });
  }
}
