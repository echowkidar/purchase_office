import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { receiveIndentSchema } from "@/lib/validators";
import { sendEmail, emailIndentReceived } from "@/lib/sendEmail";

// PATCH /api/indents/:id/status — Update indent status (AFO/Admin)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "AFO_STAFF" && session.user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const indent = await prisma.indent.findUnique({
      where: { id },
      include: { requestedBy: true, department: true },
    });

    if (!indent) {
      return NextResponse.json({ error: "Indent not found" }, { status: 404 });
    }

    // If marking as received, require receipt no and date
    if (body.status === "CPO_RECEIVED") {
      const parsed = receiveIndentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const updated = await prisma.indent.update({
        where: { id },
        data: {
          status: "CPO_RECEIVED",
          receiptNo: parsed.data.receiptNo,
          receiptDate: new Date(parsed.data.receiptDate),
          receivedAt: new Date(),
          receivedById: session.user.id,
        },
      });

      // Notify user
      await prisma.notification.create({
        data: {
          userId: indent.requestedById,
          type: "INDENT_RECEIVED",
          message: `Your indent ${indent.requisitionNo} has been received by CPO. Receipt No: ${parsed.data.receiptNo}`,
          sentVia: "both",
        },
      });

      // Send email
      try {
        const emailData = emailIndentReceived(
          indent.requisitionNo,
          parsed.data.receiptNo,
          parsed.data.receiptDate
        );
        await sendEmail({ to: indent.requestedBy.email, ...emailData });
      } catch (e) {
        console.error("Failed to send receive email:", e);
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name,
          action: "INDENT_RECEIVED",
          entity: "Indent",
          entityId: id,
          details: {
            requisitionNo: indent.requisitionNo,
            receiptNo: parsed.data.receiptNo,
          },
        },
      });

      return NextResponse.json(updated);
    }

    // General status update
    if (body.status) {
      const updated = await prisma.indent.update({
        where: { id },
        data: { status: body.status },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name,
          action: "STATUS_CHANGED",
          entity: "Indent",
          entityId: id,
          details: {
            requisitionNo: indent.requisitionNo,
            from: indent.status,
            to: body.status,
          },
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "No status provided" }, { status: 400 });
  } catch (error) {
    console.error("Error updating indent status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
