"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";

export default function DeletionRequestsPage() {
  // Navigation between Active Requests and the Deleted Users Vault
  const [activeSection, setActiveSection] = useState("requests"); // 'requests' | 'vault'

  // --- Requests States ---
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Request Confirmation Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalAction, setModalAction] = useState(null); // 'approve' | 'reject'
  const [adminNote, setAdminNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Deleted Users Vault States ---
  const [archives, setArchives] = useState([]);
  const [archiveCounts, setArchiveCounts] = useState({ totalArchives: 0, totalPetitionsArchived: 0 });
  const [loadingArchives, setLoadingArchives] = useState(false);
  const [errorArchives, setErrorArchives] = useState("");
  const [searchArchives, setSearchArchives] = useState("");
  const [currentArchivePage, setCurrentArchivePage] = useState(1);
  const [totalArchivePages, setTotalArchivePages] = useState(1);

  // Archive Dossier Inspection Modal
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archiveModalTab, setArchiveModalTab] = useState("identity"); // 'identity' | 'petitions' | 'financial' | 'audit'

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // --- Fetch Requests ---
  const fetchRequests = async (page = 1, status = statusFilter, searchQuery = search) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        ...(status && status !== "all" && { status }),
        ...(searchQuery && { search: searchQuery.trim() }),
      });

      const res = await authFetch(`${apiUrl}/api/deletion-requests?${params.toString()}`);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to fetch deletion requests");
      }

      const data = await res.json();
      setRequests(data.requests || []);
      setCounts(data.counts || { total: 0, pending: 0, approved: 0, rejected: 0 });
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error("Error fetching deletion requests:", err);
      setError(err.message || "Failed to load deletion requests");
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch Deleted Users Archives ---
  const fetchArchives = async (page = 1, searchQuery = searchArchives) => {
    try {
      setLoadingArchives(true);
      setErrorArchives("");

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        ...(searchQuery && { search: searchQuery.trim() }),
      });

      const res = await authFetch(`${apiUrl}/api/deletion-requests/archives?${params.toString()}`);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to fetch archived user records");
      }

      const data = await res.json();
      setArchives(data.archives || []);
      setArchiveCounts(data.counts || { totalArchives: 0, totalPetitionsArchived: 0 });
      setCurrentArchivePage(data.pagination?.page || 1);
      setTotalArchivePages(data.pagination?.pages || 1);
    } catch (err) {
      console.error("Error fetching archives:", err);
      setErrorArchives(err.message || "Failed to load archived records");
    } finally {
      setLoadingArchives(false);
    }
  };

  useEffect(() => {
    fetchRequests(1, statusFilter, search);
    fetchArchives(1, "");
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRequests(1, statusFilter, search);
  };

  const handleArchiveSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentArchivePage(1);
    fetchArchives(1, searchArchives);
  };

  // Open approve/reject confirmation modal
  const openConfirmModal = (req, action) => {
    setSelectedRequest(req);
    setModalAction(action);
    setAdminNote(
      action === "approve"
        ? "Account, petitions, and personal data permanently purged in compliance with DPDP Act 2023."
        : "Request could not be processed at this time."
    );
  };

  const closeConfirmModal = () => {
    setSelectedRequest(null);
    setModalAction(null);
    setAdminNote("");
  };

  // Approve & execute purge
  const handleExecuteAction = async () => {
    if (!selectedRequest || !modalAction) return;

    try {
      setIsProcessing(true);
      const res = await authFetch(`${apiUrl}/api/deletion-requests/${selectedRequest._id}/${modalAction}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${modalAction} deletion request`);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("refresh-admin-notifications"));
      }

      alert(data.message || `Request ${modalAction}d successfully!`);
      closeConfirmModal();
      fetchRequests(currentPage, statusFilter, search);
      fetchArchives(1, ""); // Refresh vault
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download legal audit JSON dossier
  const handleExportDossier = (archive) => {
    try {
      const exportData = {
        exportMetadata: {
          system: "SoSign DPDP Compliance Vault",
          exportDate: new Date().toISOString(),
          purpose: "Statutory Defense & Legal Audit Archive (DPDP Act 2023 Sec 8(7)/8(8))",
        },
        archiveRecord: archive,
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeEmail = (archive.userEmail || "user").replace(/[^a-zA-Z0-9]/g, "_");
      link.href = url;
      link.download = `SoSign_LegalDossier_${safeEmail}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export dossier: " + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-rose-100 text-rose-600 rounded-2xl text-xl">
              <i className="fas fa-user-times"></i>
            </span>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Account & Data Deletion Management
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Statutory Citizen Right to Erasure (DPDP Act 2023, Section 12) & Legal Safety Vault Archive (Sec 8(7)/8(8)).
              </p>
            </div>
          </div>
        </div>

        {/* Top Section Nav Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveSection("requests")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSection === "requests"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="fas fa-inbox text-rose-600"></i>
            <span>Citizen Requests</span>
            {counts.pending > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                {counts.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection("vault")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSection === "vault"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="fas fa-vault text-blue-600"></i>
            <span>Deleted Users Vault</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
              {archiveCounts.totalArchives || archives.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: CITIZEN DELETION REQUESTS                      */}
      {/* ========================================================= */}
      {activeSection === "requests" && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              onClick={() => setStatusFilter("all")}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-blue-50 border-blue-300 shadow-sm"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Requests</span>
              <span className="text-2xl font-black text-gray-900 mt-1 block">{counts.total}</span>
            </div>

            <div
              onClick={() => setStatusFilter("pending")}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                statusFilter === "pending"
                  ? "bg-amber-50 border-amber-300 shadow-sm"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Pending Review</span>
                {counts.pending > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </div>
              <span className="text-2xl font-black text-amber-700 mt-1 block">{counts.pending}</span>
            </div>

            <div
              onClick={() => setStatusFilter("approved")}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                statusFilter === "approved"
                  ? "bg-emerald-50 border-emerald-300 shadow-sm"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Approved & Purged</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{counts.approved}</span>
            </div>

            <div
              onClick={() => setStatusFilter("rejected")}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                statusFilter === "rejected"
                  ? "bg-rose-50 border-rose-300 shadow-sm"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">Rejected</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">{counts.rejected}</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {[
                { key: "pending", label: "Pending Review", icon: "fa-clock" },
                { key: "approved", label: "Approved / Deleted", icon: "fa-check-circle" },
                { key: "rejected", label: "Rejected", icon: "fa-times-circle" },
                { key: "all", label: "All Requests", icon: "fa-list" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.key
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <i className={`fas ${tab.icon} text-xs`}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input
                type="text"
                placeholder="Search by name, email, or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-rose-500 focus:bg-white transition"
              />
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Requests Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <i className="fas fa-spinner fa-spin text-3xl text-rose-600"></i>
                <p className="text-xs text-gray-500 font-medium">Loading deletion requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto text-xl">
                  <i className="fas fa-inbox"></i>
                </div>
                <p className="text-sm font-bold text-gray-700">No Deletion Requests Found</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  There are no {statusFilter !== "all" ? statusFilter : ""} account deletion requests matching your filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="p-4">Citizen / User</th>
                      <th className="p-4">Data Impact</th>
                      <th className="p-4">Reason & Feedback</th>
                      <th className="p-4">Requested On</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {requests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50/80 transition-colors">
                        {/* User Profile Info */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                              {req.userName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">{req.userName}</p>
                              <p className="text-gray-500 text-[11px] font-mono truncate">{req.userEmail}</p>
                              {req.userMobile && (
                                <p className="text-gray-400 text-[10px]">{req.userMobile}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Impact / Petitions to be Deleted */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              <i className="fas fa-file-alt text-[10px]"></i>
                              {req.petitionsCount || 0} Petitions
                            </span>
                            <p className="text-[10px] text-gray-500">
                              {req.signaturesCount || 0} signatures recorded
                            </p>
                          </div>
                        </td>

                        {/* Reason & Feedback */}
                        <td className="p-4 max-w-xs">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-semibold">
                              {req.reason}
                            </span>
                            {req.customReason && (
                              <p className="text-gray-600 italic text-[11px] line-clamp-2">
                                &ldquo;{req.customReason}&rdquo;
                              </p>
                            )}
                            {req.feedback && (
                              <p className="text-gray-500 text-[10px] line-clamp-2">
                                Feedback: {req.feedback}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Request Date */}
                        <td className="p-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                          {formatDate(req.createdAt)}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 whitespace-nowrap">
                          {req.status === "pending" && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending Review
                            </span>
                          )}
                          {req.status === "approved" && (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                                <i className="fas fa-check"></i> Purged & Archived
                              </span>
                              <p className="text-[9px] text-gray-400">{formatDate(req.deletedAt)}</p>
                            </div>
                          )}
                          {req.status === "rejected" && (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] inline-flex items-center gap-1">
                                <i className="fas fa-times"></i> Rejected
                              </span>
                              {req.adminNote && (
                                <p className="text-[9px] text-gray-500 italic max-w-[150px] truncate" title={req.adminNote}>
                                  {req.adminNote}
                                </p>
                              )}
                            </div>
                          )}
                          {req.status === "cancelled" && (
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-bold text-[10px] inline-flex items-center gap-1">
                              Cancelled by User
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-right whitespace-nowrap">
                          {req.status === "pending" ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => openConfirmModal(req, "approve")}
                                className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-lg font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <i className="fas fa-trash-alt"></i> Approve & Purge
                              </button>
                              <button
                                onClick={() => openConfirmModal(req, "reject")}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : req.status === "approved" ? (
                            <button
                              onClick={() => {
                                setActiveSection("vault");
                                setSearchArchives(req.userEmail);
                                fetchArchives(1, req.userEmail);
                              }}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <i className="fas fa-vault"></i> View in Vault
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: DELETED USERS VAULT (SAFETY & COMPLIANCE ARCHIVE) */}
      {/* ========================================================= */}
      {activeSection === "vault" && (
        <div className="space-y-6">
          {/* Statutory Safety Notice Banner */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl shadow-md border border-slate-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 text-xl shrink-0 mt-0.5">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">
                      Deleted Users Legal & Compliance Vault
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                      Immutable Safety Archive
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Under <strong>Section 8(7) & 8(8) of the DPDP Act 2023</strong> and statutory audit regulations, platforms maintain an isolated administrative copy of deleted citizen profiles, petitions, KYC validations, and wallet histories to defend against legal disputes, law enforcement inquiries, and financial audits.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => fetchArchives(currentArchivePage, searchArchives)}
                  className="px-4 py-2 bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/30 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <i className={`fas fa-sync-alt ${loadingArchives ? "fa-spin" : ""}`}></i>
                  <span>Refresh Vault</span>
                </button>
              </div>
            </div>
          </div>

          {/* Vault Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
                <i className="fas fa-users-slash"></i>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Archived Deleted Users
                </span>
                <span className="text-2xl font-black text-gray-900 block">
                  {archiveCounts.totalArchives}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0">
                <i className="fas fa-file-invoice"></i>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Preserved Petitions in Archive
                </span>
                <span className="text-2xl font-black text-gray-900 block">
                  {archiveCounts.totalPetitionsArchived}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                <i className="fas fa-lock"></i>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Vault Security
                </span>
                <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                  <i className="fas fa-check-circle text-xs"></i> Admin Access Restricted
                </span>
              </div>
            </div>
          </div>

          {/* Vault Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                <i className="fas fa-database text-blue-600 mr-1.5"></i> Vault Records Explorer
              </span>
              <span className="text-xs text-gray-400">
                ({archives.length} records shown)
              </span>
            </div>

            <form onSubmit={handleArchiveSearchSubmit} className="relative w-full md:w-96">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input
                type="text"
                placeholder="Search by name, email, phone, code or petition title..."
                value={searchArchives}
                onChange={(e) => setSearchArchives(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </form>
          </div>

          {/* Error Message */}
          {errorArchives && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{errorArchives}</span>
            </div>
          )}

          {/* Archives Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            {loadingArchives ? (
              <div className="py-20 text-center space-y-3">
                <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
                <p className="text-xs text-gray-500 font-medium">Accessing Vault archives...</p>
              </div>
            ) : archives.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto text-xl">
                  <i className="fas fa-archive"></i>
                </div>
                <p className="text-sm font-bold text-gray-700">No Archived Deleted Users Found</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  When a user account deletion is approved, their entire snapshot will be safely preserved here for statutory defense.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="p-4">Archived Citizen</th>
                      <th className="p-4">Preserved Petitions</th>
                      <th className="p-4">Deletion Stated Reason</th>
                      <th className="p-4">Purged & Archived At</th>
                      <th className="p-4">Admin Audit Note</th>
                      <th className="p-4 text-right">Vault Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {archives.map((arc) => (
                      <tr key={arc._id} className="hover:bg-blue-50/40 transition-colors">
                        {/* Archived Identity */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                              {arc.userName?.charAt(0)?.toUpperCase() || "A"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">{arc.userName}</p>
                              <p className="text-gray-500 text-[11px] font-mono truncate">{arc.userEmail}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {arc.userMobile && (
                                  <span className="text-gray-400 text-[10px]">{arc.userMobile}</span>
                                )}
                                {arc.uniqueCode && (
                                  <span className="font-mono text-[9px] bg-gray-100 px-1.5 py-0.2 rounded text-gray-600">
                                    {arc.uniqueCode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Preserved Petitions count */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                              <i className="fas fa-file-contract text-[10px]"></i>
                              {arc.petitionsCount || 0} Petitions Preserved
                            </span>
                            {arc.userSnapshot?.aadhaarKyc?.status === "verified" && (
                              <span className="inline-block ml-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold border border-emerald-200">
                                Aadhaar KYC Verified
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="p-4 max-w-xs">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-semibold">
                              {arc.reason}
                            </span>
                            {arc.customReason && (
                              <p className="text-gray-600 italic text-[11px] line-clamp-1">
                                &ldquo;{arc.customReason}&rdquo;
                              </p>
                            )}
                            {arc.feedback && (
                              <p className="text-gray-400 text-[10px] line-clamp-1">
                                Feedback: {arc.feedback}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Dates & Admin */}
                        <td className="p-4 text-gray-500 text-[11px] whitespace-nowrap">
                          <p className="font-mono font-medium text-gray-800">{formatDate(arc.deletedAt)}</p>
                          <p className="text-[10px] text-gray-400">By: {arc.reviewedBy || "Administrator"}</p>
                        </td>

                        {/* Admin note */}
                        <td className="p-4 max-w-xs">
                          <p className="text-gray-600 text-[11px] italic line-clamp-2" title={arc.adminNote}>
                            {arc.adminNote || "Purged per DPDP Act compliance."}
                          </p>
                        </td>

                        {/* Action buttons */}
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedArchive(arc);
                                setArchiveModalTab("identity");
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                              title="View full archived citizen dossier"
                            >
                              <i className="fas fa-folder-open"></i> View Dossier
                            </button>

                            <button
                              onClick={() => handleExportDossier(arc)}
                              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs transition inline-flex items-center gap-1 cursor-pointer"
                              title="Download JSON legal audit file"
                            >
                              <i className="fas fa-download"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: REQUEST ACTION CONFIRMATION MODAL                 */}
      {/* ========================================================= */}
      {selectedRequest && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                    modalAction === "approve"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <i className={`fas ${modalAction === "approve" ? "fa-exclamation-triangle" : "fa-ban"}`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {modalAction === "approve"
                      ? "Confirm Account & Data Erasure"
                      : "Reject Deletion Request"}
                  </h3>
                  <p className="text-xs text-gray-500">Citizen: {selectedRequest.userName} ({selectedRequest.userEmail})</p>
                </div>
              </div>
              <button
                onClick={closeConfirmModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>

            {/* Warning & Vault Guarantee */}
            {modalAction === "approve" ? (
              <div className="space-y-3">
                <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl space-y-2 text-xs text-rose-950">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <i className="fas fa-radiation-alt text-rose-600"></i>
                    PUBLIC PLATFORM PURGE NOTICE
                  </div>
                  <p className="leading-relaxed">
                    Approving this request will immediately purge the user from all public views:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 font-semibold text-rose-900">
                    <li>Permanently delete <strong>all {selectedRequest.petitionsCount || 0} petitions</strong> created by this user.</li>
                    <li>Permanently delete user profile, login credentials, and public records.</li>
                    <li>Wipe comments, signatures, and crowdfunding campaigns from the active database.</li>
                  </ul>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
                  <i className="fas fa-shield-alt text-indigo-600 text-sm shrink-0 mt-0.5"></i>
                  <p className="leading-relaxed">
                    <strong>Legal Safety Guarantee:</strong> Before public deletion, a frozen snapshot of the citizen profile, petitions, and wallet summary will be automatically archived into the <strong>Deleted Users Vault</strong> under DPDP Act Sec 8(7)/8(8) for future safety and defense.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-600 leading-relaxed">
                Rejecting this request will keep the user&apos;s account and petitions active. Please provide a reason below for compliance records.
              </p>
            )}

            {/* Admin Note Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Admin Note / Audit Justification
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Enter audit note for this action..."
                className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-rose-500 focus:bg-white transition resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={isProcessing}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isProcessing}
                className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer ${
                  modalAction === "approve"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-gray-800 hover:bg-gray-900"
                }`}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Processing & Archiving...
                  </>
                ) : (
                  <>
                    <i className={`fas ${modalAction === "approve" ? "fa-trash" : "fa-ban"}`}></i>
                    {modalAction === "approve" ? "Purge & Archive Snapshot" : "Confirm Rejection"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ARCHIVED USER LEGAL DOSSIER MODAL                */}
      {/* ========================================================= */}
      {selectedArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl space-y-6 border border-gray-100 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-md">
                  <i className="fas fa-vault"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-gray-900">
                      Archived Citizen Dossier
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                      ID: {selectedArchive.originalUserId || selectedArchive._id}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Purged on {formatDate(selectedArchive.deletedAt)} by {selectedArchive.reviewedBy}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportDossier(selectedArchive)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Export offline JSON file"
                >
                  <i className="fas fa-download"></i>
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={() => setSelectedArchive(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            </div>

            {/* Dossier Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              {[
                { key: "identity", label: "Profile & Identity", icon: "fa-id-card" },
                {
                  key: "petitions",
                  label: `Petitions (${selectedArchive.petitionsCount || selectedArchive.petitionsSnapshot?.length || 0})`,
                  icon: "fa-file-alt",
                },
                { key: "financial", label: "Wallet & Funds", icon: "fa-wallet" },
                { key: "audit", label: "Compliance & Audit Trail", icon: "fa-history" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setArchiveModalTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    archiveModalTab === tab.key
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <i className={`fas ${tab.icon} text-xs`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab 1: Profile & Identity Snapshot */}
            {archiveModalTab === "identity" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">Full Name</span>
                    <span className="font-bold text-gray-900 text-sm">{selectedArchive.userName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">Email Address</span>
                    <span className="font-bold text-gray-900 font-mono">{selectedArchive.userEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">Mobile Number</span>
                    <span className="font-bold text-gray-800">
                      {selectedArchive.userMobile || selectedArchive.userSnapshot?.mobileNumber || "Not recorded"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">Referral Unique Code</span>
                    <span className="font-mono font-bold text-rose-600">
                      {selectedArchive.uniqueCode || selectedArchive.userSnapshot?.uniqueCode || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">Role / Designation</span>
                    <span className="font-medium text-gray-800">
                      {selectedArchive.userSnapshot?.designation || "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">Account Created Date</span>
                    <span className="font-medium text-gray-800">
                      {formatDate(selectedArchive.userSnapshot?.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {selectedArchive.userSnapshot?.bio && (
                  <div className="p-3 bg-white rounded-xl border border-gray-200">
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block mb-1">User Bio</span>
                    <p className="text-gray-700 italic">{selectedArchive.userSnapshot.bio}</p>
                  </div>
                )}

                {/* Aadhaar KYC Snapshot */}
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <i className="fas fa-id-badge text-emerald-600"></i> Aadhaar KYC Identity Status
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900">
                      {selectedArchive.userSnapshot?.aadhaarKyc?.status || "Not Verified"}
                    </span>
                  </div>
                  {selectedArchive.userSnapshot?.aadhaarKyc?.status === "verified" && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800 pt-1">
                      <div>
                        <span className="text-emerald-600">Client Reference:</span>{" "}
                        <span className="font-mono font-bold">
                          {selectedArchive.userSnapshot.aadhaarKyc.clientId || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-600">Verified Timestamp:</span>{" "}
                        <span className="font-medium">
                          {formatDate(selectedArchive.userSnapshot.aadhaarKyc.verifiedAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Preserved Petitions */}
            {archiveModalTab === "petitions" && (
              <div className="space-y-3 text-xs">
                {(!selectedArchive.petitionsSnapshot || selectedArchive.petitionsSnapshot.length === 0) ? (
                  <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl">
                    <i className="fas fa-file-excel text-2xl mb-2 text-gray-300"></i>
                    <p className="font-medium">This citizen had created 0 petitions before deletion.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {selectedArchive.petitionsSnapshot.map((pet, idx) => (
                      <div
                        key={pet.id || idx}
                        className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-gray-900 text-sm">
                            {idx + 1}. {pet.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[9px] shrink-0 uppercase">
                            {pet.category || "General"}
                          </span>
                        </div>

                        {pet.description && (
                          <p className="text-gray-600 line-clamp-2 italic text-[11px]">
                            {pet.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-[10px] text-gray-500 pt-1 border-t border-gray-200">
                          <span>
                            <strong>Target:</strong> {pet.targetSignatures || 0} signatures
                          </span>
                          <span>
                            <strong>Signatures Recorded:</strong> {pet.signaturesCount || 0}
                          </span>
                          <span>
                            <strong>Created:</strong> {formatDate(pet.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Financial & Wallet Snapshot */}
            {archiveModalTab === "financial" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase block">
                      Wallet Balance at Deletion
                    </span>
                    <span className="text-xl font-black text-emerald-900 mt-1 block">
                      ₹{selectedArchive.walletSummary?.balance || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-[10px] font-semibold text-blue-700 uppercase block">
                      Lifetime Earnings
                    </span>
                    <span className="text-xl font-black text-blue-900 mt-1 block">
                      ₹{selectedArchive.walletSummary?.totalEarnings || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                    <span className="text-[10px] font-semibold text-purple-700 uppercase block">
                      Withdrawal Inquiries
                    </span>
                    <span className="text-xl font-black text-purple-900 mt-1 block">
                      {selectedArchive.walletSummary?.withdrawalsCount || 0} Requests
                    </span>
                  </div>
                </div>

                {/* Crowdfunding campaigns snapshot if any */}
                {selectedArchive.crowdfundingSnapshot && selectedArchive.crowdfundingSnapshot.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <span className="font-bold text-gray-800 block text-xs">
                      Associated Crowdfunding Campaigns
                    </span>
                    <div className="space-y-1">
                      {selectedArchive.crowdfundingSnapshot.map((c, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px] p-2 bg-white rounded border">
                          <span className="font-medium text-gray-900">{c.title}</span>
                          <span className="font-bold text-emerald-600">Raised: ₹{c.raisedAmount || 0} / ₹{c.targetAmount || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Compliance & Audit Trail */}
            {archiveModalTab === "audit" && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <div>
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">
                      Statutory Legal Basis for Retention
                    </span>
                    <p className="font-medium text-gray-900 mt-0.5">
                      {selectedArchive.retentionLegalBasis ||
                        "Retained in Legal Vault under DPDP Act 2023 Sec 8(7)/8(8) for platform defense & compliance."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                    <div>
                      <span className="text-gray-400 font-semibold uppercase text-[10px] block">Requested At</span>
                      <span className="font-mono text-gray-800">{formatDate(selectedArchive.requestedAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold uppercase text-[10px] block">Approved & Purged At</span>
                      <span className="font-mono text-gray-800">{formatDate(selectedArchive.deletedAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold uppercase text-[10px] block">Admin Reviewer</span>
                      <span className="font-bold text-gray-800">{selectedArchive.reviewedBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold uppercase text-[10px] block">Deletion Request ID</span>
                      <span className="font-mono text-gray-600 text-[10px]">{selectedArchive.deletionRequestId || "N/A"}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-400 font-semibold uppercase text-[10px] block">Admin Audit Note</span>
                    <p className="text-gray-800 italic mt-0.5 bg-white p-2.5 rounded-xl border border-gray-200">
                      &ldquo;{selectedArchive.adminNote || "Account, petitions, and personal data permanently purged in compliance with DPDP Act 2023."}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-[11px] text-gray-400 italic">
                <i className="fas fa-lock mr-1"></i> Legal Vault Record • Confidential & Encrypted
              </span>
              <button
                type="button"
                onClick={() => setSelectedArchive(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
