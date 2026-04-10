"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, FileText, Building2 } from "lucide-react";

interface DeptStat {
  department: string;
  code: string;
  count: number;
}

export default function AFOReportsPage() {
  const [deptStats, setDeptStats] = useState<DeptStat[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [pending, setPending] = useState(0);
  const [received, setReceived] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/summary")
      .then((res) => res.json())
      .then((data) => {
        setDeptStats(data.deptStats || []);
        setMonthTotal(data.monthTotal || 0);
        setPending(data.pending || 0);
        setReceived(data.received || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  const maxCount = Math.max(...deptStats.map((d) => d.count), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amu-green">Reports & Analytics</h1>
          <p className="text-sm text-gray-400">Monthly summary and department-wise statistics</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amu-gold text-amu-green font-semibold hover:bg-amu-gold-light transition-all shadow-sm"
        >
          <Download size={16} /> Export
        </button>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amu-green/10 flex items-center justify-center">
              <FileText size={20} className="text-amu-green" />
            </div>
            <div>
              <p className="text-sm text-gray-400">This Month Total</p>
              <p className="text-2xl font-bold text-amu-green">{monthTotal}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-pending/10 flex items-center justify-center">
              <BarChart3 size={20} className="text-status-pending" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-status-pending">{pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-received/10 flex items-center justify-center">
              <BarChart3 size={20} className="text-status-received" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Received & Processing</p>
              <p className="text-2xl font-bold text-status-received">{received}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department-wise Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-amu-green mb-4 flex items-center gap-2">
          <Building2 size={20} /> Department-wise Indents
        </h2>
        {deptStats.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No data available</p>
        ) : (
          <div className="space-y-3">
            {deptStats.map((dept) => (
              <div key={dept.code} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-600 truncate">{dept.department}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amu-green to-amu-green-light rounded-full transition-all duration-500"
                    style={{ width: `${(dept.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-sm font-bold text-amu-green">
                  {dept.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
