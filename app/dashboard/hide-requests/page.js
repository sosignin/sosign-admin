"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "../../../utils/api";

export default function HideRequestsPage() {
    const router = useRouter();
    const [hideRequests, setHideRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [actionLoading, setActionLoading] = useState(null);
    const [adminNote, setAdminNote] = useState("");
    const [showNoteModal, setShowNoteModal] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);

    // Fetch hide requests from backend
    const fetchHideRequests = async (page = 1, status = "") => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                ...(status && { status }),
            });

            const response = await authFetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/hide-requests?${queryParams}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch hide requests");
            }

            const data = await response.json();
            setHideRequests(data.hideRequests);
            setCurrentPage(data.pagination.currentPage);
            setTotalPages(data.pagination.totalPages);
            setTotalResults(data.pagination.totalResults);
        } catch (err) {
            setError("Failed to load hide requests: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle approve/reject action
    const handleAction = async (requestId, action) => {
        try {
            setActionLoading(requestId);
            const response = await authFetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/hide-requests/${requestId}/${action}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ adminNote }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${action} request`);
            }

            // Refresh the list
            await fetchHideRequests(currentPage, statusFilter);
            setShowNoteModal(null);
            setAdminNote("");
            setPendingAction(null);
            alert(`Request ${action}d successfully!`);
        } catch (err) {
            alert(`Failed to ${action} request: ` + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    // Open modal for action confirmation
    const openActionModal = (requestId, action) => {
        setShowNoteModal(requestId);
        setPendingAction(action);
    };

    // Handle status filter change
    const handleStatusChange = (e) => {
        const status = e.target.value;
        setStatusFilter(status);
        setCurrentPage(1);
        fetchHideRequests(1, status);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "approved":
                return "bg-green-100 text-green-700 border-green-200";
            case "rejected":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    useEffect(() => {
        fetchHideRequests();
    }, []);

    if (loading && hideRequests.length === 0) {
        return (
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                        Hide Requests Management
                    </h1>
                    <p className="text-gray-600 font-medium">Manage petition hide requests from users</p>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <i className="fas fa-eye-slash text-orange-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                    Hide Requests Management
                </h1>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-xl border border-orange-200">
                        <i className="fas fa-eye-slash text-orange-600"></i>
                        <span className="text-gray-700 font-medium">Total: {totalResults} requests</span>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i className="fas fa-filter text-gray-400 group-focus-within:text-orange-500 transition-colors"></i>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={handleStatusChange}
                            className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <i className="fas fa-exclamation-triangle text-red-500 text-lg"></i>
                        <p className="font-semibold">{error}</p>
                    </div>
                </div>
            )}

            {/* Hide Requests Table */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-file-alt text-orange-500"></i>
                                        Petition
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-user text-blue-500"></i>
                                        Requester
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-comment text-purple-500"></i>
                                        Reason
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-info-circle text-yellow-500"></i>
                                        Status
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-calendar text-green-500"></i>
                                        Date
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-cog text-red-500"></i>
                                        Actions
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {hideRequests.map((request) => (
                                <tr
                                    key={request._id}
                                    className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 transition-all duration-200"
                                >
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {request.petition?.title || "Petition not found"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {request.petition?.numberOfSignatures || 0} signatures
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{request.user?.name || "Unknown"}</div>
                                        <div className="text-xs text-gray-500">{request.user?.email || ""}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 max-w-xs truncate">
                                            {request.reason || "No reason provided"}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(request.status)}`}>
                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(request.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {request.status === "pending" ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openActionModal(request._id, "approve")}
                                                    disabled={actionLoading === request._id}
                                                    className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 text-sm"
                                                >
                                                    <i className="fas fa-check"></i>
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => openActionModal(request._id, "reject")}
                                                    disabled={actionLoading === request._id}
                                                    className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 text-sm"
                                                >
                                                    <i className="fas fa-times"></i>
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 text-sm">
                                                {request.reviewedBy && (
                                                    <span>By: {request.reviewedBy}</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {hideRequests.length === 0 && !loading && (
                    <div className="text-center py-16">
                        <div className="relative inline-block">
                            <i className="fas fa-eye-slash text-6xl text-gray-300 mb-4"></i>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                            No hide requests found
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {statusFilter ? "Try changing the filter" : "No users have requested to hide petitions yet"}
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between border border-gray-200/50 rounded-2xl shadow-xl">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => {
                                const prevPage = currentPage - 1;
                                setCurrentPage(prevPage);
                                fetchHideRequests(prevPage, statusFilter);
                            }}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => {
                                const nextPage = currentPage + 1;
                                setCurrentPage(nextPage);
                                fetchHideRequests(nextPage, statusFilter);
                            }}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing{" "}
                                <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{" "}
                                <span className="font-medium">{Math.min(currentPage * 10, totalResults)}</span> of{" "}
                                <span className="font-medium">{totalResults}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => {
                                        const prevPage = currentPage - 1;
                                        setCurrentPage(prevPage);
                                        fetchHideRequests(prevPage, statusFilter);
                                    }}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <button
                                    onClick={() => {
                                        const nextPage = currentPage + 1;
                                        setCurrentPage(nextPage);
                                        fetchHideRequests(nextPage, statusFilter);
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            {pendingAction === "approve" ? "Approve Hide Request" : "Reject Hide Request"}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {pendingAction === "approve"
                                ? "The petition will be hidden from public view."
                                : "The petition will remain visible to the public."}
                        </p>
                        <textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Add a note (optional)"
                            className="w-full p-3 border border-gray-200 rounded-xl mb-4"
                            rows={3}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleAction(showNoteModal, pendingAction)}
                                disabled={actionLoading === showNoteModal}
                                className={`flex-1 py-2 px-4 rounded-xl font-semibold text-white transition-all ${pendingAction === "approve"
                                        ? "bg-green-500 hover:bg-green-600"
                                        : "bg-red-500 hover:bg-red-600"
                                    } disabled:opacity-50`}
                            >
                                {actionLoading === showNoteModal ? (
                                    <i className="fas fa-spinner animate-spin"></i>
                                ) : pendingAction === "approve" ? (
                                    "Confirm Approve"
                                ) : (
                                    "Confirm Reject"
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowNoteModal(null);
                                    setAdminNote("");
                                    setPendingAction(null);
                                }}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
