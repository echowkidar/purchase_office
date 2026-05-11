import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmail, emailGemRequestSubmitted, emailNewIndentAlert } from "@/lib/sendEmail";

// GET /api/gem-requests
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isSummary = searchParams.get("summary") === "true";
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const deptId = searchParams.get("departmentId");

    const where: Record<string, unknown> = {};

    if (session.user.role === "DEPT_USER" && session.user.departmentId) {
      where.departmentId = session.user.departmentId;
    }

    if (deptId) where.departmentId = deptId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { requisitionNo: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isSummary) {
      const [total, pending, completed] = await Promise.all([
        prisma.gemRequest.count({ where }),
        prisma.gemRequest.count({ where: { ...where, status: { in: ["SUBMITTED", "IN_PROGRESS"] } } }),
        prisma.gemRequest.count({ where: { ...where, status: "COMPLETED" } }),
      ]);
      return NextResponse.json({ total, pending, completed });
    }

    const requests = await prisma.gemRequest.findMany({
      where,
      include: {
        department: true,
        requestedBy: { select: { name: true, email: true, designation: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching gem requests:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/gem-requests
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get department info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { department: true },
    });

    if (!user?.department) {
      return NextResponse.json({ error: "User does not belong to any department" }, { status: 400 });
    }

    const deptCode = user.department.code;
    const year = new Date().getFullYear();

    // Generate requisition number
    const count = await prisma.gemRequest.count({
      where: { requisitionNo: { startsWith: `GEM/${deptCode}/${year}/` } },
    });
    const serial = String(count + 1).padStart(4, "0");
    const requisitionNo = `GEM/${deptCode}/${year}/${serial}`;

    const gemRequest = await prisma.gemRequest.create({
      data: {
        requisitionNo,
        requestType: body.requestType,
        status: body.status === "DRAFT" ? "DRAFT" : "SUBMITTED",
        departmentId: user.department.id,
        requestedById: session.user.id,
        unitName: body.unitName || "",
        userName: body.userName || "",
        institutionalEmail: body.institutionalEmail || "",
        mobileNumber: body.mobileNumber || "",
        dateOfBirth: body.dateOfBirth || null,
        dateOfRetirement: body.dateOfRetirement || null,
        roleToAssign: body.roleToAssign || "",
        hasExistingNicEmail: body.hasExistingNicEmail || false,
        existingNicEmail: body.existingNicEmail || null,
        oldGemId: body.oldGemId || null,
        lastUserName: body.lastUserName || null,
        idRequiredFor: body.idRequiredFor || null,
        projectName: body.projectName || null,
        fundedBy: body.fundedBy || null,
        projectCode: body.projectCode || null,
        hodName: body.hodName || null,
        hodDesignation: body.hodDesignation || null,
        hodPhone: body.hodPhone || null,
      },
      include: { department: true, requestedBy: true },
    });

    // Notifications & Email for SUBMITTED requests
    if (gemRequest.status === "SUBMITTED") {
      // Notify AFO staff
      const afoStaff = await prisma.user.findMany({
        where: { role: { in: ["AFO_STAFF", "SUPER_ADMIN"] }, isActive: true },
      });

      for (const staff of afoStaff) {
        await prisma.notification.create({
          data: {
            userId: staff.id,
            type: "GEM_REQUEST_SUBMITTED",
            message: `New GeM ID request ${requisitionNo} from ${user.department.name}`,
            sentVia: "dashboard",
            relatedId: gemRequest.id,
          },
        });
        // Send email alert to AFO
        try {
          await sendEmail({
            to: staff.email,
            ...emailNewIndentAlert(requisitionNo, user.department.name, 0),
          });
        } catch (e) {
          console.error("Failed to send AFO alert email:", e);
        }
      }

      // Send confirmation to requester
      try {
        await sendEmail({
          to: user.email,
          ...emailGemRequestSubmitted(
            requisitionNo,
            user.department.name,
            body.requestType === "CREATE" ? "New ID Creation" : "ID Replacement"
          ),
        });
      } catch (e) {
        console.error("Failed to send confirmation email:", e);
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        action: "GEM_REQUEST_CREATED",
        entity: "GemRequest",
        entityId: gemRequest.id,
        details: { requisitionNo, requestType: body.requestType, status: gemRequest.status },
      },
    });

    return NextResponse.json(gemRequest, { status: 201 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating gem request:", errMsg);
    return NextResponse.json({ error: `Failed to create GeM request: ${errMsg}` }, { status: 500 });
  }
}
