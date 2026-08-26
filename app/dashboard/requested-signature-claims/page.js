"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import Link from "next/link";

export default function AdminRequestedSignatureClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [approveModalClaim, setApproveModalClaim] = useState(null);
  const [approveNotes, setApproveNotes] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        status: statusFilter,
        search: searchQuery,
      });
      const res = await authFetch(`${apiUrl}/api/admin/requested-signature-claims?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
      }
    } catch (err) {
      console.error("Failed to fetch requested signature claims:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClaims();
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approveModalClaim) return;

    try {
      setActionLoading(approveModalClaim._id);
      const res = await authFetch(`${apiUrl}/api/admin/requested-signature-claims/${approveModalClaim._id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: approveNotes }),
      });

      if (res.ok) {
        alert("Signature claim approved! Requested signer is now officially marked as SIGNED and signature counted.");
        setApproveModalClaim(null);
        setApproveNotes("");
        await fetchClaims();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to approve claim.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (claimId) => {
    const reason = prompt("Enter reason for rejecting this claim:");
    if (reason === null) return;

    try {
      setActionLoading(claimId);
      const res = await authFetch(`${apiUrl}/api/admin/requested-signature-claims/${claimId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: reason }),
      });

      if (res.ok) {
        alert("Claim rejected.");
        await fetchClaims();
      } else {
        alert("Failed to reject claim.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = claims.filter((c) => c.status === "Pending").length;
  const approvedCount = claims.filter((c) => c.status === "Approved").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <i className="fas fa-file-signature text-blue-600"></i>
            Requested Signature Verification Claims
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review identity proof submissions for VIP / Requested Signatures. Approving a claim marks the requested signature as SIGNED.
          </p>
        </div>
        <button
          onClick={fetchClaims}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all self-start sm:self-auto flex items-center gap-2 cursor-pointer"
        >
          <i className="fas fa-sync-alt"></i> Refresh Claims
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Pending Verification</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Approved & Marked Signed</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{approvedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <i className="fas fa-[#0284c7] fa-user-check"></i>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Signature Claims</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{claims.length}</h3>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          {["All", "Pending", "Approved", "Rejected"].map((s) => (
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
            placeholder="Search requested signer or claimant..."
            className="px-3.5 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-blue-500 w-full md:w-64"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
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
            <p className="text-xs">Loading signature claims...</p>
          </div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <i className="fas fa-check-circle text-3xl mb-2 text-emerald-500"></i>
            <p className="text-sm font-bold text-slate-700">No signature claims found</p>
            <p className="text-xs text-gray-400 mt-1">There are no verification claims matching your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Requested Person & Petition</th>
                  <th className="p-4">Claimant & Role</th>
                  <th className="p-4">Proof (Video / Document)</th>
                  <th className="p-4">Status & Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {claims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Requested Person & Petition */}
                    <td className="p-4 max-w-xs">
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <i className="fas fa-star text-amber-500 text-xs"></i>
                          {claim.requestedSignerName}
                        </p>
                        {claim.requestedSignerDesignation && (
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {claim.requestedSignerDesignation}
                          </p>
                        )}
                        {claim.petition && (
                          <Link
                            href={`/dashboard/petitions/${claim.petition._id}`}
                            className="inline-block mt-1 text-[11px] font-bold text-blue-600 hover:underline line-clamp-1"
                          >
                            Petition: {claim.petition.title}
                          </Link>
                        )}
                      </div>
                    </td>

                    {/* Claimant & Role */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{claim.claimantName}</p>
                        <p className="text-[11px] text-gray-500">{claim.claimantEmail}</p>
                        {claim.claimantPhone && (
                          <p className="text-[11px] text-gray-400 font-mono">{claim.claimantPhone}</p>
                        )}
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-1">
                          {claim.claimType === "self" ? "Self (" + claim.requestedSignerName + ")" : "Authorized PR / Representative"}
                        </span>
                      </div>
                    </td>

                    {/* Proof Document / Video */}
                    <td className="p-4 max-w-xs">
                      <div className="space-y-1.5">
                        {claim.videoUrl && (
                          <div>
                            <a
                              href={claim.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all border border-rose-200 truncate max-w-[200px]"
                            >
                              <i className="fas fa-video text-rose-600 text-[11px]"></i>
                              Watch Video Proof
                            </a>
                          </div>
                        )}
                        {claim.proofDocumentUrl && (
                          <div>
                            <a
                              href={claim.proofDocumentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all text-cyan-700 underline truncate max-w-[200px]"
                            >
                              <i className="fas fa-file-alt text-[10px]"></i>
                              View Proof Document
                            </a>
                          </div>
                        )}
                        {claim.message && (
                          <p className="text-gray-600 text-[11px] mt-1 line-clamp-2 italic">
                            &quot;{claim.message}&quot;
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Status & Date */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            claim.status === "Approved"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : claim.status === "Rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {claim.status}
                        </span>
                        <p className="text-[11px] text-gray-400">
                          {new Date(claim.createdAt).toLocaleDateString("en-IN", {
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
                          onClick={() => setSelectedClaim(claim)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <i className="fas fa-eye"></i> Details
                        </button>

                        {claim.status === "Pending" && (
                          <>
                            <button
                              onClick={() => {
                                setApproveModalClaim(claim);
                                setApproveNotes("Approved after verification of official proof link.");
                              }}
                              disabled={actionLoading === claim._id}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <i className="fas fa-check-circle"></i> Approve
                            </button>

                            <button
                              onClick={() => handleReject(claim._id)}
                              disabled={actionLoading === claim._id}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
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
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-file-signature text-blue-600"></i> Signature Claim Proof Details
              </h3>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                <span className="font-bold text-blue-900">Requested Person: </span>
                <span className="font-bold text-slate-900">{selectedClaim.requestedSignerName}</span>
                {selectedClaim.requestedSignerDesignation && (
                  <span className="text-slate-600"> ({selectedClaim.requestedSignerDesignation})</span>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200 space-y-1">
                <p className="font-bold text-slate-800">Claimant Info:</p>
                <p>Name: {selectedClaim.claimantName}</p>
                <p>Email: {selectedClaim.claimantEmail}</p>
                <p>Phone: {selectedClaim.claimantPhone || "N/A"}</p>
                <p>
                  Claim Type:{" "}
                  <strong>
                    {selectedClaim.claimType === "self" ? "Self (" + selectedClaim.requestedSignerName + ")" : "Authorized PR / Representative"}
                  </strong>
                </p>
              </div>

              {/* Video Proof Section */}
              {selectedClaim.videoUrl && (
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-rose-900 flex items-center gap-1.5">
                      <i className="fas fa-video text-rose-600"></i> Verification Video Proof
                    </label>
                    <a
                      href={selectedClaim.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-700 hover:underline font-bold text-[11px] flex items-center gap-1"
                    >
                      Open Video <i className="fas fa-external-link-alt text-[10px]"></i>
                    </a>
                  </div>

                  {(() => {
                    const match = selectedClaim.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
                    const yId = match && match[1]?.length === 11 ? match[1] : null;

                    if (yId) {
                      return (
                        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${yId}`}
                            title="Verification Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      );
                    }

                    return (
                      <div className="w-full rounded-xl overflow-hidden bg-black max-h-64 flex items-center justify-center">
                        <video
                          src={selectedClaim.videoUrl}
                          controls
                          className="w-full max-h-64 object-contain"
                        />
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Document Proof Section */}
              {selectedClaim.proofDocumentUrl && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proof Document / Link</label>
                  <a
                    href={selectedClaim.proofDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-xl block font-mono break-all hover:underline"
                  >
                    {selectedClaim.proofDocumentUrl} <i className="fas fa-external-link-alt text-[10px] ml-1"></i>
                  </a>
                </div>
              )}

              {selectedClaim.message && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Claimant Notes / Message</label>
                  <p className="p-3 bg-slate-50 border border-gray-200 rounded-xl leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {selectedClaim.message}
                  </p>
                </div>
              )}

              {selectedClaim.adminNotes && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Resolution Notes</label>
                  <p className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-medium">
                    {selectedClaim.adminNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedClaim(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveModalClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
                <i className="fas fa-check-circle"></i> Confirm Signature Approval
              </h3>
              <button
                onClick={() => setApproveModalClaim(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to approve signature for <strong>&quot;{approveModalClaim.requestedSignerName}&quot;</strong>?
              This will officially mark the requested signature card as <strong className="text-emerald-700">SIGNED</strong> on the petition details page and increment the signature count!
            </p>

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Approval Notes
                </label>
                <textarea
                  rows={3}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Verification notes..."
                  className="w-full p-3 text-xs border border-gray-200 rounded-xl outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setApproveModalClaim(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === approveModalClaim._id}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading === approveModalClaim._id ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-check"></i>
                  )}
                  Approve & Mark Signed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
