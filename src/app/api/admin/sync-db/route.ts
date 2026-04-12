import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
const execAsync = util.promisify(exec);

export async function GET() {
  try {
    const { stdout, stderr } = await execAsync("node node_modules/prisma/build/index.js db push --accept-data-loss");
    return NextResponse.json({ success: true, stdout, stderr });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stdout: error.stdout, stderr: error.stderr }, { status: 500 });
  }
}
