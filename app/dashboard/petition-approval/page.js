"use client";

import { useEffect, useState } from "react";

export default function PetitionApprovalPage() {
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUnapprovedPetitions();
  }, []);

  const fetchUnapprovedPetitions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/petitions/unapproved`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await res.json();
      setPetitions(data.petitions || []);
    } catch (err) {
      setError("Failed to fetch petitions");
    }
    setLoading(false);
  };

  const approvePetition = async (id) => {
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/petitions/${id}/approve`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      if (res.ok) {
        setPetitions((prev) => prev.filter((p) => p._id !== id));
      } else {
        alert("Failed to approve petition");
      }
    } catch (err) {
      alert("Failed to approve petition");
    }
  };

  const rejectPetition = async (id) => {
    const reason = window.prompt("Reason for rejection:", "Does not meet our community guidelines.");
    if (reason === null) return; // Cancelled

    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/petitions/${id}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
          credentials: "include",
        }
      );
      if (res.ok) {
        setPetitions((prev) => prev.filter((p) => p._id !== id));
      } else {
        alert("Failed to reject petition");
      }
    } catch (err) {
      alert("Failed to reject petition");
    }
  };

  if (loading)
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Unapproved Petitions</h1>
          <p className="text-gray-600 font-medium">Review and approve pending petitions</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-clipboard-check text-blue-600 text-xl"></i>
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
                Unapproved Petitions
              </h1>
              <p className="text-gray-600 font-medium">Review and approve pending petitions</p>
            </div>
          </div>
          {petitions.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <i className="fas fa-clipboard-check text-6xl text-gray-300 mb-4"></i>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur"></div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No petitions to approve</h3>
              <p className="mt-2 text-sm text-gray-500">You&apos;re all caught up for now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {petitions.map((petition) => (
                <div
                  key={petition._id}
                  className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group"
                >
                  {/* Banner/Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <i className="fas fa-file-alt text-blue-600 text-xl"></i>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {petition.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="px-2 py-0.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                                <i className="fas fa-globe text-[8px]"></i>
                                {petition.country}
                              </span>
                              {petition.categories?.map((cat, i) => (
                                <span key={i} className="px-2 py-0.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                                  <i className="fas fa-tag text-[8px]"></i>
                                  {cat}
                                </span>
                              ))}
                              <span className="px-2 py-0.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                                <i className="fas fa-clock text-[8px]"></i>
                                {new Date(petition.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => approvePetition(petition._id)}
                          className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-bold text-sm"
                        >
                          <i className="fas fa-check-circle"></i>
                          Approve
                        </button>
                        <button
                          onClick={() => rejectPetition(petition._id)}
                          className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all duration-200 flex items-center justify-center gap-2 font-bold text-sm"
                        >
                          <i className="fas fa-times-circle"></i>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Content & Details */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Image Preview if exists */}
                      {petition.petitionDetails?.image && (
                        <div className="relative h-48 w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={petition.petitionDetails.image} 
                            alt="Petition" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
                            <i className="fas fa-exclamation-circle text-[10px]"></i>
                            The Problem
                          </label>
                          <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 min-h-[100px]">
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {petition.petitionDetails?.problem}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-green-500 flex items-center gap-2">
                            <i className="fas fa-lightbulb text-[10px]"></i>
                            The Solution
                          </label>
                          <div className="p-4 bg-green-50/50 rounded-xl border border-green-100 min-h-[100px]">
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {petition.petitionDetails?.solution}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Decision Makers */}
                      {petition.decisionMakers?.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <i className="fas fa-users text-[10px]"></i>
                            Decision Makers
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {petition.decisionMakers.map((dm, i) => (
                              <div key={i} className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center">
                                  <i className="fas fa-user-tie text-gray-400 text-xs"></i>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900">{dm.name}</p>
                                  <p className="text-[10px] text-gray-500">{dm.organization || "No Organization"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Target Signers */}
                      {petition.requestedSigners?.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <i className="fas fa-bullseye text-[10px]"></i>
                            Target Signers
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {petition.requestedSigners.map((rs, i) => (
                              <div key={i} className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center">
                                  <i className="fas fa-star text-yellow-500 text-xs"></i>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900">{rs.name}</p>
                                  <p className="text-[10px] text-gray-500">
                                    {rs.designation || "Target Signer"}{rs.email ? ` (${rs.email})` : ""}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Author Info & Requirements */}
                    <div className="space-y-6 lg:border-l lg:pl-6 border-gray-100">
                      {/* Author Details */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Created By</label>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg relative overflow-hidden">
                          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                          <div className="relative z-10 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                <i className="fas fa-user-edit"></i>
                              </div>
                              <div>
                                <p className="font-bold text-lg leading-tight">{petition.petitionStarter?.name}</p>
                                <p className="text-xs text-white/70">{petition.petitionStarter?.location || "Unknown Location"}</p>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-white/10 space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <i className="fas fa-phone text-white/50 w-4"></i>
                                {petition.petitionStarter?.mobile}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <i className="fas fa-id-card text-white/50 w-4"></i>
                                <span className="font-mono tracking-wider">{petition.petitionStarter?.aadharNumber}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional Starter Info */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">MP Constituency</p>
                            <p className="text-xs font-bold text-gray-700">{petition.petitionStarter?.mpConstituencyNumber || "N/A"}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">MLA Constituency</p>
                            <p className="text-xs font-bold text-gray-700">{petition.petitionStarter?.mlaConstituencyNumber || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Signing Requirements */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Signing Rules</label>
                        <div className="space-y-2">
                          <div className={`p-3 rounded-xl border flex items-center justify-between ${petition.signingRequirements?.aadhar?.required ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
                            <div className="flex items-center gap-2">
                              <i className={`fas fa-fingerprint text-xs ${petition.signingRequirements?.aadhar?.required ? "text-amber-600" : "text-gray-400"}`}></i>
                              <span className={`text-xs font-bold ${petition.signingRequirements?.aadhar?.required ? "text-amber-800" : "text-gray-500"}`}>Aadhaar Required</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${petition.signingRequirements?.aadhar?.required ? "bg-amber-200 text-amber-800" : "bg-gray-200 text-gray-600"}`}>
                              {petition.signingRequirements?.aadhar?.required ? "YES" : "NO"}
                            </span>
                          </div>
                          <div className={`p-3 rounded-xl border flex items-center justify-between ${petition.signingRequirements?.constituency?.required ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-100"}`}>
                            <div className="flex items-center gap-2">
                              <i className={`fas fa-map-marker-alt text-xs ${petition.signingRequirements?.constituency?.required ? "text-purple-600" : "text-gray-400"}`}></i>
                              <span className={`text-xs font-bold ${petition.signingRequirements?.constituency?.required ? "text-purple-800" : "text-gray-500"}`}>MP/MLA Check</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${petition.signingRequirements?.constituency?.required ? "bg-purple-200 text-purple-800" : "bg-gray-200 text-gray-600"}`}>
                              {petition.signingRequirements?.constituency?.required ? "YES" : "NO"}
                            </span>
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
    </div>
  );
}
