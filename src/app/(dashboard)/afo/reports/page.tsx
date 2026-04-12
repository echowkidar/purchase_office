"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, FileText, Building2, Search, ArrowUpDown, Save, Edit2 } from "lucide-react";

interface DeptStat {
  department: string;
  code: string;
  count: number;
}

interface ReportItem {
  id: string;
  quantity: number;
  cpoRemarks: string | null;
  remarks: string | null;
  item: {
    name: string;
    category: { name: string };
    variants: { id: string; label: string }[];
  };
  indent: {
    requisitionNo: string;
    createdAt: string;
    status: string;
    department: { name: string; code: string };
    requestedBy: { name: string };
  };
}

export default function AFOReportsPage() {
  const [deptStats, setDeptStats] = useState<DeptStat[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [pending, setPending] = useState(0);
  const [received, setReceived] = useState(0);
  const [loading, setLoading] = useState(true);

  // Items table state
  const [items, setItems] = useState<ReportItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  
  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [remarkStatusFilter, setRemarkStatusFilter] = useState("");
  const [sortField, setSortField] = useState<"date" | "department" | "requisition">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRemark, setEditingRemark] = useState("");

  useEffect(() => {
    // Fetch Summary
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

    // Fetch Items
    fetch("/api/reports/items")
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setItemsLoading(false);
      })
      .catch(() => setItemsLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (items.length === 0) return;

    // Headers
    const headers = [
      "Date", "Requisition No.", "Department", "Requested By", "Item", "Category", "Quantity", "Dept Remarks", "CPO Supply Status / Remark", "Status"
    ];

    const csvRows = [
      headers.join(","),
      ...filteredAndSortedItems.map(item => {
        const row = [
          new Date(item.indent.createdAt).toLocaleDateString("en-IN"),
          item.indent.requisitionNo,
          item.indent.department.name,
          `"${item.indent.requestedBy?.name || ""}"`,
          `"${item.item.name}"`,
          `"${item.item.category.name}"`,
          item.quantity,
          `"${item.remarks || ""}"`,
          `"${item.cpoRemarks || ""}"`,
          item.indent.status
        ];
        return row.join(",");
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Indent_Items_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: "date" | "department" | "requisition") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const saveRemark = async (id: string) => {
    try {
      const res = await fetch("/api/reports/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, cpoRemarks: editingRemark })
      });
      if (res.ok) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, cpoRemarks: editingRemark } : item));
        setEditingId(null);
      }
    } catch {
      alert("Failed to save remark");
    }
  };

  const departmentsList = [...new Set(items.map(i => i.indent.department.name))].sort();

  const filteredAndSortedItems = items
    .filter(item => {
      if (deptFilter && item.indent.department.name !== deptFilter) return false;
      
      if (monthFilter) {
        const itemMonth = new Date(item.indent.createdAt).getMonth() + 1;
        if (itemMonth.toString() !== monthFilter) return false;
      }
      
      if (yearFilter) {
        const itemYear = new Date(item.indent.createdAt).getFullYear();
        if (itemYear.toString() !== yearFilter) return false;
      }
      
      if (remarkStatusFilter) {
        const val = item.cpoRemarks || "";
        if (!val.toLowerCase().includes(remarkStatusFilter.toLowerCase())) return false;
      }

      const searchTerms = search.toLowerCase();
      if (
        search && 
        !(
          item.item.name.toLowerCase().includes(searchTerms) ||
          item.indent.requisitionNo.toLowerCase().includes(searchTerms)
        )
      ) return false;
      return true;
    })
    .sort((a, b) => {
      let valA = "";
      let valB = "";
      
      if (sortField === "date") {
        valA = a.indent.createdAt;
        valB = b.indent.createdAt;
      } else if (sortField === "department") {
        valA = a.indent.department.name;
        valB = b.indent.department.name;
      } else if (sortField === "requisition") {
        valA = a.indent.requisitionNo;
        valB = b.indent.requisitionNo;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading Report Data...</div>;
  }

  const maxCount = Math.max(...deptStats.map((d) => d.count), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amu-green">Reports & Analytics</h1>
          <p className="text-sm text-gray-400">Monthly summary and detailed item tracking</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amu-gold text-amu-green font-semibold hover:bg-amu-gold-light transition-all shadow-sm"
        >
          <Download size={16} /> Export to Excel
        </button>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... existing summary boxes ... */}
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

      {/* Analytics Graph */}
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

      {/* All Items Report Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-amu-green flex items-center gap-2">
            <FileText size={20} /> All Indent Items
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Items or Req. No..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30"
            />
          </div>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30 min-w-[150px]"
            >
              <option value="">All Departments</option>
              {departmentsList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30 min-w-[120px]"
            >
              <option value="">All Months</option>
              <option value="1">Jan</option>
              <option value="2">Feb</option>
              <option value="3">Mar</option>
              <option value="4">Apr</option>
              <option value="5">May</option>
              <option value="6">Jun</option>
              <option value="7">Jul</option>
              <option value="8">Aug</option>
              <option value="9">Sep</option>
              <option value="10">Oct</option>
              <option value="11">Nov</option>
              <option value="12">Dec</option>
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30 min-w-[100px]"
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>

            <input
              type="text"
              value={remarkStatusFilter}
              onChange={(e) => setRemarkStatusFilter(e.target.value)}
              placeholder="Filter by Remark/Status..."
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amu-green/30 min-w-[180px]"
            />
          </div>
        </div>

        {itemsLoading ? (
          <div className="text-center py-4 text-gray-400">Loading items...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th 
                    className="text-left p-3 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">Date <ArrowUpDown size={14}/></div>
                  </th>
                  <th 
                    className="text-left p-3 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("requisition")}
                  >
                    <div className="flex items-center gap-1">Req. No. <ArrowUpDown size={14}/></div>
                  </th>
                  <th 
                    className="text-left p-3 text-gray-500 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort("department")}
                  >
                    <div className="flex items-center gap-1">Department <ArrowUpDown size={14}/></div>
                  </th>
                  <th className="text-left p-3 text-gray-500 font-medium">Item Details</th>
                  <th className="text-center p-3 text-gray-500 font-medium">Qty</th>
                  <th className="text-left p-3 text-gray-500 font-medium">Remark / Supply Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-400">No items found matching criteria.</td>
                  </tr>
                ) : (
                  filteredAndSortedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-3 text-gray-500">
                        {new Date(item.indent.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </td>
                      <td className="p-3 font-mono text-amu-green font-medium">
                        {item.indent.requisitionNo}
                      </td>
                      <td className="p-3">{item.indent.department.name}</td>
                      <td className="p-3">
                        <div className="font-medium text-gray-700">{item.item.name}</div>
                        <div className="text-xs text-gray-400">{item.item.category.name}</div>
                        {item.remarks && <div className="text-xs text-gray-500 mt-1 italic">"{item.remarks}"</div>}
                      </td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingRemark}
                              onChange={(e) => setEditingRemark(e.target.value)}
                              className="text-sm border border-gray-200 rounded px-2 py-1 w-full"
                              placeholder="Add supply status..."
                              autoFocus
                            />
                            <button
                              onClick={() => saveRemark(item.id)}
                              className="text-amu-green hover:text-green-700 p-1"
                              title="Save Remark"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">{item.cpoRemarks || "—"}</span>
                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setEditingRemark(item.cpoRemarks || "");
                              }}
                              className="text-gray-300 hover:text-amu-green opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              title="Edit Remark"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
