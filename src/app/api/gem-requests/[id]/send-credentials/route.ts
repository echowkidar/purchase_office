import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmail, emailGemCredentials } from "@/lib/sendEmail";

// POST /api/gem-requests/[id]/send-credentials
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAFO = session.user.role === "AFO_STAFF" || session.user.role === "SUPER_ADMIN";
    if (!isAFO) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const gemRequest = await prisma.gemRequest.findUnique({
      where: { id },
      include: {
        department: true,
        requestedBy: { select: { name: true, email: true, designation: true, phone: true } },
      },
    });

    if (!gemRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!gemRequest.gemLoginId) {
      return NextResponse.json({ error: "GeM Login ID not set yet" }, { status: 400 });
    }

    const date = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const emailData = emailGemCredentials({
      userName: gemRequest.userName,
      designation: gemRequest.requestedBy.designation || "",
      phone: gemRequest.mobileNumber,
      gemRole: gemRequest.gemRole || gemRequest.roleToAssign,
      gemLoginId: gemRequest.gemLoginId,
      gemPassword: gemRequest.gemPassword || undefined,
      reqNo: gemRequest.requisitionNo,
      date,
    });

    await sendEmail({
      to: gemRequest.institutionalEmail,
      ...emailData,
    });

    // Also CC the requestor's portal email
    if (gemRequest.requestedBy.email !== gemRequest.institutionalEmail) {
      try {
        await sendEmail({
          to: gemRequest.requestedBy.email,
          ...emailData,
        });
      } catch (e) {
        console.error("Failed to CC requestor:", e);
      }
    }

    // Update timestamp and status to COMPLETED
    const updated = await prisma.gemRequest.update({
      where: { id },
      data: {
        credentialEmailSentAt: new Date(),
        status: "COMPLETED",
        processedById: session.user.id,
        processedAt: new Date(),
      },
    });

    // Dashboard notification for dept user
    await prisma.notification.create({
      data: {
        userId: gemRequest.requestedById,
        type: "GEM_CREDENTIALS_SENT",
        message: `GeM credentials for request ${gemRequest.requisitionNo} have been emailed to you.`,
        sentVia: "both",
        relatedId: id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        action: "GEM_CREDENTIALS_SENT",
        entity: "GemRequest",
        entityId: id,
        details: { sentTo: gemRequest.institutionalEmail, reqNo: gemRequest.requisitionNo },
      },
    });

    return NextResponse.json({
      success: true,
      sentAt: updated.credentialEmailSentAt,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending credentials:", errMsg);
    return NextResponse.json({ error: `Failed to send credentials: ${errMsg}` }, { status: 500 });
  }
}
