"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function ProgressUpdateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [update, setUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch update details
  const fetchUpdateDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/progress-updates/update/${params.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch progress update details");
      }

      const data = await response.json();
      setUpdate(data.data || data);
    } catch (err) {
      setError("Failed to load progress update: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete update
  const handleDeleteUpdate = async () => {
    if (!confirm(`Are you sure you want to delete this progress update?`)) {
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/progress-updates/${params.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to delete progress update");
      }

      alert("Progress update deleted successfully!");
      router.push("/dashboard/progress-updates");
    } catch (err) {
      alert("Failed to delete update: " + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  useEffect(() => {
    fetchUpdateDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Update Details</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-bullhorn text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !update) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Update Details</h1>
          </div>
          <Link
            href="/dashboard/progress-updates"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Back
          </Link>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-red-500 text-lg"></i>
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Update Details</h1>
          <p className="text-gray-600 font-medium">View full details of this progress update</p>
        </div>
        <Link
          href="/dashboard/progress-updates"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
        >
          <i className="fas fa-arrow-left"></i>
          Back to List
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Petition Information Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              <i className="fas fa-file-alt"></i>
              Petition Information
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Petition Title</p>
                <p className="text-gray-900 font-semibold text-lg">{update.petition?.title || "Unknown Petition"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Petition Status</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                  <i className="fas fa-check-circle mr-2"></i>
                  {update.petition?.status || "Active"}
                </span>
              </div>
            </div>
            {update.petition?.description && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Petition Description</p>
                <p className="text-gray-700 text-sm leading-relaxed">{update.petition.description}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{update.petition?.numberOfSignatures || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Total Signatures</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{Array.isArray(update.petition?.comments) ? update.petition.comments.length : update.petition?.comments || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Comments</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{update.petition?.shares || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Shares</p>
              </div>
            </div>
          </div>
        </div>

        {/* Author Information Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              <i className="fas fa-user-circle"></i>
              Posted By
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 pb-6">
              {update.author?.profilePicture ? (
                <img src={update.author.profilePicture} alt="" className="w-16 h-16 rounded-full object-cover border-4 border-indigo-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-2xl">
                  <i className="fas fa-user"></i>
                </div>
              )}
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-900">{update.author?.name || "Unknown Author"}</p>
                <p className="text-sm text-gray-500">{update.author?.email}</p>
                {update.author?.designation && (
                  <p className="text-sm text-indigo-600 font-medium">{update.author.designation}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Posted On</p>
                <p className="text-gray-900 font-semibold">{formatDate(update.createdAt)}</p>
              </div>
              {update.updatedAt && update.updatedAt !== update.createdAt && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Last Updated</p>
                  <p className="text-gray-900 font-semibold">{formatDate(update.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Update Content Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              <i className="fas fa-bullhorn"></i>
              Update Content
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {update.title && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Update Title</p>
                <h3 className="text-2xl font-bold text-gray-900">{update.title}</h3>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Update Description</p>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{update.content}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Media Attachments */}
        {(update.images?.length > 0 || update.videoUrl || update.documents?.length > 0) && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-6">
              <h2 className="text-white text-xl font-bold flex items-center gap-2">
                <i className="fas fa-paperclip"></i>
                Attachments
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Images */}
              {update.images?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <i className="fas fa-image text-blue-500 text-lg"></i>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Images ({update.images.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {update.images.map((img, idx) => (
                      <a 
                        key={idx} 
                        href={img} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden rounded-lg border-2 border-gray-100 hover:border-blue-500 transition-all"
                      >
                        <img src={img} alt="" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <i className="fas fa-search-plus text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl"></i>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {update.documents?.length > 0 && (
                <div className={update.images?.length > 0 ? "border-t border-gray-100 pt-6" : ""}>
                  <div className="flex items-center gap-2 mb-4">
                    <i className="fas fa-file-pdf text-red-500 text-lg"></i>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Documents ({update.documents.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {update.documents.map((doc, idx) => (
                      <a 
                        key={idx} 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-red-50 hover:to-orange-50 border border-gray-200 hover:border-red-300 transition-all group"
                      >
                        <div className="flex-shrink-0">
                          <i className="fas fa-file-pdf text-2xl text-red-500 group-hover:scale-110 transition-transform"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{doc.filename || `Document ${idx+1}`}</p>
                          <p className="text-xs text-gray-500">Click to download</p>
                        </div>
                        <i className="fas fa-arrow-up-right-from-square text-gray-400 group-hover:text-red-600 transition-colors flex-shrink-0"></i>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Video */}
              {update.videoUrl && (
                <div className={(update.images?.length > 0 || update.documents?.length > 0) ? "border-t border-gray-100 pt-6" : ""}>
                  <div className="flex items-center gap-2 mb-4">
                    <i className="fas fa-video text-red-500 text-lg"></i>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Video</h3>
                  </div>
                  <a 
                    href={update.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg hover:from-red-100 hover:to-pink-100 border border-red-200 hover:border-red-400 transition-all group"
                  >
                    <i className="fas fa-play-circle text-3xl text-red-600 group-hover:scale-110 transition-transform"></i>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">Video Link</p>
                      <p className="text-xs text-gray-500 truncate">{update.videoUrl}</p>
                    </div>
                    <i className="fas fa-arrow-up-right-from-square text-gray-400 group-hover:text-red-600 transition-colors flex-shrink-0"></i>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-lg">
        <Link
          href="/dashboard/progress-updates"
          className="flex items-center gap-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
        >
          <i className="fas fa-times"></i>
          Cancel
        </Link>
        <button
          onClick={handleDeleteUpdate}
          disabled={deleteLoading}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
        >
          {deleteLoading ? (
            <i className="fas fa-spinner animate-spin"></i>
          ) : (
            <i className="fas fa-trash"></i>
          )}
          Delete Update
        </button>
      </div>
    </div>
  );
}
