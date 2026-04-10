import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export default auth((req: NextRequest & { auth: { user: { role: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Public routes — allow all
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Redirect logged-in users away from auth pages
    if (isLoggedIn) {
      if (userRole === "AFO_STAFF") return NextResponse.redirect(new URL("/afo/dashboard", req.url));
      if (userRole === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin/users", req.url));
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // API auth routes — allow all
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protected routes — require login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // AFO routes — AFO_STAFF or SUPER_ADMIN only
  if (pathname.startsWith("/afo")) {
    if (userRole !== "AFO_STAFF" && userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Admin routes — SUPER_ADMIN only
  if (pathname.startsWith("/admin")) {
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo|uploads|images|api/items|api/departments).*)",
  ],
};
