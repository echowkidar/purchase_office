import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "AFO_STAFF" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const indentStatus = searchParams.get("indentStatus");
    const departmentId = searchParams.get("departmentId");

    const where: any = {};
    if (indentStatus) {
      where.indent = { ...where.indent, status: indentStatus };
    }
    if (departmentId) {
      where.indent = { ...where.indent, departmentId };
    }

    const items = await prisma.indentItem.findMany({
      where,
      include: {
        indent: {
          select: {
            purpose: true,
            requisitionNo: true,
            receiptNo: true,
            receiptDate: true,
            status: true,
            createdAt: true,
            department: { select: { name: true, code: true } },
            requestedBy: { select: { name: true, phone: true } }
          }
        },
        item: {
          select: { name: true, description: true, specifications: true, category: { select: { name: true } }, variants: true }
        }
      },
      orderBy: { indent: { createdAt: 'desc' } }
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching report items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "AFO_STAFF" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, cpoRemarks } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing item ID" }, { status: 400 });
    }

    const updatedItem = await prisma.indentItem.update({
      where: { id },
      data: { cpoRemarks: cpoRemarks || null }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating CPO remark:", error);
    return NextResponse.json({ error: "Failed to update remark" }, { status: 500 });
  }
}
