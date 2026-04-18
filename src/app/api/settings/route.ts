import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // Make sure auth is exported from auth.ts
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    // Allow any authenticated user to GET settings, since they need to know if indent creation is enabled
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // Only SUPER_ADMIN and AFO_STAFF can update settings
    if (!session || !session.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "AFO_STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, value } = await req.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error("POST settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
