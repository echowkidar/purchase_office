import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmail, emailUserActivated } from "@/lib/sendEmail";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.role) updateData.role = body.role;
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.designation !== undefined) updateData.designation = body.designation;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Send activation email
    if (body.isActive === true) {
      try {
        const emailData = emailUserActivated(user.name);
        await sendEmail({ to: user.email, ...emailData });
      } catch (e) {
        console.error("Failed to send activation email:", e);
      }

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "USER_ACTIVATED",
          message: "Your account has been activated. You can now login.",
          sentVia: "both",
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        action: body.isActive !== undefined ? "USER_STATUS_CHANGED" : Object.keys(updateData).length > 0 ? "USER_UPDATED" : "USER_ROLE_CHANGED",
        entity: "User",
        entityId: id,
        details: {
          userName: user.name,
          ...updateData,
        },
      },
    });

    return NextResponse.json({ ...user, password: undefined });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
