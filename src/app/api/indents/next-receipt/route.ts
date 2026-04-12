import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/indents/next-receipt — Get next auto-generated receipt number
export async function GET() {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "AFO_STAFF" && session.user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Determine current financial year (April to March)
    const now = new Date();
    const month = now.getMonth(); // 0=Jan, 3=Apr
    const year = now.getFullYear();
    const fyStart = month >= 3 ? year : year - 1; // If Apr or later, FY starts this year
    const fyEnd = fyStart + 1;
    const financialYear = `${fyStart}-${String(fyEnd).slice(2)}`; // e.g., "2026-27"

    // Count existing receipts in this financial year to get next number
    // Financial year starts April 1 and ends March 31
    const fyStartDate = new Date(fyStart, 3, 1); // April 1 of start year
    const fyEndDate = new Date(fyEnd, 3, 1); // April 1 of next year

    const count = await prisma.indent.count({
      where: {
        receiptNo: { not: null },
        receiptDate: {
          gte: fyStartDate,
          lt: fyEndDate,
        },
      },
    });

    const nextNumber = count + 1;
    const receiptNo = `${nextNumber}/${financialYear}/CPO`;

    return NextResponse.json({ receiptNo, financialYear });
  } catch (error) {
    console.error("Error generating receipt number:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt number" },
      { status: 500 }
    );
  }
}
