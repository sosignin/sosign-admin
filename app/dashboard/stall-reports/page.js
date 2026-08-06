"use client";

import { useState, useEffect } from "react";
import { authFetch } from "../../../utils/api";

export default function AdminStallReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

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
      }
    } catch (err) {
      alert("Error rejecting report: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-amber-600 to-rose-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <i className="fas fa-store-slash"></i> School 50m Junk Food Stall Violations
            </h1>
            <p className="text-red-100 text-sm mt-1">
              Review and verify crowd-sourced reports of junk food stalls operating within 50 meters of schools in Maharashtra.
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/30">
            <span className="text-2xl font-black">{reports.length}</span>
            <span className="block text-xs uppercase tracking-wider font-semibold text-red-100">{statusFilter} Reports</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setStatusFilter("pending")}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            statusFilter === "pending"
              ? "border-red-600 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fas fa-clock text-amber-500"></i> Pending Review
        </button>
        <button
          onClick={() => setStatusFilter("approved")}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            statusFilter === "approved"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fas fa-check-circle text-green-500"></i> Approved Violations
        </button>
        <button
          onClick={() => setStatusFilter("rejected")}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
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
          <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <i className="fas fa-store-alt-slash text-4xl text-gray-300 mb-3"></i>
            <p className="font-bold text-gray-700">No {statusFilter} stall reports found</p>
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

                {/* Images */}
                {report.images && report.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {report.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noreferrer">
                        <img src={img} alt="Evidence" className="w-20 h-16 object-cover rounded-lg border border-gray-200 shadow-sm hover:opacity-90 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Reporter & Metadata */}
                <div className="text-xs text-gray-400 border-t pt-3 flex items-center justify-between">
                  <span>Reported by: <strong className="text-gray-700">{report.userId?.name || "User"}</strong></span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Action Buttons */}
                {statusFilter === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApprove(report._id)}
                      disabled={actionLoading === report._id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-1"
                    >
                      {actionLoading === report._id ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check"></i> Approve Violation</>}
                    </button>
                    <button
                      onClick={() => setRejectModalId(report._id)}
                      disabled={actionLoading === report._id}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <i className="fas fa-times"></i> Reject
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
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow"
              >
                Confirm Reject
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
