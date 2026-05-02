import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp, hash, timestamp, newPassword } = body;

    if (!email || !otp || !hash || !timestamp || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify OTP expiry (15 minutes)
    if (Date.now() - timestamp > 15 * 60 * 1000) {
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

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "PASSWORD_RESET",
        entity: "User",
        entityId: user.id,
      },
    });

    return NextResponse.json(
      { message: "Password has been successfully reset." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
