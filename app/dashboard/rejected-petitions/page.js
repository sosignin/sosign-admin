"use client";

import { useEffect, useState } from "react";

export default function RejectedPetitionsPage() {
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRejectedPetitions();
  }, []);

  const fetchRejectedPetitions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/petitions/rejected`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await res.json();
      setPetitions(data.petitions || []);
    } catch (err) {
      setError("Failed to fetch rejected petitions");
    }
    setLoading(false);
  };

  const undoRejection = async (id) => {
    if (!window.confirm("Are you sure you want to move this petition back to the approval queue?")) return;
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/petitions/${id}/reset`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      if (res.ok) {
        setPetitions((prev) => prev.filter((p) => p._id !== id));
      } else {
        alert("Failed to reset petition status");
      }
    } catch (err) {
      alert("Error resetting petition status");
    }
  };

  if (loading)
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Rejection History</h1>
          <p className="text-gray-600 font-medium">Review petitions that were not approved</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600"></div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-1">Rejection History</h1>
            <p className="text-gray-600 font-medium">Track and manage rejected petitions</p>
          </div>
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
            <i className="fas fa-times-circle"></i>
            {petitions.length} Total
          </div>
        </div>

        {petitions.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <i className="fas fa-file-alt text-6xl text-gray-200 mx-auto mb-4"></i>
            <h3 className="text-xl font-bold text-gray-400">No Rejection History</h3>
            <p className="text-gray-400 mt-2">All petitions are either live or pending review.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {petitions.map((petition) => (
              <div
                key={petition._id}
                className="border border-gray-200 rounded-3xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-300 border-l-8 border-l-red-500"
              >
                {/* Header Section */}
                <div className="bg-red-50/30 p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{petition.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 flex items-center gap-2 uppercase tracking-wider">
                          <i className="fas fa-globe"></i> {petition.country}
                        </span>
                        {petition.categories?.map((cat, i) => (
                          <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-[10px] font-bold flex items-center gap-2 uppercase tracking-wider">
                            <i className="fas fa-tag"></i> {cat}
                          </span>
                        ))}
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold flex items-center gap-2 uppercase tracking-wider">
                          <i className="fas fa-clock"></i> {new Date(petition.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => undoRejection(petition._id)}
                      className="px-4 py-2 bg-white text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 font-bold text-xs shadow-sm"
                    >
                      <i className="fas fa-undo"></i>
                      Restore to Pending
                    </button>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Rejection Reason & Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* REJECTION REASON - HIGHLIGHTED */}
                    <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-5 shadow-sm">
                      <label className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-2 mb-3">
                        <i className="fas fa-times-circle text-xs"></i>
                        Rejection Reason
                      </label>
                      <p className="text-red-900 font-bold italic text-lg leading-relaxed">
                        &quot;{petition.rejectionReason}&quot;
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          <i className="fas fa-exclamation-circle"></i> Problem
                        </label>
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{petition.petitionDetails?.problem}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          <i className="fas fa-info-circle"></i> Solution
                        </label>
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{petition.petitionDetails?.solution}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Author Identity */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Author Details</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                          <i className="fas fa-user-edit"></i>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{petition.petitionStarter?.name}</p>
                          <p className="text-[10px] text-gray-500">{petition.petitionStarter?.location}</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <i className="fas fa-phone w-4 text-gray-400"></i> {petition.petitionStarter?.mobile}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <i className="fas fa-id-card w-4 text-gray-400"></i> {petition.petitionStarter?.aadharNumber}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <i className="fas fa-envelope w-4 text-gray-400"></i> {petition.petitionStarter?.user?.email}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
