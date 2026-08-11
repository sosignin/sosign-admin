"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";

export default function AdminStallDisputesPage() {
  const [disputeReports, setDisputeReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [activeModal, setActiveModal] = useState(null); // { reportId, defenseId, action }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/disputes`);
      if (res.ok) {
        const data = await res.json();
        setDisputeReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to fetch stall disputes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!activeModal) return;

    const { reportId, defenseId, action } = activeModal;

    try {
      setActionLoading(defenseId);
      const res = await authFetch(
        `${apiUrl}/api/stall-reports/admin/disputes/${reportId}/${defenseId}/resolve`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, adminNotes }),
        }
      );

      if (res.ok) {
        setActiveModal(null);
        setAdminNotes("");
        fetchDisputes();
      } else {
        alert("Failed to resolve dispute.");
      }
    } catch (err) {
      alert("Error resolving dispute: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getReasonBadge = (reason) => {
    switch (reason) {
      case "not_within_50m":
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">📏 Not within 50m</span>;
      case "stall_shifted":
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold">🚚 Stall Shifted / Relocated</span>;
      case "closed_down":
        return <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full font-bold">🚫 Stall Closed Permanently</span>;
      case "has_permission":
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">📜 Has Valid Permission</span>;
      default:
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-bold">ℹ️ Other Dispute</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            🛡️ Vendor Stall Disputes & Defenses
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Review claims from stall owners contending 50m violations, relocation requests, or distance crosschecks.
          </p>
        </div>
        <button
          onClick={fetchDisputes}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all shrink-0"
        >
          🔄 Refresh Disputes
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <div className="animate-spin text-pink-600 text-2xl inline-block mb-2">🌀</div>
          <p className="text-xs text-gray-500 font-bold">Loading vendor defense requests...</p>
        </div>
      ) : disputeReports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <p className="text-sm font-bold text-gray-700">No vendor disputes found.</p>
          <p className="text-xs text-gray-400 mt-1">Stall owners can submit defense claims directly from the interactive map.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputeReports.map((report) => (
            <div
              key={report._id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4"
            >
              {/* Report & Vendor Info Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-rose-50 text-rose-700 font-bold text-[11px] px-2.5 py-0.5 rounded-md border border-rose-200">
                      Reported Stall: {report.shopName}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      School: <strong>{report.schoolId?.name || "School"}</strong> ({report.city})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-semibold">
                    Original Report Status: <strong className="uppercase">{report.status}</strong> | Distance: <strong>{report.distanceFromSchoolMeters}m</strong>
                  </p>
                </div>
              </div>

              {/* Vendor Defenses List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Vendor Defense Submissions ({report.defenses?.length || 0}):
                </h4>
                {report.defenses?.map((def) => (
                  <div
                    key={def._id}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">👤 {def.vendorName}</span>
                        {def.vendorContact && (
                          <span className="text-xs text-gray-500">({def.vendorContact})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getReasonBadge(def.reason)}
                        <span className="text-[10px] font-bold text-gray-400">
                          {new Date(def.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-slate-200 font-medium">
                      &quot;{def.explanation}&quot;
                    </p>

                    {def.newGoogleMapsUrl && (
                      <div className="text-xs">
                        <a
                          href={def.newGoogleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          📍 View Vendor-Provided Location on Google Maps ↗
                        </a>
                      </div>
                    )}

                    {/* Defense Resolution Status or Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                      <div className="text-xs font-bold">
                        Status:{" "}
                        {def.status === "pending" && <span className="text-amber-600 font-black">⏳ Pending Review</span>}
                        {def.status === "approved_resolved" && (
                          <span className="text-emerald-600 font-black">✓ Approved & Report Resolved</span>
                        )}
                        {def.status === "reviewed_dismissed" && (
                          <span className="text-rose-600 font-black">✕ Dispute Dismissed</span>
                        )}
                      </div>

                      {def.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setActiveModal({
                                reportId: report._id,
                                defenseId: def._id,
                                action: "dismiss",
                              })
                            }
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg transition-colors"
                          >
                            ✕ Dismiss Dispute
                          </button>
                          <button
                            onClick={() =>
                              setActiveModal({
                                reportId: report._id,
                                defenseId: def._id,
                                action: "approve_resolve",
                              })
                            }
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg transition-colors shadow-xs"
                          >
                            ✓ Approve Defense & Remove Violation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 text-gray-900">
            <h3 className="font-bold text-base text-gray-900">
              {activeModal.action === "approve_resolve"
                ? "✓ Approve Vendor Defense & Resolve Stall Violation"
                : "✕ Dismiss Vendor Dispute"}
            </h3>
            <p className="text-xs text-gray-600">
              {activeModal.action === "approve_resolve"
                ? "This will mark the original stall report as resolved/rejected so it will no longer be flagged as an active 50m violation on the map."
                : "This will dismiss the vendor dispute claim and keep the original stall report active."}
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Admin Audit Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Crosschecked location on map; stall shifted to >60m distance."
                className="w-full text-xs p-2.5 border border-gray-300 rounded-xl outline-none focus:border-pink-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleResolveDispute}
                className={`px-4 py-2 text-white font-extrabold text-xs rounded-xl shadow-sm ${
                  activeModal.action === "approve_resolve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {actionLoading ? "Processing..." : "Confirm Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
