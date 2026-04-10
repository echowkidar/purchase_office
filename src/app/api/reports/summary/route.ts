import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "AFO_STAFF" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthTotal, pending, received, deptData] = await Promise.all([
      prisma.indent.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.indent.count({
        where: { status: "SUBMITTED" },
      }),
      prisma.indent.count({
        where: { status: { in: ["CPO_RECEIVED", "PROCESSING"] } },
      }),
      prisma.indent.groupBy({
        by: ["departmentId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    // Enrich department data
    const departments = await prisma.department.findMany();
    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d]));

    const deptStats = deptData.map((d) => ({
      department: deptMap[d.departmentId]?.name || "Unknown",
      code: deptMap[d.departmentId]?.code || "?",
      count: d._count.id,
    }));

    return NextResponse.json({
      monthTotal,
      pending,
      received,
      deptStats,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
