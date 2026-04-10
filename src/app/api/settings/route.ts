import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Public check (unauthenticated users or normal users checking if indents are enabled)
export async function GET() {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: "global" }
    });

    // Seed if it doesn't exist
    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: { id: "global" }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// Admin only update
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "AFO_STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { indentsEnabled, indentsDisabledMessage } = await request.json();

    const settings = await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: {
        indentsEnabled,
        indentsDisabledMessage
      },
      create: {
        id: "global",
        indentsEnabled,
        indentsDisabledMessage
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
