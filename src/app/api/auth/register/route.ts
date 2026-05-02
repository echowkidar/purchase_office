import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { sendEmail, emailUserRegistered } from "@/lib/sendEmail";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, departmentId, designation, phone } = parsed.data;
    const { otp, hash, timestamp } = body;

    if (!otp || !hash || !timestamp) {
      return NextResponse.json(
        { error: "OTP verification details are missing." },
        { status: 400 }
      );
    }

    // Verify OTP expiry (60 minutes)
    if (Date.now() - timestamp > 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP hash
    const secret = process.env.AUTH_SECRET || "default_secret";
    const data = `${email}|${otp}|${timestamp}`;
    const expectedHash = crypto.createHmac("sha256", secret).update(data).digest("hex");

    if (hash !== expectedHash) {
      return NextResponse.json(
        { error: "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Check if department already has a registered user
    const existingDeptUser = await prisma.user.findFirst({
      where: {
        departmentId,
        role: "DEPT_USER",
      },
      include: { department: true },
    });

    if (existingDeptUser) {
      return NextResponse.json(
        {
          error: `This department (${existingDeptUser.department?.name}) already has a registered user. Please contact the administrator.`,
          warning: true,
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (inactive by default — admin must approve)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        departmentId,
        designation,
        phone,
        role: "DEPT_USER",
        isActive: true,
      },
    });

    // Send registration email
    try {
      const emailData = emailUserRegistered(user.name);
      await sendEmail({ to: user.email, ...emailData });
    } catch (e) {
      console.error("Failed to send registration email:", e);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "USER_REGISTERED",
        entity: "User",
        entityId: user.id,
        details: { email, department: departmentId },
      },
    });

    return NextResponse.json(
      {
        message:
          "Registration successful! You can now log in.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
