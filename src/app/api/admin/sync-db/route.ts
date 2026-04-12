import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$executeRawUnsafe(`ALTER TABLE "IndentItem" ADD COLUMN IF NOT EXISTS "cpoRemarks" TEXT;`);
    return NextResponse.json({ success: true, result, message: "Database schema synchronized successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
