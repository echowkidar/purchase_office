import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as Record<string, unknown>).role as string;

  if (role === "AFO_STAFF") {
    redirect("/afo/dashboard");
  } else if (role === "SUPER_ADMIN") {
    redirect("/admin/users");
  } else {
    redirect("/dashboard");
  }
}
