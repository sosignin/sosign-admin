"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProgressUpdatesPage() {
  const router = useRouter();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  // Fetch updates from backend
  const fetchUpdates = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/progress-updates?${queryParams}`,
        {
          credentials: "include", // Include admin cookies
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch progress updates");
      }

      const data = await response.json();
      setUpdates(data.updates);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalResults(data.totalUpdates);
    } catch (err) {
      setError("Failed to load progress updates: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete update
  const handleDeleteUpdate = async (updateId, petitionTitle) => {
    if (!confirm(`Are you sure you want to delete this update for "${petitionTitle}"?`)) {
      return;
    }

    try {
      setDeleteLoading(updateId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/progress-updates/${updateId}`,
        {
          method: "DELETE",
          credentials: "include", // Include admin cookies
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to delete progress update");
      }

      // Refresh the list
      await fetchUpdates(currentPage);
      alert("Progress update deleted successfully!");
    } catch (err) {
      alert("Failed to delete update: " + err.message);
    } finally {
      setDeleteLoading(null);
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
    fetchUpdates();
  }, []);

  if (loading && updates.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Progress Updates Management</h1>
          <p className="text-gray-600 font-medium">Monitor and manage all petition progress updates</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Progress Updates Management</h1>
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
            <i className="fas fa-bullhorn text-blue-600"></i>
            <span className="text-gray-700 font-medium">Total: {totalResults} updates</span>
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

      {/* Table */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-file-alt text-blue-500"></i>
                    Petition
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-bullhorn text-purple-500"></i>
                    Update details
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-user text-indigo-500"></i>
                    Author
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-calendar-check text-yellow-500"></i>
                    Posted On
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
              {updates.map((update) => (
                <tr
                  key={update._id}
                  onClick={() => setSelectedUpdate(update)}
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate" title={update.petition?.title}>
                        {update.petition?.title || "Unknown Petition"}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-sm">
                      <p className="text-sm font-bold text-gray-800 mb-1">{update.title || "No Title"}</p>
                      <p className="text-xs text-gray-500 truncate" title={update.content}>
                        {update.content}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {update.images?.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            <i className="fas fa-image mr-1"></i>{update.images.length}
                          </span>
                        )}
                        {update.documents?.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            <i className="fas fa-file-pdf mr-1"></i>{update.documents.length}
                          </span>
                        )}
                        {update.videoUrl && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                            <i className="fas fa-video mr-1"></i>1
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {update.author?.profilePicture ? (
                        <img src={update.author.profilePicture} alt="" className="w-8 h-8 rounded-full mr-3 object-cover border border-gray-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center text-gray-500">
                          <i className="fas fa-user"></i>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {update.author?.name || "Unknown Author"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {update.author?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(update.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUpdate(update._id, update.petition?.title);
                      }}
                      disabled={deleteLoading === update._id}
                      className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-2 text-sm font-medium"
                      title="Delete Update"
                    >
                      {deleteLoading === update._id ? (
                        <i className="fas fa-spinner animate-spin"></i>
                      ) : (
                        <i className="fas fa-trash"></i>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {updates.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="relative inline-block">
              <i className="fas fa-bullhorn text-6xl text-gray-300 mb-4"></i>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full blur"></div>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No progress updates found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              When users post updates to their petitions, they will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between border border-gray-200/50 sm:px-8 rounded-2xl shadow-xl">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => {
                const prevPage = currentPage - 1;
                setCurrentPage(prevPage);
                fetchUpdates(prevPage);
              }}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <i className="fas fa-chevron-left mr-2"></i>
              Previous
            </button>
            <button
              onClick={() => {
                const nextPage = currentPage + 1;
                setCurrentPage(nextPage);
                fetchUpdates(nextPage);
              }}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
              <i className="fas fa-chevron-right ml-2"></i>
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * 10 + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * 10, totalResults)}
                </span>{" "}
                of <span className="font-medium">{totalResults}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => {
                    const prevPage = currentPage - 1;
                    setCurrentPage(prevPage);
                    fetchUpdates(prevPage);
                  }}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                {/* Page numbers */}
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          fetchUpdates(page);
                        }}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 ${page === currentPage
                            ? "z-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 text-blue-600 shadow-md"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:shadow-sm"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span
                        key={page}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => {
                    const nextPage = currentPage + 1;
                    setCurrentPage(nextPage);
                    fetchUpdates(nextPage);
                  }}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Update Details</h2>
              <button 
                onClick={() => setSelectedUpdate(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {/* Petition Info */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Petition</p>
                <p className="text-gray-900 font-medium">{selectedUpdate.petition?.title || "Unknown Petition"}</p>
              </div>

              {/* Author Info */}
              <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                {selectedUpdate.author?.profilePicture ? (
                  <img src={selectedUpdate.author.profilePicture} alt="" className="w-10 h-10 rounded-full mr-4 object-cover border border-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 mr-4 flex items-center justify-center text-indigo-500">
                    <i className="fas fa-user"></i>
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {selectedUpdate.author?.name || "Unknown Author"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedUpdate.author?.email} • Posted on {formatDate(selectedUpdate.createdAt)}
                  </div>
                </div>
              </div>

              {/* Update Content */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedUpdate.title || "No Title"}</h3>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  {selectedUpdate.content}
                </div>
              </div>

              {/* Media Attachments */}
              {(selectedUpdate.images?.length > 0 || selectedUpdate.videoUrl || selectedUpdate.documents?.length > 0) && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attached Media</p>
                  
                  {/* Images */}
                  {selectedUpdate.images?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Images ({selectedUpdate.images.length})</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {selectedUpdate.images.map((img, idx) => (
                          <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                            <img src={img} alt="" className="h-24 w-auto object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {selectedUpdate.documents?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Documents ({selectedUpdate.documents.length})</p>
                      <div className="space-y-2">
                        {selectedUpdate.documents.map((doc, idx) => (
                          <a 
                            key={idx} 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                          >
                            <i className="fas fa-file-pdf text-red-500 text-xl"></i>
                            <span className="text-sm font-medium text-gray-700">{doc.filename || `Document ${idx+1}`}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video */}
                  {selectedUpdate.videoUrl && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Video Link</p>
                      <a 
                        href={selectedUpdate.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <i className="fas fa-video"></i> {selectedUpdate.videoUrl}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
