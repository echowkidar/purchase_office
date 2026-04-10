import { prisma } from "./prisma";

/**
 * Generate a requisition number in the format: CPO/{DEPT_CODE}/{YEAR}/{SERIAL}
 * Example: CPO/CS/2025/0042
 */
export async function generateReqNo(departmentCode: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();

  // Count existing indents for this department in the current year
  const count = await prisma.indent.count({
    where: {
      requisitionNo: {
        startsWith: `CPO/${departmentCode}/${year}/`,
      },
    },
  });

  const serial = String(count + 1).padStart(4, "0");
  return `CPO/${departmentCode}/${year}/${serial}`;
}
