import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

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
        isActive: false,
      },
    });

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
          "Registration successful! Your account is pending approval. You will be notified once activated.",
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
