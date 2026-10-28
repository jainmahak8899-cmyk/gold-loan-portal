import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Badge } from "./ui/Badge";
import type { Lead } from "../types";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function AdminView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemeFilter, setSchemeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: "10" };
      if (schemeFilter) params.schemeId = schemeFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<{ data: Lead[]; pagination: { total: number; totalPages: number } }>("/leads", { params });
      setLeads(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch {
      setError("Failed to load leads. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, [page, schemeFilter, statusFilter]);

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
          value={schemeFilter}
          onChange={(e) => handleFilterChange(setSchemeFilter, e.target.value)}
        >
          <option value="">All Schemes</option>
          <option value="bullet">Bullet Repayment</option>
          <option value="emi">Monthly EMI</option>
        </select>
        <select
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
          value={statusFilter}
          onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <span className="text-sm text-gray-500 ml-auto">
          {total} lead{total !== 1 ? "s" : ""}
        </span>
        <button
          onClick={fetchLeads}
          className="text-sm text-amber-600 hover:text-amber-800 font-medium underline underline-offset-2"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 text-amber-800 text-xs uppercase tracking-wide">
              <tr>
                {["Application ID", "Name", "Mobile", "Gold Details", "Loan Amount", "Scheme", "Status", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!loading && leads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No leads found. Applications will appear here.
                  </td>
                </tr>
              )}
              {!loading &&
                leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-amber-700 whitespace-nowrap">
                      {lead.applicationId}
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{lead.name}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">{lead.mobile}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {lead.netWeightGrams}g net / {lead.karat}K
                    </td>
                    <td className="px-4 py-3 font-semibold text-amber-700 whitespace-nowrap">
                      ₹{fmt(lead.quote?.eligibleLoan ?? 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap capitalize text-gray-700">
                      {lead.schemeId === "bullet" ? "Bullet" : "Monthly EMI"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-amber-50 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-amber-50 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
