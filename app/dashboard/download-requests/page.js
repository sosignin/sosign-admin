"use client";

import { useState, useEffect } from "react";
import { authFetch } from "../../../utils/api";

export default function DownloadRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [processingId, setProcessingId] = useState(null);
    const [adminNote, setAdminNote] = useState("");
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [approvedFields, setApprovedFields] = useState([]);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Fetch requests
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await authFetch(
                `${apiUrl}/api/download-requests/admin/all?status=${filter}`
            );

            if (response.ok) {
                const data = await response.json();
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
                authFetch(`${apiUrl}/api/download-requests/admin/all?status=pending`),
                authFetch(`${apiUrl}/api/download-requests/admin/all?status=approved`),
                authFetch(`${apiUrl}/api/download-requests/admin/all?status=rejected`),
            ]);

            const pendingData = await pendingRes.json();
            const approvedData = await approvedRes.json();
            const rejectedData = await rejectedRes.json();

            setStats({
                pending: pendingData.totalRequests || 0,
                approved: approvedData.totalRequests || 0,
                rejected: rejectedData.totalRequests || 0,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    // Handle approve
    const handleApprove = async (requestId, note = "", fields = []) => {
        setProcessingId(requestId);
        try {
            const response = await authFetch(
                `${apiUrl}/api/download-requests/admin/${requestId}/approve`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ adminNote: note, approvedFields: fields }),
                }
            );

            if (response.ok) {
                fetchRequests();
                fetchStats();
                setShowNoteModal(false);
                setAdminNote("");
                setApprovedFields([]);
            }
        } catch (error) {
            console.error("Error approving request:", error);
        } finally {
            setProcessingId(null);
        }
    };

    // Handle reject
    const handleReject = async (requestId, note = "") => {
        setProcessingId(requestId);
        try {
            const response = await authFetch(
                `${apiUrl}/api/download-requests/admin/${requestId}/reject`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ adminNote: note }),
                }
            );

            if (response.ok) {
                fetchRequests();
                fetchStats();
                setShowNoteModal(false);
                setAdminNote("");
                setApprovedFields([]);
            }
        } catch (error) {
            console.error("Error rejecting request:", error);
        } finally {
            setProcessingId(null);
        }
    };

    // Open note modal
    const openNoteModal = (request, action) => {
        setSelectedRequest(request);
        setActionType(action);
        setAdminNote("");
        // Pre-select all requested fields when approving
        if (action === "approve" && request.requestedFields) {
            setApprovedFields([...request.requestedFields]);
        } else {
            setApprovedFields([]);
        }
        setShowNoteModal(true);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Download Requests</h1>
                    <p className="text-gray-500">Manage petition download permission requests</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    className={`bg-white rounded-xl p-5 shadow-sm border-l-4 cursor-pointer transition-all ${filter === "pending" ? "border-yellow-500 ring-2 ring-yellow-200" : "border-yellow-400 hover:shadow-md"
                        }`}
                    onClick={() => setFilter("pending")}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <i className="fas fa-clock text-yellow-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div
                    className={`bg-white rounded-xl p-5 shadow-sm border-l-4 cursor-pointer transition-all ${filter === "approved" ? "border-green-500 ring-2 ring-green-200" : "border-green-400 hover:shadow-md"
                        }`}
                    onClick={() => setFilter("approved")}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Approved</p>
                            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <i className="fas fa-check text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div
                    className={`bg-white rounded-xl p-5 shadow-sm border-l-4 cursor-pointer transition-all ${filter === "rejected" ? "border-red-500 ring-2 ring-red-200" : "border-red-400 hover:shadow-md"
                        }`}
                    onClick={() => setFilter("rejected")}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Rejected</p>
                            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <i className="fas fa-times text-red-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">
                        {filter.charAt(0).toUpperCase() + filter.slice(1)} Requests
                    </h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-inbox text-4xl mb-3"></i>
                        <p>No {filter} requests found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Petition
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Requested Data
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    {filter === "approved" && (
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Approved Data
                                        </th>
                                    )}
                                    {filter !== "pending" && (
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Admin Note
                                        </th>
                                    )}
                                    {filter === "pending" && (
                                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map((request) => {
                                    const fieldLabels = {
                                        petitionDetails: "Details",
                                        petitionStarter: "Starter",
                                        decisionMakers: "Decision Makers",
                                        statistics: "Stats",
                                        signatures: "Signatures",
                                        comments: "Comments",
                                    };
                                    return (
                                        <tr key={request._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {request.user?.name || "Unknown"}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {request.user?.email || "N/A"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-gray-800 max-w-xs truncate">
                                                    {request.petition?.title || "Unknown Petition"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-gray-600 text-sm max-w-xs line-clamp-2">
                                                    {request.reason}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {request.requestedFields && request.requestedFields.length > 0 ? (
                                                        request.requestedFields.map((field) => (
                                                            <span
                                                                key={field}
                                                                className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                                                            >
                                                                {fieldLabels[field] || field}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">All fields</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(request.createdAt)}
                                            </td>
                                            {filter === "approved" && (
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                                        {request.approvedFields && request.approvedFields.length > 0 ? (
                                                            request.approvedFields.map((field) => (
                                                                <span
                                                                    key={field}
                                                                    className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded"
                                                                >
                                                                    {fieldLabels[field] || field}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">All requested</span>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            {filter !== "pending" && (
                                                <td className="px-6 py-4">
                                                    <p className="text-gray-600 text-sm max-w-xs line-clamp-2">
                                                        {request.adminNote || "-"}
                                                    </p>
                                                </td>
                                            )}
                                            {filter === "pending" && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openNoteModal(request, "approve")}
                                                            disabled={processingId === request._id}
                                                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                                                        >
                                                            <i className="fas fa-check mr-1"></i>
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => openNoteModal(request, "reject")}
                                                            disabled={processingId === request._id}
                                                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                                                        >
                                                            <i className="fas fa-times mr-1"></i>
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Note Modal */}
            {showNoteModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {actionType === "approve" ? "Approve Request" : "Reject Request"}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {actionType === "approve"
                                    ? "Select which data fields the user can download."
                                    : "User will not be able to download. They can request again."}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Petition</p>
                                <p className="font-medium text-gray-800">
                                    {selectedRequest.petition?.title}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">Requested by</p>
                                <p className="font-medium text-gray-800">
                                    {selectedRequest.user?.name} ({selectedRequest.user?.email})
                                </p>
                            </div>

                            {/* Requested Fields Display */}
                            {selectedRequest.requestedFields && selectedRequest.requestedFields.length > 0 && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-sm font-medium text-blue-800 mb-2">
                                        <i className="fas fa-list-check mr-2"></i>
                                        User Requested Data:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRequest.requestedFields.map((field) => {
                                            const fieldLabels = {
                                                petitionDetails: "Petition Details",
                                                petitionStarter: "Petition Starter",
                                                decisionMakers: "Decision Makers",
                                                statistics: "Statistics",
                                                signatures: "Signatures List",
                                                comments: "Comments List",
                                            };
                                            return (
                                                <span
                                                    key={field}
                                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                                >
                                                    {fieldLabels[field] || field}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Approved Fields Selection (only for approve action) */}
                            {actionType === "approve" && selectedRequest.requestedFields && selectedRequest.requestedFields.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <i className="fas fa-check-double mr-2"></i>
                                        Select Fields to Approve <span className="text-red-500">*</span>
                                    </label>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        {/* Select All */}
                                        <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-gray-200">
                                            <input
                                                type="checkbox"
                                                checked={approvedFields.length === selectedRequest.requestedFields.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setApprovedFields([...selectedRequest.requestedFields]);
                                                    } else {
                                                        setApprovedFields([]);
                                                    }
                                                }}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Select All</span>
                                        </label>

                                        {/* Individual Fields */}
                                        {selectedRequest.requestedFields.map((field) => {
                                            const fieldLabels = {
                                                petitionDetails: "Petition Details (title, problem, solution, country)",
                                                petitionStarter: "Petition Starter Info (name, location)",
                                                decisionMakers: "Decision Makers List",
                                                statistics: "Statistics (signature & comment counts)",
                                                signatures: "Full Signatures List (names, emails, dates)",
                                                comments: "Full Comments List (user info, comments)",
                                            };
                                            return (
                                                <label key={field} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={approvedFields.includes(field)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setApprovedFields([...approvedFields, field]);
                                                            } else {
                                                                setApprovedFields(approvedFields.filter(f => f !== field));
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                    />
                                                    <span className="text-sm text-gray-600">{fieldLabels[field] || field}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {approvedFields.length}/{selectedRequest.requestedFields.length} fields selected
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admin Note (optional)
                                </label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Add a note for the user..."
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={3}
                                    maxLength={500}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowNoteModal(false);
                                    setSelectedRequest(null);
                                    setAdminNote("");
                                    setApprovedFields([]);
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (actionType === "approve") {
                                        handleApprove(selectedRequest._id, adminNote, approvedFields);
                                    } else {
                                        handleReject(selectedRequest._id, adminNote);
                                    }
                                }}
                                disabled={processingId || (actionType === "approve" && approvedFields.length === 0)}
                                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${actionType === "approve"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                                    }`}
                            >
                                {processingId ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
