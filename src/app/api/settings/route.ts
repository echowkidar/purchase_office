import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/settings
export async function GET() {
  try {
    let settings = await prisma.systemSetting.findFirst({
      where: { id: "global" }
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: { id: "global", indentsEnabled: true }
      });
    }

    return new NextResponse(JSON.stringify(settings), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "AFO_STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { indentsEnabled, indentsDisabledMessage } = body;

    const settings = await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: {
        indentsEnabled: indentsEnabled === true,
        indentsDisabledMessage: String(indentsDisabledMessage)
      },
      create: {
        id: "global",
        indentsEnabled: indentsEnabled === true,
        indentsDisabledMessage: String(indentsDisabledMessage)
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
  }
}
