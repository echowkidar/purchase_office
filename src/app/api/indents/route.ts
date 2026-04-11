import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createIndentSchema } from "@/lib/validators";
import { generateReqNo } from "@/lib/generateReqNo";
import { sendEmail, emailIndentSubmitted, emailNewIndentAlert } from "@/lib/sendEmail";

// GET /api/indents — List indents
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isSummary = searchParams.get("summary") === "true";

    const where: Record<string, unknown> = {};

    // Department users see only their own indents
    if (session.user.role === "DEPT_USER") {
      where.requestedById = session.user.id;
    }

    // Optional filters for AFO/Admin
    const deptId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    if (deptId) where.departmentId = deptId;
    if (status) where.status = status;
    if (search) {
      where.requisitionNo = { contains: search, mode: "insensitive" };
    }

    if (isSummary) {
      const [total, submitted, received, recent] = await Promise.all([
        prisma.indent.count({ where }),
        prisma.indent.count({ where: { ...where, status: "SUBMITTED" } }),
        prisma.indent.count({ where: { ...where, status: { in: ["CPO_RECEIVED", "PROCESSING", "CLOSED"] } } }),
        prisma.indent.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { _count: { select: { items: true } } },
        }),
      ]);

      return NextResponse.json({
        total,
        submitted,
        received,
        recent: recent.map((r) => ({
          id: r.id,
          requisitionNo: r.requisitionNo,
          status: r.status,
          createdAt: r.createdAt,
          itemCount: r._count.items,
        })),
      });
    }

    const indents = await prisma.indent.findMany({
      where,
      include: {
        department: true,
        requestedBy: { select: { name: true, designation: true } },
        items: {
          include: {
            item: { include: { category: true } },
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(indents);
  } catch (error) {
    console.error("Error fetching indents:", error);
    return NextResponse.json({ error: "Failed to fetch indents" }, { status: 500 });
  }
}

// POST /api/indents — Create new indent
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createIndentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Get user's department
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { department: true },
    });

    if (!user?.department) {
      return NextResponse.json(
        { error: "User does not belong to any department" },
        { status: 400 }
      );
    }

    // Generate requisition number
    const requisitionNo = await generateReqNo(user.department.code);

    // Create indent with items
    const indent = await prisma.indent.create({
      data: {
        requisitionNo,
        departmentId: user.department.id,
        requestedById: user.id,
        purpose: parsed.data.purpose,
        urgency: parsed.data.urgency,
        status: "DRAFT",
        items: {
          create: parsed.data.items.map((item) => ({
            itemId: item.itemId,
            variantId: item.variantId,
            quantity: item.quantity,
            year1Label: item.year1Label,
            year1Qty: item.year1Qty,
            year1Remarks: item.year1Remarks,
            year2Label: item.year2Label,
            year2Qty: item.year2Qty,
            year2Remarks: item.year2Remarks,
            year3Label: item.year3Label,
            year3Qty: item.year3Qty,
            year3Remarks: item.year3Remarks,
            remarks: item.remarks,
            usedByName: item.usedByName,
          })),
        },
      },
      include: {
        department: true,
        items: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        action: "INDENT_CREATED",
        entity: "Indent",
        entityId: indent.id,
        details: { requisitionNo, itemCount: indent.items.length },
      },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "INDENT_DRAFTED",
        message: `Your indent ${requisitionNo} has been generated. Please print, sign, and upload it to finalize submission.`,
        sentVia: "dashboard",
      },
    });

    // Send email to user
    try {
      // Re-using the submitted email template for now, but in reality it's just a "Generated" email.
      const emailData = emailIndentSubmitted(requisitionNo, user.department.name);
      await sendEmail({ to: user.email, ...emailData });
    } catch (e) {
      console.error("Failed to send email:", e);
    }

    return NextResponse.json(indent, { status: 201 });
  } catch (error) {
    console.error("Error creating indent:", error);
    return NextResponse.json({ error: "Failed to create indent" }, { status: 500 });
  }
}
