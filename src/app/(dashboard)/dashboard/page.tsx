"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ShoppingCart,
  Clock,
  CheckCircle,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  total: number;
  submitted: number;
  received: number;
  recent: {
    id: string;
    requisitionNo: string;
    status: string;
    createdAt: string;
    itemCount: number;
  }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/indents?summary=true")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const statusBadge = (status: string) => {
    const classes: Record<string, string> = {
      SUBMITTED: "badge-submitted",
      CPO_RECEIVED: "badge-received",
      PROCESSING: "badge-pending",
      CLOSED: "badge-closed",
    };
    return `inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
      classes[status] || "bg-gray-100 text-gray-600"
    }`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-amu-green to-amu-green-mid rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-1">
          Welcome, {session?.user?.name}!
        </h1>
        <p className="text-white/70 text-sm">
          {session?.user?.departmentName} — {session?.user?.role === "DEPT_USER" ? "Department User" : session?.user?.role}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/indents/new"
          className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-amu-gold/50 hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amu-gold/10 flex items-center justify-center text-amu-gold group-hover:bg-amu-gold group-hover:text-white transition-all">
            <PlusCircle size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-amu-green">New Indent</h3>
            <p className="text-xs text-gray-400">Submit a purchase request</p>
          </div>
        </Link>

        <Link
          href="/catalogue"
          className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-amu-green/30 hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amu-green/10 flex items-center justify-center text-amu-green group-hover:bg-amu-green group-hover:text-white transition-all">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-amu-green">Browse Catalogue</h3>
            <p className="text-xs text-gray-400">View available items</p>
          </div>
        </Link>

        <Link
          href="/indents"
          className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-status-submit/30 hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-status-submit group-hover:bg-status-submit group-hover:text-white transition-all">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-amu-green">My Indents</h3>
            <p className="text-xs text-gray-400">Track your requests</p>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Indents</p>
              <p className="text-3xl font-bold text-amu-green mt-1">
                {stats?.total ?? "—"}
              </p>
            </div>
            <FileText size={32} className="text-amu-green/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-status-pending mt-1">
                {stats?.submitted ?? "—"}
              </p>
            </div>
            <Clock size={32} className="text-status-pending/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Received by CPO</p>
              <p className="text-3xl font-bold text-status-received mt-1">
                {stats?.received ?? "—"}
              </p>
            </div>
            <CheckCircle size={32} className="text-status-received/20" />
          </div>
        </div>
      </div>

      {/* Recent Indents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-amu-green">
            Recent Indents
          </h2>
          <Link
            href="/indents"
            className="text-sm text-amu-gold hover:text-amu-gold-light flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {stats?.recent && stats.recent.length > 0 ? (
            stats.recent.map((indent) => (
              <Link
                key={indent.id}
                href={`/indents/${indent.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-mono text-sm font-medium text-amu-green">
                    {indent.requisitionNo}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(indent.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    • {indent.itemCount} items
                  </p>
                </div>
                <span className={statusBadge(indent.status)}>
                  {indent.status.replace("_", " ")}
                </span>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              <FileText size={40} className="mx-auto mb-2 opacity-30" />
              <p>No indents yet.</p>
              <Link
                href="/indents/new"
                className="text-amu-gold text-sm mt-1 inline-block"
              >
                Create your first indent →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
