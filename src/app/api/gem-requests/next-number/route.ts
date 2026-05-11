import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/gem-requests/next-number
// Returns next requisition number in GEM/{DEPT_CODE}/{YEAR}/{NNNN} format
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { department: true },
    });

    if (!user?.department) {
      return NextResponse.json({ error: "User has no department" }, { status: 400 });
    }

    const deptCode = user.department.code;
    const year = new Date().getFullYear();

    const count = await prisma.gemRequest.count({
      where: {
        requisitionNo: {
          startsWith: `GEM/${deptCode}/${year}/`,
        },
      },
    });

    const serial = String(count + 1).padStart(4, "0");
    const requisitionNo = `GEM/${deptCode}/${year}/${serial}`;

    return NextResponse.json({ requisitionNo });
  } catch (error) {
    console.error("Error generating GeM req number:", error);
    return NextResponse.json({ error: "Failed to generate number" }, { status: 500 });
  }
}
