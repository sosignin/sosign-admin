"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import Link from "next/link";

export default function AdminPetitionReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [takedownModalReport, setTakedownModalReport] = useState(null);
  const [takedownReason, setTakedownReason] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchReports = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        status: statusFilter,
        search: searchQuery,
      });
      const res = await authFetch(`${apiUrl}/api/admin/petition-reports?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch petition reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleTakeDown = async (e) => {
    e.preventDefault();
    if (!takedownModalReport) return;

    try {
      setActionLoading(takedownModalReport._id);
      const res = await authFetch(`${apiUrl}/api/admin/petition-reports/${takedownModalReport._id}/takedown`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: takedownReason }),
      });

      if (res.ok) {
        alert("Petition has been taken down successfully.");
        setTakedownModalReport(null);
        setTakedownReason("");
        await fetchReports();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to take down petition.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (reportId) => {
    if (!confirm("Are you sure you want to dismiss this objection report?")) return;

    try {
      setActionLoading(reportId);
      const res = await authFetch(`${apiUrl}/api/admin/petition-reports/${reportId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Dismissed", adminNotes: "Dismissed by admin after review." }),
      });

      if (res.ok) {
        await fetchReports();
      } else {
        alert("Failed to dismiss report.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = reports.filter((r) => r.status === "Pending" || r.status === "Under Review").length;
  const takenDownCount = reports.filter((r) => r.status === "Resolved (Taken Down)").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <i className="fas fa-flag text-rose-600"></i>
            Petition Objections & Takedown Requests
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review formal petition objection reports filed by Aadhaar-verified users and manage petition takedowns.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all self-start sm:self-auto flex items-center gap-2 cursor-pointer"
        >
          <i className="fas fa-sync-alt"></i> Refresh Reports
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Pending Review</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
            <i className="fas fa-ban"></i>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Petitions Taken Down</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{takenDownCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <i className="fas fa-file-alt"></i>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Objection Reports</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{reports.length}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          {["All", "Pending", "Under Review", "Resolved (Taken Down)", "Dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === s
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search petition or reporter..."
            className="px-3.5 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-cyan-500 w-full md:w-64"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
            <p className="text-xs">Loading objection reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <i className="fas fa-check-circle text-3xl mb-2 text-emerald-500"></i>
            <p className="text-sm font-bold text-slate-700">No objection reports found</p>
            <p className="text-xs text-gray-400 mt-1">There are no reports matching your active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Target Petition</th>
                  <th className="p-4">Reporter (Aadhaar Verified)</th>
                  <th className="p-4">Objection Reason</th>
                  <th className="p-4">Date & Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Target Petition */}
                    <td className="p-4 max-w-xs">
                      {report.petition ? (
                        <div>
                          <Link
                            href={`/dashboard/petitions/${report.petition._id}`}
                            className="font-bold text-slate-800 hover:text-cyan-600 transition-colors line-clamp-2"
                          >
                            {report.petition.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              {report.petition.category || "General"}
                            </span>
                            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                              {report.petition.numberOfSignatures || 0} signatures
                            </span>
                            {report.petition.status === "rejected" && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                Taken Down
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Petition Deleted</span>
                      )}
                    </td>

                    {/* Reporter Info */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          <i className="fas fa-[#0284c7] fa-user-check text-cyan-600"></i>
                          {report.reporterAadhaarName || report.reporter?.name || "Unknown"}
                        </p>
                        <p className="text-[11px] text-gray-500">{report.reporter?.email}</p>
                        {report.reporterMaskedAadhaar && (
                          <span className="inline-block text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Aadhaar: {report.reporterMaskedAadhaar}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Objection Reason */}
                    <td className="p-4 max-w-xs">
                      <div>
                        <span className="inline-block font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-[11px] mb-1">
                          {report.reason}
                        </span>
                        <p className="text-gray-600 line-clamp-2 text-[11px] leading-relaxed">
                          {report.description}
                        </p>
                      </div>
                    </td>

                    {/* Date & Status */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            report.status === "Resolved (Taken Down)"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : report.status === "Dismissed"
                              ? "bg-gray-100 text-gray-600"
                              : report.status === "Under Review"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {report.status}
                        </span>
                        <p className="text-[11px] text-gray-400">
                          {new Date(report.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="View Full Report"
                        >
                          <i className="fas fa-eye"></i> Details
                        </button>

                        {report.status !== "Resolved (Taken Down)" && report.petition?.status !== "rejected" && (
                          <button
                            onClick={() => {
                              setTakedownModalReport(report);
                              setTakedownReason(
                                `Taken down by admin due to formal objection report: ${report.reason}`
                              );
                            }}
                            disabled={actionLoading === report._id}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            title="Take down this petition"
                          >
                            <i className="fas fa-ban"></i> Take Down
                          </button>
                        )}

                        {report.status === "Pending" && (
                          <button
                            onClick={() => handleDismiss(report._id)}
                            disabled={actionLoading === report._id}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            title="Dismiss Report"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-shield-alt text-rose-600"></i> Objection Report Details
              </h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100">
                <span className="font-bold text-slate-700">Petition Title: </span>
                <span className="font-medium text-slate-900">{selectedReport.petition?.title}</span>
              </div>

              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <i className="fas fa-user-check"></i> Reporter (Aadhaar Verified)
                </p>
                <p>Name: {selectedReport.reporterAadhaarName || selectedReport.reporter?.name}</p>
                <p>Email: {selectedReport.reporter?.email}</p>
                <p>Aadhaar Masked: {selectedReport.reporterMaskedAadhaar || "Verified"}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Objection Reason</label>
                <p className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl font-bold">
                  {selectedReport.reason}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Objection Description</label>
                <p className="p-3 bg-slate-50 border border-gray-200 rounded-xl leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {selectedReport.description}
                </p>
              </div>

              {selectedReport.evidenceUrl && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Evidence / Proof Link</label>
                  <a
                    href={selectedReport.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:underline flex items-center gap-1 font-mono break-all"
                  >
                    {selectedReport.evidenceUrl} <i className="fas fa-external-link-alt text-[10px]"></i>
                  </a>
                </div>
              )}

              {selectedReport.adminNotes && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Notes</label>
                  <p className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                    {selectedReport.adminNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Take Down Confirmation Modal */}
      {takedownModalReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i> Confirm Petition Takedown
              </h3>
              <button
                onClick={() => setTakedownModalReport(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to take down petition <strong>&quot;{takedownModalReport.petition?.title}&quot;</strong>?
              This will reject the petition, hide it from public search, and mark this report as resolved.
            </p>

            <form onSubmit={handleTakeDown} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Takedown Reason / Admin Notes
                </label>
                <textarea
                  rows={3}
                  value={takedownReason}
                  onChange={(e) => setTakedownReason(e.target.value)}
                  placeholder="Provide reason for takedown..."
                  className="w-full p-3 text-xs border border-gray-200 rounded-xl outline-none focus:border-rose-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setTakedownModalReport(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === takedownModalReport._id}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading === takedownModalReport._id ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-ban"></i>
                  )}
                  Confirm Takedown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
