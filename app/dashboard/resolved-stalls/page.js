"use client";

import { useState, useEffect, useMemo } from "react";
import { authFetch } from "@/utils/api";

export default function AdminResolvedStallsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchResolvedReports = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/reports?status=resolved`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch resolved stall reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolvedReports();
  }, []);

  const handleDelete = async (reportId) => {
    try {
      setActionLoading(reportId);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/${reportId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        await fetchResolvedReports();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to delete record.");
      }
    } catch (err) {
      alert("Error deleting report: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopen = async (reportId) => {
    try {
      setActionLoading(reportId);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/${reportId}/approve`, {
        method: "PUT",
      });
      if (res.ok) {
        await fetchResolvedReports();
      } else {
        alert("Failed to reopen violation.");
      }
    } catch (err) {
      alert("Error reopening report: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Distinct cities from reports
  const cities = useMemo(() => {
    const set = new Set();
    reports.forEach((r) => {
      const c = r.city || r.schoolId?.city;
      if (c) set.add(c.trim());
    });
    return Array.from(set).sort();
  }, [reports]);

  // Unique safe schools count
  const uniqueSafeSchoolsCount = useMemo(() => {
    const schoolIds = new Set();
    reports.forEach((r) => {
      const id = r.schoolId?._id || r.schoolId?.name;
      if (id) schoolIds.add(String(id));
    });
    return schoolIds.size;
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchCity =
        selectedCity === "all" ||
        (r.city || r.schoolId?.city || "").toLowerCase() === selectedCity.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (r.shopName || "").toLowerCase().includes(q) ||
        (r.schoolId?.name || "").toLowerCase().includes(q) ||
        (r.grievanceId || "").toLowerCase().includes(q) ||
        (r.resolutionNote || "").toLowerCase().includes(q) ||
        (r.city || "").toLowerCase().includes(q);

      return matchCity && matchSearch;
    });
  }, [reports, selectedCity, searchQuery]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-2">
              <i className="fas fa-shield-alt"></i> Official Enforcement Log
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <i className="fas fa-history"></i> Resolved Stalls History &amp; Safe Schools
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
              Historical archive of food stalls confirmed removed or permanently closed within 50m of school entrances. Admins can audit resolution records or delete history entries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl text-center border border-white/30 shrink-0">
              <span className="text-2xl font-black">{reports.length}</span>
              <span className="block text-[11px] uppercase tracking-wider font-semibold text-emerald-100">
                Stalls Removed
              </span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl text-center border border-white/30 shrink-0">
              <span className="text-2xl font-black">{uniqueSafeSchoolsCount}</span>
              <span className="block text-[11px] uppercase tracking-wider font-semibold text-emerald-100">
                Safe Schools
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <i className="fas fa-search absolute left-3 top-3 text-gray-400 text-sm"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stall, school, city, or grievance..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-emerald-600 text-gray-800"
            />
          </div>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full sm:w-48 py-2 px-3 text-xs border border-gray-300 rounded-xl outline-none focus:border-emerald-600 bg-white text-gray-800 font-semibold"
          >
            <option value="all">All Cities ({reports.length})</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchResolvedReports}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <i className={`fas fa-sync-alt ${loading ? "fa-spin" : ""}`}></i>
          <span>Refresh</span>
        </button>
      </div>

      {/* Records Container */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        {loading ? (
          <div className="py-16 text-center text-gray-500 space-y-2">
            <i className="fas fa-spinner fa-spin text-3xl text-emerald-600"></i>
            <p className="text-sm font-semibold">Loading resolved stall history...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center text-gray-500 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center mx-auto">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 className="text-base font-bold text-gray-800">No Resolved Stall History Records</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {searchQuery || selectedCity !== "all"
                ? "No resolved reports match your current search/filter."
                : "When active stall violations are verified closed or removed by admin, they will appear here as safe school history records."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((report) => (
              <div
                key={report._id}
                className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Resolved Status Header Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full mb-1">
                      <i className="fas fa-check-circle"></i> Stall Removed &bull; School Safe
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-base leading-tight">
                      {report.shopName}
                    </h3>
                    {report.grievanceId && (
                      <span className="text-[10px] font-mono font-bold text-gray-400 block mt-0.5">
                        ID: {report.grievanceId}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                    {report.distanceFromSchoolMeters}m Away
                  </span>
                </div>

                {/* School Details */}
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/80 text-xs space-y-1">
                  <span className="font-extrabold text-gray-900 block flex items-center gap-1.5">
                    <i className="fas fa-school text-emerald-600"></i>
                    <span>{report.schoolId?.name || "School"}</span>
                  </span>
                  <p className="text-gray-500 text-[11px]">
                    {report.schoolId?.address || report.schoolId?.city || report.city || "Maharashtra"}
                  </p>
                </div>

                {/* Resolution Note */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <i className="fas fa-clipboard-check"></i> Admin Resolution Note:
                    </span>
                    {report.resolvedAt && (
                      <span className="text-gray-400 font-normal text-[10px]">
                        {new Date(report.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-[11px] italic">
                    &ldquo;{report.resolutionNote || "Stall removed / permanently closed. School zone restored as Safe."}&rdquo;
                  </p>
                </div>

                {/* Photos if any */}
                {report.images && report.images.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">
                      Evidence Photos ({report.images.length}):
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {report.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer">
                          <img
                            src={img}
                            alt="Evidence"
                            className="w-16 h-14 object-cover rounded-lg border border-gray-200 shadow-xs hover:opacity-90"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-2 flex items-center justify-between">
                  <span>Reported by: <strong className="text-gray-700">{report.userId?.name || "Citizen"}</strong></span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => handleReopen(report._id)}
                    disabled={actionLoading === report._id}
                    className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="If stall has returned, reopen as active violation"
                  >
                    <i className="fas fa-undo"></i>
                    <span>Reopen</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(report._id)}
                    disabled={actionLoading === report._id}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Delete resolved stall history record"
                  >
                    <i className="fas fa-trash-alt"></i>
                    <span>Delete History</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-red-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-xl mx-auto">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-gray-900">Delete Resolved History Record?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to permanently delete this resolved stall record from history? This action cannot be undone and will permanently remove this record from the Safe Schools audit log.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={actionLoading === deleteConfirmId}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {actionLoading === deleteConfirmId ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className="fas fa-trash-alt"></i>
                    <span>Yes, Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
