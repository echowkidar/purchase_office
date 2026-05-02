import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailOtpVerification, emailPasswordResetOtp } from "@/lib/sendEmail";

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json();

    if (!email || !email.endsWith("@amu.ac.in")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (type === "reset") {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (!existingUser) {
        return NextResponse.json(
          { error: "No account found with this email address" },
          { status: 404 }
        );
      }
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const timestamp = Date.now();

    // Send OTP via email
    try {
      const emailData = type === "reset" ? emailPasswordResetOtp(otp) : emailOtpVerification(otp);
      await sendEmail({ to: email, ...emailData });
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      return NextResponse.json(
        { error: "Failed to send OTP email" },
        { status: 500 }
      );
    }

    // Create hash
    const secret = process.env.AUTH_SECRET || "default_secret";
    const data = `${email}|${otp}|${timestamp}`;
    const hash = crypto.createHmac("sha256", secret).update(data).digest("hex");

    return NextResponse.json(
      {
        message: "OTP sent successfully",
        hash,
        timestamp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
