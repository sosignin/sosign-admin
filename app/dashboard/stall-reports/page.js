"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";

export default function AdminStallReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [resolveModalId, setResolveModalId] = useState(null);
  const [resolveTargetReport, setResolveTargetReport] = useState(null);
  const [resolveReason, setResolveReason] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchReports = async (status = statusFilter) => {
    try {
      setLoading(true);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/reports?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch stall reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(statusFilter);
  }, [statusFilter]);

  const handleApprove = async (reportId) => {
    try {
      setActionLoading(reportId);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/${reportId}/approve`, {
        method: "PUT",
      });
      if (res.ok) {
        await fetchReports(statusFilter);
      } else {
        alert("Failed to approve report.");
      }
    } catch (err) {
      alert("Error approving report: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalId) return;

    try {
      setActionLoading(rejectModalId);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/${rejectModalId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setRejectModalId(null);
        setRejectReason("");
        await fetchReports(statusFilter);
      } else {
        alert("Failed to reject report.");
      }
    } catch (err) {
      alert("Error rejecting report: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModalId) return;

    try {
      setActionLoading(resolveModalId);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/${resolveModalId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: resolveReason.trim() || "Stall removed / permanently closed. School zone restored as Safe.",
        }),
      });
      if (res.ok) {
        setResolveModalId(null);
        setResolveTargetReport(null);
        setResolveReason("");
        await fetchReports(statusFilter);
      } else {
        alert("Failed to mark stall as removed.");
      }
    } catch (err) {
      alert("Error resolving stall report: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Are you sure you want to permanently delete this resolved stall record from history? This action cannot be undone.")) {
      return;
    }

    try {
      setActionLoading(reportId);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/${reportId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchReports(statusFilter);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to delete stall report.");
      }
    } catch (err) {
      alert("Error deleting report: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <i className="fas fa-store-slash"></i> School 50m Junk Food Stall Violations
            </h1>
            <p className="text-red-100 text-sm mt-1">
              Verify active crowd-sourced reports, track 50m school violations, or mark stalls as removed to restore schools as Safe Zones.
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/30 shrink-0">
            <span className="text-2xl font-black">{reports.length}</span>
            <span className="block text-xs uppercase tracking-wider font-semibold text-red-100">{statusFilter} Records</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 gap-2 sm:gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter("pending")}
          className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
            statusFilter === "pending"
              ? "border-red-600 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fas fa-clock text-amber-500"></i> Pending Review
        </button>
        <button
          onClick={() => setStatusFilter("approved")}
          className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
            statusFilter === "approved"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fas fa-exclamation-triangle text-rose-500"></i> Active Violations
        </button>
        <button
          onClick={() => setStatusFilter("resolved")}
          className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
            statusFilter === "resolved"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fas fa-shield-alt text-emerald-500"></i> Safe Schools (Stalls Removed)
        </button>
        <button
          onClick={() => setStatusFilter("rejected")}
          className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
            statusFilter === "rejected"
              ? "border-gray-600 text-gray-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fas fa-times-circle text-gray-400"></i> Rejected Reports
        </button>
      </div>

      {/* Reports Table / Grid */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <i className="fas fa-spinner fa-spin text-2xl mb-2 text-red-600"></i>
            <p className="text-sm font-semibold">Loading stall reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 space-y-1">
            <i className="fas fa-store-alt-slash text-4xl text-gray-300 mb-2"></i>
            <p className="font-bold text-gray-700">No {statusFilter} stall records found</p>
            <p className="text-xs text-gray-400">
              {statusFilter === "approved"
                ? "No active stall violations. All school zones are currently clean."
                : statusFilter === "resolved"
                ? "No resolved reports yet. Active violations can be marked as resolved once the stall is removed."
                : "No items under this category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => (
              <div key={report._id} className="border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow bg-white space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold bg-red-100 text-red-700 uppercase px-2.5 py-0.5 rounded border border-red-200">
                      {report.city} • Maharashtra
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1">{report.shopName}</h3>
                    <p className="text-xs text-gray-500">
                      Target School: <span className="font-bold text-gray-700">{report.schoolId?.name || "N/A"}</span>
                    </p>
                    {report.schoolId?.address && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{report.schoolId.address}</p>
                    )}
                  </div>
                  {report.distanceFromSchoolMeters !== undefined && (
                    <div className={`px-3 py-1 rounded-xl text-center border font-black text-xs ${
                      report.distanceFromSchoolMeters <= 50 ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      <span>{report.distanceFromSchoolMeters}m</span>
                      <span className="block text-[9px] uppercase font-bold">From School</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {report.description && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 italic">
                    &quot;{report.description}&quot;
                  </p>
                )}

                {/* Resolved Info Box */}
                {report.status === "resolved" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                    <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                      <i className="fas fa-shield-alt text-emerald-600"></i>
                      <span>School Zone Restored to Safe Status</span>
                    </div>
                    <p className="text-emerald-700 text-[11px]">
                      {report.resolutionNote || "Stall removed / closed down. School zone marked Safe."}
                    </p>
                    {report.resolvedAt && (
                      <span className="text-[10px] text-emerald-600 block">
                        Resolved on {new Date(report.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Rejection Info Box */}
                {report.status === "rejected" && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                      <i className="fas fa-times-circle text-gray-500"></i> Rejection Reason:
                    </span>
                    <p className="text-gray-600 text-[11px]">
                      {report.rejectionReason || "Report rejected by admin."}
                    </p>
                  </div>
                )}

                {/* Images */}
                {report.images && report.images.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">
                      Evidence Photos ({report.images.length}):
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {report.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer">
                          <img src={img} alt="Evidence" className="w-20 h-16 object-cover rounded-lg border border-gray-200 shadow-sm hover:opacity-90 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reporter & Metadata */}
                <div className="text-xs text-gray-400 border-t pt-3 flex items-center justify-between">
                  <span>Reported by: <strong className="text-gray-700">{report.userId?.name || "Citizen"}</strong></span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Action Buttons */}
                {statusFilter === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApprove(report._id)}
                      disabled={actionLoading === report._id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {actionLoading === report._id ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check"></i> Approve Violation</>}
                    </button>
                    <button
                      onClick={() => setRejectModalId(report._id)}
                      disabled={actionLoading === report._id}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fas fa-times"></i> Reject
                    </button>
                  </div>
                )}

                {statusFilter === "approved" && (
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setResolveModalId(report._id);
                        setResolveTargetReport(report);
                      }}
                      disabled={actionLoading === report._id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="fas fa-shield-alt"></i>
                      <span>Mark Stall Removed & Restore School as Safe</span>
                    </button>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setRejectModalId(report._id)}
                        disabled={actionLoading === report._id}
                        className="text-[11px] text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Cancel / Reject Violation
                      </button>
                    </div>
                  </div>
                )}

                {statusFilter === "resolved" && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApprove(report._id)}
                      disabled={actionLoading === report._id}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Reopen violation if stall returns"
                    >
                      <i className="fas fa-undo"></i>
                      <span>Reopen Violation</span>
                    </button>
                    <button
                      onClick={() => handleDelete(report._id)}
                      disabled={actionLoading === report._id}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Permanently delete from resolved history"
                    >
                      <i className="fas fa-trash-alt"></i>
                      <span>Delete History</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRejectSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-times-circle text-red-500"></i> Reject Stall Report
            </h3>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason (e.g. Insufficient evidence photo, incorrect shop location)..."
              className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resolve / Make School Safe Modal */}
      {resolveModalId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleResolveSubmit}
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-emerald-100"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-lg">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Mark Stall Removed & Restore Safe School Zone
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Shop: <strong className="text-gray-800">{resolveTargetReport?.shopName}</strong> &bull; School:{" "}
                  <strong className="text-gray-800">{resolveTargetReport?.schoolId?.name || "Target School"}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <i className="fas fa-info-circle text-emerald-600"></i>
                <span>How this affects the public portal:</span>
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Confirming this action will immediately remove the active 50m violation pin from the public interactive map.
                The school zone will be marked as <strong>🛡️ Safe / Protected Zone</strong> and the active violation counter will decrement.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Resolution Reason / Action Taken Details:
              </label>
              <textarea
                required
                rows={3}
                value={resolveReason}
                onChange={(e) => setResolveReason(e.target.value)}
                placeholder="e.g. Stall permanently removed by municipal corporation / Stall shifted beyond 50m / Shop permanently closed..."
                className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setResolveModalId(null);
                  setResolveTargetReport(null);
                  setResolveReason("");
                }}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading === resolveModalId}
                className="px-5 py-2.5 text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading === resolveModalId ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className="fas fa-check-circle"></i>
                    <span>Confirm Stall Removed & Make School Safe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
