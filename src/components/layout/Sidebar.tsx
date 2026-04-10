"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Users,
  Building2,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  ScrollText,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const deptUserLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/catalogue", label: "Item Catalogue", icon: ShoppingCart },
    { href: "/indents", label: "My Indents", icon: FileText },
    { href: "/indents/new", label: "New Indent", icon: ClipboardList },
  ];

  const afoLinks = [
    { href: "/afo/dashboard", label: "AFO Dashboard", icon: LayoutDashboard },
    { href: "/afo/items", label: "Manage Items", icon: Package },
    { href: "/afo/reports", label: "Reports", icon: BarChart3 },
    { href: "/catalogue", label: "View Catalogue", icon: ShoppingCart },
  ];

  const adminLinks = [
    { href: "/admin/users", label: "Manage Users", icon: Users },
    { href: "/admin/departments", label: "Departments", icon: Building2 },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    { href: "/afo/dashboard", label: "AFO Dashboard", icon: LayoutDashboard },
    { href: "/afo/items", label: "Manage Items", icon: Package },
    { href: "/afo/reports", label: "Reports", icon: BarChart3 },
  ];

  let links = deptUserLinks;
  if (role === "AFO_STAFF") links = afoLinks;
  if (role === "SUPER_ADMIN") links = adminLinks;

  return (
    <aside className="w-64 h-full bg-amu-green text-white flex flex-col shadow-xl">
      {/* Logo Section */}
      <div className="p-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 p-0.5 ring-1 ring-amu-gold/40 flex-shrink-0">
            <Image
              src="/logo/android-chrome-192x192.png"
              alt="AMU"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight">CPO Portal</h2>
            <p className="text-amu-gold text-[10px]">AMU Aligarh</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {role === "SUPER_ADMIN" && (
          <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2 px-3">
            Administration
          </p>
        )}
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" &&
              link.href !== "/afo/dashboard" &&
              pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-amu-gold/20 flex items-center justify-center text-amu-gold text-sm font-bold flex-shrink-0">
            {session?.user?.name?.charAt(0) || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-[10px] text-white/40 truncate">
              {role === "SUPER_ADMIN"
                ? "Super Admin"
                : role === "AFO_STAFF"
                ? "AFO Staff"
                : session?.user?.departmentName || "Department User"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-link w-full text-red-300 hover:text-red-200 hover:bg-red-500/10"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
