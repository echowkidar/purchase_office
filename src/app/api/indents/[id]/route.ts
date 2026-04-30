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
        requestedBy: { select: { id: true, name: true, designation: true, email: true, phone: true, role: true } },
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

    // If CPO created this on behalf of a department, fetch a department user for display purposes
    let displayUser = indent.requestedBy;
    if (displayUser.role === "AFO_STAFF" || displayUser.role === "SUPER_ADMIN") {
      const deptUser = await prisma.user.findFirst({
        where: { departmentId: indent.departmentId, role: "DEPT_USER" },
        select: { id: true, name: true, designation: true, email: true, phone: true, role: true },
        orderBy: { createdAt: "asc" }
      });
      
      if (deptUser) {
        displayUser = deptUser as any;
      } else {
        displayUser = { ...displayUser, name: "Representative", designation: indent.department.name };
      }
    }

    // Department users can view any indent belonging to their department
    if (
      session.user.role === "DEPT_USER" &&
      indent.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ ...indent, requestedBy: displayUser });
  } catch (error) {
    console.error("Error fetching indent:", error);
    return NextResponse.json({ error: "Failed to fetch indent" }, { status: 500 });
  }
}

// DELETE /api/indents/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const indent = await prisma.indent.findUnique({ where: { id } });

    if (!indent) {
      return NextResponse.json({ error: "Indent not found" }, { status: 404 });
    }

    // Department users can only delete their department's DRAFT indents
    if (session.user.role === "DEPT_USER" && indent.departmentId !== session.user.departmentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (indent.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT indents can be removed." }, { status: 400 });
    }

    await prisma.indent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting indent:", error);
    return NextResponse.json({ error: "Failed to delete indent" }, { status: 500 });
  }
}

// PUT /api/indents/:id — Update indent (edit)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const indent = await prisma.indent.findUnique({ where: { id } });

    if (!indent) {
      return NextResponse.json({ error: "Indent not found" }, { status: 404 });
    }

    // Permission check
    const role = session.user.role;
    if (role === "DEPT_USER") {
      if (indent.status !== "DRAFT" || indent.departmentId !== session.user.departmentId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (role === "AFO_STAFF" || role === "SUPER_ADMIN") {
      if (indent.status !== "DRAFT" && indent.status !== "CPO_RECEIVED" && indent.status !== "SUBMITTED") {
        return NextResponse.json({ error: "Cannot edit indent in this status" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate
    if (!body.purpose || body.purpose.length < 10) {
      return NextResponse.json({ error: "Purpose must be at least 10 characters" }, { status: 400 });
    }
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    // Update indent and items in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update indent fields
      const updatedIndent = await tx.indent.update({
        where: { id },
        data: {
          purpose: body.purpose,
          urgency: body.urgency || indent.urgency,
        },
      });

      // Delete removed items
      const keepIds = body.items.map((i: { id: string }) => i.id).filter((id: string) => id && !id.startsWith("new-"));
      await tx.indentItem.deleteMany({
        where: {
          indentId: id,
          id: { notIn: keepIds },
        },
      });

      // Update existing or create new items
      for (const item of body.items) {
        if (item.id && !item.id.startsWith("new-")) {
          await tx.indentItem.update({
            where: { id: item.id },
            data: {
              quantity: item.quantity,
              year1Qty: item.year1Qty || 0,
              year1Remarks: item.year1Remarks || "",
              year2Qty: item.year2Qty || 0,
              year2Remarks: item.year2Remarks || "",
              year3Qty: item.year3Qty || 0,
              year3Remarks: item.year3Remarks || "",
              remarks: item.remarks || "",
              usedByName: item.usedByName || "",
            },
          });
        } else {
          // Create new item
          await tx.indentItem.create({
            data: {
              indentId: id,
              itemId: item.itemId,
              variantId: item.variantId,
              quantity: item.quantity,
              year1Label: item.year1Label || "",
              year1Qty: item.year1Qty || 0,
              year1Remarks: item.year1Remarks || "",
              year2Label: item.year2Label || "",
              year2Qty: item.year2Qty || 0,
              year2Remarks: item.year2Remarks || "",
              year3Label: item.year3Label || "",
              year3Qty: item.year3Qty || 0,
              year3Remarks: item.year3Remarks || "",
              remarks: item.remarks || "",
              usedByName: item.usedByName || "",
            },
          });
        }
      }

      return updatedIndent;
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        action: "INDENT_EDITED",
        entity: "Indent",
        entityId: id,
        details: { requisitionNo: indent.requisitionNo },
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating indent:", errMsg, error);
    return NextResponse.json({ error: `Failed to update indent: ${errMsg}` }, { status: 500 });
  }
}
