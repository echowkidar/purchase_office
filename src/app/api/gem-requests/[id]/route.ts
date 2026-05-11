import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmail, emailGemRequestStatusUpdate } from "@/lib/sendEmail";

// GET /api/gem-requests/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const gemRequest = await prisma.gemRequest.findUnique({
      where: { id },
      include: {
        department: true,
        requestedBy: { select: { name: true, email: true, designation: true, phone: true } },
      },
    });

    if (!gemRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Dept user can only see their own dept's requests
    if (
      session.user.role === "DEPT_USER" &&
      gemRequest.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(gemRequest);
  } catch (error) {
    console.error("Error fetching gem request:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// PATCH /api/gem-requests/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.gemRequest.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { email: true, name: true } },
        department: true,
      },
    });

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only dept user can edit their own DRAFT requests
    if (
      session.user.role === "DEPT_USER" &&
      !(existing.status === "DRAFT" && existing.requestedById === session.user.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isAFO = session.user.role === "AFO_STAFF" || session.user.role === "SUPER_ADMIN";

    const updateData: Record<string, unknown> = {};

    // Dept user can update form fields on DRAFT
    if (session.user.role === "DEPT_USER" && existing.status === "DRAFT") {
      const deptFields = [
        "requestType", "unitName", "userName", "institutionalEmail", "mobileNumber",
        "dateOfBirth", "dateOfRetirement", "roleToAssign", "hasExistingNicEmail",
        "existingNicEmail", "oldGemId", "lastUserName", "idRequiredFor",
        "projectName", "fundedBy", "projectCode", "hodName", "hodDesignation", "hodPhone",
      ];
      for (const field of deptFields) {
        if (body[field] !== undefined) updateData[field] = body[field];
      }
      if (body.status === "SUBMITTED") updateData.status = "SUBMITTED";
    }

    // AFO can update status, remarks, credentials
    if (isAFO) {
      if (body.status) updateData.status = body.status;
      if (body.afoRemarks !== undefined) updateData.afoRemarks = body.afoRemarks;
      if (body.rejectedReason !== undefined) updateData.rejectedReason = body.rejectedReason;
      if (body.gemLoginId !== undefined) updateData.gemLoginId = body.gemLoginId;
      if (body.gemPassword !== undefined) updateData.gemPassword = body.gemPassword;
      if (body.gemRole !== undefined) updateData.gemRole = body.gemRole;
      if (body.status === "COMPLETED" || body.status === "IN_PROGRESS" || body.status === "REJECTED") {
        updateData.processedById = session.user.id;
        updateData.processedAt = new Date();
      }
    }

    const updated = await prisma.gemRequest.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        requestedBy: { select: { email: true, name: true } },
      },
    });

    // Send status update notification to dept user
    if (isAFO && body.status && body.status !== existing.status) {
      const newStatus = body.status as string;
      if (["IN_PROGRESS", "COMPLETED", "REJECTED"].includes(newStatus)) {
        // Dashboard notification
        await prisma.notification.create({
          data: {
            userId: existing.requestedById,
            type: `GEM_REQUEST_${newStatus}`,
            message: `Your GeM request ${existing.requisitionNo} is now ${newStatus.replace("_", " ")}`,
            sentVia: "both",
            relatedId: id,
          },
        });
        // Email notification
        try {
          await sendEmail({
            to: existing.requestedBy.email,
            ...emailGemRequestStatusUpdate(
              existing.requisitionNo,
              newStatus,
              body.rejectedReason || body.afoRemarks
            ),
          });
        } catch (e) {
          console.error("Failed to send status update email:", e);
        }
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        action: "GEM_REQUEST_UPDATED",
        entity: "GemRequest",
        entityId: id,
        details: { changes: updateData as Record<string, string | number | boolean | null> },
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating gem request:", errMsg);
    return NextResponse.json({ error: `Failed to update: ${errMsg}` }, { status: 500 });
  }
}
