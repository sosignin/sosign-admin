"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../../utils/api";

export default function CommentApprovalPage() {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchUnapprovedComments();
    }, []);

    const fetchUnapprovedComments = async () => {
        setLoading(true);
        try {
            const res = await authFetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
                }/api/comments/admin/unapproved`
            );
            const data = await res.json();
            setComments(data.comments || []);
        } catch (err) {
            setError("Failed to fetch comments");
        }
        setLoading(false);
    };

    const approveComment = async (id) => {
        try {
            const res = await authFetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
                }/api/comments/admin/${id}/approve`,
                {
                    method: "PUT",
                }
            );
            if (res.ok) {
                setComments((prev) => prev.filter((c) => c._id !== id));
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert("Failed to approve comment: " + (errorData.message || res.statusText));
            }
        } catch (err) {
            alert("Failed to approve comment: " + err.message);
        }
    };

    const rejectComment = async (id) => {
        if (!confirm("Are you sure you want to reject and delete this comment?")) {
            return;
        }
        try {
            const res = await authFetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
                }/api/comments/admin/${id}/reject`,
                {
                    method: "DELETE",
                }
            );
            if (res.ok) {
                setComments((prev) => prev.filter((c) => c._id !== id));
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert("Failed to reject comment: " + (errorData.message || res.statusText));
            }
        } catch (err) {
            alert("Failed to reject comment: " + err.message);
        }
    };
        } catch (err) {
            alert("Failed to reject comment");
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading)
        return (
            <div className="p-6">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                        Comment Approval
                    </h1>
                    <p className="text-gray-600 font-medium">
                        Review and approve pending comments
                    </p>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <i className="fas fa-comments text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        );

    if (error)
        return (
            <div className="p-6">
                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <i className="fas fa-exclamation-triangle text-red-500 text-lg"></i>
                        <p className="font-semibold">{error}</p>
                    </div>
                </div>
            </div>
        );

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-14 translate-x-14"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-1">
                                Comment Approval
                            </h1>
                            <p className="text-gray-600 font-medium">
                                Review and approve pending comments
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
                            <i className="fas fa-hourglass-half"></i>
                            <span>{comments.length} Pending</span>
                        </div>
                    </div>
                    {comments.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="relative inline-block">
                                <i className="fas fa-comments text-6xl text-gray-300 mb-4"></i>
                                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur"></div>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">
                                No comments to approve
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                You&apos;re all caught up for now.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div
                                    key={comment._id}
                                    className="border border-gray-200 rounded-2xl p-5 bg-gradient-to-r from-gray-50 to-white hover:shadow-lg transition-all duration-200"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 space-y-3">
                                            {/* User Info */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {comment?.user?.name?.charAt(0)?.toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {comment?.user?.name || "Unknown User"}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {comment?.user?.designation || "Citizen"} •{" "}
                                                        {formatDate(comment.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Petition Info */}
                                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                                                <label className="block text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">
                                                    <i className="fas fa-file-alt mr-2"></i>
                                                    Petition Details
                                                </label>
                                                <div className="flex gap-4">
                                                    {/* Petition Image */}
                                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                                        {comment?.petition?.petitionDetails?.image ? (
                                                            <img
                                                                src={comment.petition.petitionDetails.image}
                                                                alt={comment?.petition?.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                                                                <i className="fas fa-file-alt text-blue-400 text-2xl"></i>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Petition Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
                                                            {comment?.petition?.title || "Unknown Petition"}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2 text-xs">
                                                            {comment?.petition?.petitionCategory && (
                                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                                                    <i className="fas fa-tag mr-1"></i>
                                                                    {comment.petition.petitionCategory}
                                                                </span>
                                                            )}
                                                            {comment?.petition?.signatureCount !== undefined && (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                                                    <i className="fas fa-pen-nib mr-1"></i>
                                                                    {comment.petition.signatureCount} signatures
                                                                </span>
                                                            )}
                                                            {comment?.petition?.user?.name && (
                                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                                                                    <i className="fas fa-user mr-1"></i>
                                                                    by {comment.petition.user.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {comment?.petition?._id && (
                                                            <a
                                                                href={`${process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"}/currentpetitions/${comment.petition.slug || comment.petition._id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                            >
                                                                <i className="fas fa-external-link-alt"></i>
                                                                View Petition
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Comment Content */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    <i className="fas fa-comment text-blue-500 mr-2"></i>
                                                    Comment
                                                </label>
                                                <div className="bg-white border border-gray-200 rounded-xl p-4">
                                                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => approveComment(comment._id)}
                                                className="px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 font-medium"
                                            >
                                                <i className="fas fa-check-circle"></i>
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => rejectComment(comment._id)}
                                                className="px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 font-medium"
                                            >
                                                <i className="fas fa-times-circle"></i>
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
