import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET — List all departments (admin)
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST — Create department
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const dept = await prisma.department.create({
      data: { name: body.name, code: body.code },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        action: "DEPARTMENT_CREATED",
        entity: "Department",
        entityId: dept.id,
        details: { name: body.name, code: body.code },
      },
    });

    return NextResponse.json(dept, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

// PATCH — Update department
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name;
    if (body.code) updateData.code = body.code;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const dept = await prisma.department.update({
      where: { id: body.id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        action: "DEPARTMENT_UPDATED",
        entity: "Department",
        entityId: dept.id,
        details: updateData as Record<string, string | boolean>,
      },
    });

    return NextResponse.json(dept);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}
