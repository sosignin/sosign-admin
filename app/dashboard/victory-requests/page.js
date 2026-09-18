"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/utils/api";

export default function VictoryRequestsPage() {
    const router = useRouter();
    const [victoryRequests, setVictoryRequests] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [actionLoading, setActionLoading] = useState(null);
    const [adminNote, setAdminNote] = useState("");
    const [outcomeText, setOutcomeText] = useState("");
    const [showModal, setShowModal] = useState(null); // requestId
    const [pendingAction, setPendingAction] = useState(null); // 'approve' | 'reject'
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Fetch victory requests from backend
    const fetchVictoryRequests = async (page = 1, status = "") => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                ...(status && { status }),
            });

            const response = await authFetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/victory-requests?${queryParams}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch victory requests");
            }

            const data = await response.json();
            setVictoryRequests(data.victoryRequests || []);
            setCurrentPage(data.pagination?.currentPage || 1);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalResults(data.pagination?.totalResults || 0);
        } catch (err) {
            setError("Failed to load victory requests: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch statistics
    const fetchStats = async () => {
        try {
            const response = await authFetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/victory-requests/stats`
            );
            if (response.ok) {
                const data = await response.json();
                if (data.stats) setStats(data.stats);
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    useEffect(() => {
        fetchVictoryRequests(1, statusFilter);
        fetchStats();
    }, []);

    // Handle approve/reject action
    const handleAction = async () => {
        if (!showModal || !pendingAction) return;

        try {
            setActionLoading(showModal);
            const response = await authFetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/victory-requests/${showModal}/${pendingAction}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        adminNote,
                        ...(pendingAction === "approve" && outcomeText && { outcome: outcomeText }),
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${pendingAction} request`);
            }

            // Refresh the list and stats
            await fetchVictoryRequests(currentPage, statusFilter);
            await fetchStats();
            setShowModal(null);
            setAdminNote("");
            setOutcomeText("");
            setPendingAction(null);
            setSelectedRequest(null);
            alert(`Victory request ${pendingAction}d successfully!`);
        } catch (err) {
            alert(`Failed to ${pendingAction} request: ` + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Open modal for action confirmation
    const openActionModal = (request, action) => {
        setSelectedRequest(request);
        setShowModal(request._id);
        setPendingAction(action);
        setAdminNote("");
        setOutcomeText(request.outcome || "Goal achieved through community support");
    };

    // Handle status filter change
    const handleStatusChange = (e) => {
        const status = e.target.value;
        setStatusFilter(status);
        setCurrentPage(1);
        fetchVictoryRequests(1, status);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Status badge styling
    const getStatusBadge = (status) => {
        switch (status) {
            case "approved":
                return "bg-green-100 text-green-800 border-green-200";
            case "rejected":
                return "bg-red-100 text-red-800 border-red-200";
            case "pending":
            default:
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                        <i className="fas fa-trophy text-amber-500"></i> Victory Requests
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Review and approve petitions declared successful by petitioners
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 text-xl font-bold">
                        <i className="fas fa-award"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Requests</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 text-xl font-bold">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending Review</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 text-xl font-bold">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Approved Victories</p>
                        <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 text-xl font-bold">
                        <i className="fas fa-times-circle"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Rejected Requests</p>
                        <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <div className="text-sm text-gray-500">
                    Showing <span className="font-semibold">{victoryRequests.length}</span> of{" "}
                    <span className="font-semibold">{totalResults}</span> results
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                ) : victoryRequests.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <i className="fas fa-trophy text-4xl text-gray-300 mb-3 block"></i>
                        <p className="text-lg font-semibold text-gray-700">No victory requests found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {statusFilter ? `No requests matching "${statusFilter}" status.` : "No petitioners have submitted victory requests yet."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Petition
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Petitioner
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Outcome & Story
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Submitted
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {victoryRequests.map((request) => (
                                    <tr
                                        key={request._id}
                                        className="hover:bg-amber-50/40 transition-colors duration-150"
                                    >
                                        {/* Petition Title & Signatures */}
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs">
                                                <p className="text-sm font-bold text-gray-900 line-clamp-2">
                                                    {request.petitionTitle || request.petition?.title || "Untitled Petition"}
                                                </p>
                                                <p className="text-xs text-amber-700 font-semibold mt-1 flex items-center gap-1">
                                                    <i className="fas fa-signature text-xs"></i>
                                                    {(request.totalSignatures || request.petition?.numberOfSignatures || 0).toLocaleString()} Signatures
                                                </p>
                                            </div>
                                        </td>

                                        {/* Petitioner */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {request.user?.name || "Unknown"}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {request.user?.email || "No email"}
                                            </div>
                                            {request.user?.mobile && (
                                                <div className="text-xs text-gray-400">
                                                    {request.user.mobile}
                                                </div>
                                            )}
                                        </td>

                                        {/* Outcome & Story */}
                                        <td className="px-6 py-4">
                                            <div className="max-w-sm">
                                                <p className="text-sm font-medium text-gray-800 line-clamp-2">
                                                    {request.outcome}
                                                </p>
                                                {request.story && (
                                                    <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">
                                                        &ldquo;{request.story}&rdquo;
                                                    </p>
                                                )}
                                                {request.adminNote && (
                                                    <p className="text-xs text-purple-700 bg-purple-50 p-1.5 rounded-md mt-1.5">
                                                        <strong>Note:</strong> {request.adminNote}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(request.status)}`}>
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                            {formatDate(request.createdAt)}
                                        </td>

                                        {/* Action buttons */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {request.status === "pending" ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openActionModal(request, "approve")}
                                                        disabled={actionLoading === request._id}
                                                        className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 text-xs font-semibold shadow-sm flex items-center gap-1 transition-all"
                                                    >
                                                        <i className="fas fa-check"></i> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => openActionModal(request, "reject")}
                                                        disabled={actionLoading === request._id}
                                                        className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 text-xs font-semibold shadow-sm flex items-center gap-1 transition-all"
                                                    >
                                                        <i className="fas fa-times"></i> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-500">
                                                    Reviewed by <span className="font-semibold text-gray-700">{request.reviewedBy || "Admin"}</span>
                                                    <div className="text-[11px] text-gray-400">{formatDate(request.reviewedAt)}</div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <button
                            onClick={() => {
                                const p = Math.max(currentPage - 1, 1);
                                setCurrentPage(p);
                                fetchVictoryRequests(p, statusFilter);
                            }}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-700">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => {
                                const p = Math.min(currentPage + 1, totalPages);
                                setCurrentPage(p);
                                fetchVictoryRequests(p, statusFilter);
                            }}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Action Modal (Approve / Reject) */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${pendingAction === "approve" ? "text-green-600" : "text-red-600"}`}>
                                <i className={`fas ${pendingAction === "approve" ? "fa-trophy" : "fa-times-circle"}`}></i>
                                {pendingAction === "approve" ? "Approve Petition Victory" : "Reject Victory Request"}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(null);
                                    setSelectedRequest(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Petition</p>
                                <p className="text-sm font-bold text-gray-800 line-clamp-1">{selectedRequest.petitionTitle}</p>
                                <p className="text-xs text-gray-500 mt-1">Petitioner: {selectedRequest.user?.name || "Unknown"}</p>
                            </div>

                            {pendingAction === "approve" ? (
                                <>
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                                        <i className="fas fa-info-circle mr-1"></i>
                                        Approving will mark this petition as a victory and create an official record in the <strong>Successful Petitions</strong> showcase.
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                            Outcome Summary (Shown on Victory Story) *
                                        </label>
                                        <input
                                            type="text"
                                            value={outcomeText}
                                            onChange={(e) => setOutcomeText(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="e.g. Goal achieved through community support"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                            Admin Note (Optional)
                                        </label>
                                        <textarea
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            rows={2}
                                            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            placeholder="Internal note or congratulatory message..."
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Reason for Rejection *
                                    </label>
                                    <textarea
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Explain why the victory request cannot be approved at this time..."
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(null);
                                    setSelectedRequest(null);
                                }}
                                disabled={actionLoading !== null}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAction}
                                disabled={actionLoading !== null || (pendingAction === "reject" && !adminNote.trim()) || (pendingAction === "approve" && !outcomeText.trim())}
                                className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md flex items-center gap-2 disabled:opacity-50 ${
                                    pendingAction === "approve"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                }`}
                            >
                                {actionLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className={`fas ${pendingAction === "approve" ? "fa-check" : "fa-times"}`}></i>
                                        {pendingAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
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
