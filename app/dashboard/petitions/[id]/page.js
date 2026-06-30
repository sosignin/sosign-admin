"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import AdminCommentsSection from "../../../../components/AdminCommentsSection";

export default function PetitionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [petition, setPetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch petition details
  const fetchPetition = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/petitions/${params.id}`,
        {
          credentials: "include", // Include admin cookies
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch petition details");
      }

      const data = await response.json();
      setPetition(data);
    } catch (err) {
      setError("Failed to load petition: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  // Delete petition
  const handleDeletePetition = async () => {
    if (!confirm(`Are you sure you want to delete "${petition.title}"?`)) {
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/petitions/${params.id}`,
        {
          method: "DELETE",
          credentials: "include", // Include admin cookies
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to delete petition");
      }

      alert("Petition deleted successfully!");
      router.push("/dashboard/petitions");
    } catch (err) {
      alert("Failed to delete petition: " + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (params.id) {
      fetchPetition();
    }
  }, [params.id, fetchPetition]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Petition Details
          </h1>
          <p className="text-gray-600 font-medium">
            Loading petition information...
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-file-alt text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <i className="fas fa-exclamation-triangle text-red-500 text-lg"></i>
            <p className="font-semibold">{error}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!petition) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <div className="relative inline-block">
            <i className="fas fa-file-alt text-6xl text-gray-300 mb-4"></i>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Petition not found
          </h3>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <i className="fas fa-arrow-left"></i>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 shadow-sm"
            >
              <i className="fas fa-arrow-left text-gray-700 text-lg"></i>
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                Petition Details
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-xl border border-gray-200">
                  <i className="fas fa-hashtag text-gray-500"></i>
                  <span className="text-gray-600 font-medium text-sm">
                    ID: {petition._id}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleDeletePetition}
            disabled={deleteLoading}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 font-medium"
          >
            {deleteLoading ? (
              <>
                <i className="fas fa-spinner animate-spin"></i>
                Deleting...
              </>
            ) : (
              <>
                <i className="fas fa-trash"></i>
                Delete Petition
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                  <i className="fas fa-info-circle text-blue-600 text-lg"></i>
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Basic Information
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <p className="text-lg font-medium text-gray-900">
                    {petition.title}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country
                    </label>
                    <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-xl text-sm font-semibold border border-green-200 inline-flex items-center gap-2">
                      <i className="fas fa-globe"></i>
                      {petition.country}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Signatures
                    </label>
                    <div className="flex items-center">
                      <i className="fas fa-signature text-purple-500 mr-3 text-lg"></i>
                      <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {petition.numberOfSignatures}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Created At
                  </label>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-calendar text-indigo-500"></i>
                    <p className="text-gray-900 font-medium">
                      {formatDate(petition.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Petition Details */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                  <i className="fas fa-file-alt text-green-600 text-lg"></i>
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Petition Details
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                    Problem Statement
                  </label>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {petition.petitionDetails.problem}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                    Proposed Solution
                  </label>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {petition.petitionDetails.solution}
                    </p>
                  </div>
                </div>
                {petition.petitionDetails.image && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <i className="fas fa-image text-blue-500 mr-2"></i>
                      Image
                    </label>
                    <Image
                      src={petition.petitionDetails.image}
                      alt="Petition image"
                      width={800}
                      height={400}
                      className="max-w-full h-auto rounded-xl border border-gray-200 shadow-sm"
                    />
                  </div>
                )}
                {petition.petitionDetails.videoUrl && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <i className="fas fa-video text-purple-500 mr-2"></i>
                      Video URL
                    </label>
                    <a
                      href={petition.petitionDetails.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <i className="fas fa-external-link-alt"></i>
                      View Video
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Decision Makers */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                  <i className="fas fa-users text-purple-600 text-lg"></i>
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Decision Makers
                </h2>
              </div>
              <div className="grid gap-4">
                {petition.decisionMakers.map((maker, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-all duration-200"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          <i className="fas fa-user text-blue-500 mr-1"></i>
                          Name
                        </label>
                        <p className="text-gray-900 font-medium">
                          {maker.name}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          <i className="fas fa-building text-green-500 mr-1"></i>
                          Organization
                        </label>
                        <p className="text-gray-900 font-medium">
                          {maker.organization || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          <i className="fas fa-envelope text-purple-500 mr-1"></i>
                          Email
                        </label>
                        <p className="text-gray-900 font-medium">
                          {maker.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          <i className="fas fa-phone text-orange-500 mr-1"></i>
                          Phone
                        </label>
                        <p className="text-gray-900 font-medium">
                          {maker.phone || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Target Signers */}
          {petition.requestedSigners?.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                    <i className="fas fa-bullseye text-blue-600 text-lg"></i>
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Target Signers (Optional)
                  </h2>
                </div>
                <div className="grid gap-4">
                  {petition.requestedSignersStatus ? (
                    petition.requestedSignersStatus.map((signer, index) => (
                      <div
                        key={index}
                        className={`border rounded-xl p-4 transition-all duration-200 ${
                          signer.hasSigned 
                            ? "bg-green-50/50 border-green-200 hover:shadow-md" 
                            : "bg-gradient-to-r from-gray-50 to-white hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                <i className="fas fa-user text-blue-500 mr-1"></i>
                                Name
                              </label>
                              <p className="text-gray-900 font-medium">{signer.name}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                <i className="fas fa-envelope text-purple-500 mr-1"></i>
                                Email
                              </label>
                              <p className="text-gray-900 font-medium">{signer.email || "N/A"}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                <i className="fas fa-briefcase text-orange-500 mr-1"></i>
                                Designation
                              </label>
                              <p className="text-gray-900 font-medium">{signer.designation || "N/A"}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                <i className="fas fa-info-circle text-gray-500 mr-1"></i>
                                Status
                              </label>
                              {signer.hasSigned ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                  <i className="fas fa-check-circle"></i> Signed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <i className="fas fa-clock"></i> Pending Signature
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {signer.hasSigned && signer.signedBy && (
                          <div className="mt-4 pt-3 border-t border-green-200 flex items-center gap-3">
                            {signer.signedBy.profilePicture ? (
                              <img 
                                src={signer.signedBy.profilePicture} 
                                alt={signer.signedBy.name} 
                                className="w-10 h-10 rounded-full object-cover border border-green-200" 
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                                {signer.signedBy.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-gray-900">Signed as verified user:</p>
                              <p className="text-xs text-gray-500">@{signer.signedBy.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    petition.requestedSigners.map((signer, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-all duration-200"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              <i className="fas fa-user text-blue-500 mr-1"></i>
                              Name
                            </label>
                            <p className="text-gray-900 font-medium">{signer.name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              <i className="fas fa-envelope text-purple-500 mr-1"></i>
                              Email
                            </label>
                            <p className="text-gray-900 font-medium">{signer.email || "N/A"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              <i className="fas fa-briefcase text-orange-500 mr-1"></i>
                              Designation
                            </label>
                            <p className="text-gray-950 font-medium">{signer.designation || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Petition Starter */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                  <i className="fas fa-user-circle text-orange-600 text-lg"></i>
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Petition Starter
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <i className="fas fa-user text-blue-500 mr-1"></i>
                    Name
                  </label>
                  <p className="text-gray-900 font-medium">
                    {petition.petitionStarter.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <i className="fas fa-envelope text-green-500 mr-1"></i>
                    Email
                  </label>
                  <p className="text-gray-900 font-medium">
                    {petition.petitionStarter.user?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <i className="fas fa-phone text-purple-500 mr-1"></i>
                    Mobile
                  </label>
                  <p className="text-gray-900 font-medium">
                    {petition.petitionStarter.mobile}
                  </p>
                </div>
                {petition.petitionStarter.age && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      <i className="fas fa-birthday-cake text-yellow-500 mr-1"></i>
                      Age
                    </label>
                    <p className="text-gray-900 font-medium">
                      {petition.petitionStarter.age}
                    </p>
                  </div>
                )}
                {petition.petitionStarter.location && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      <i className="fas fa-map-marker-alt text-red-500 mr-1"></i>
                      Location
                    </label>
                    <p className="text-gray-900 font-medium">
                      {petition.petitionStarter.location}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    <i className="fas fa-id-card text-indigo-500 mr-1"></i>
                    Aadhar Number
                  </label>
                  <p className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg border">
                    {petition.petitionStarter.aadharNumber}
                  </p>
                </div>
                {petition.petitionStarter.panNumber && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      <i className="fas fa-credit-card text-blue-500 mr-1"></i>
                      PAN Number
                    </label>
                    <p className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg border">
                      {petition.petitionStarter.panNumber}
                    </p>
                  </div>
                )}
                {petition.petitionStarter.comment && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      <i className="fas fa-comment text-gray-500 mr-1"></i>
                      Comment
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border">
                      {petition.petitionStarter.comment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                  <i className="fas fa-chart-bar text-green-600 text-lg"></i>
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Statistics
                </h2>
              </div>
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                  <i className="fas fa-signature text-green-500 text-2xl mb-2"></i>
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                    {petition.numberOfSignatures}
                  </div>
                  <div className="text-sm text-green-700 font-medium">
                    Total Signatures
                  </div>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <i className="fas fa-list text-blue-500 text-2xl mb-2"></i>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {petition.signatures.length}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">
                    Recorded Signatures
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Breakdown */}
          {petition.signatures.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                    <i className="fas fa-share-alt text-purple-600 text-lg"></i>
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Referral Breakdown
                  </h2>
                </div>
                {(() => {
                  const counts = {};
                  for (const s of petition.signatures) {
                    const code = s.referral?.code || "(none)";
                    counts[code] = (counts[code] || 0) + 1;
                  }
                  const entries = Object.entries(counts).sort(
                    (a, b) => b[1] - a[1]
                  );
                  return (
                    <div className="space-y-3">
                      {entries.map(([code, count]) => (
                        <div
                          key={code}
                          className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <i className="fas fa-code text-purple-500"></i>
                            <span className="text-gray-700 font-medium">
                              Code:{" "}
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                                {code}
                              </span>
                            </span>
                          </div>
                          <span className="font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full text-sm">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Recent Signatures */}
          {petition.signatures.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl">
                    <i className="fas fa-history text-indigo-600 text-lg"></i>
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Recent Signatures
                  </h2>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {petition.signatures.slice(0, 10).map((signature, index) => {
                    const user = signature.user?.name
                      ? `${signature.user.name} (${
                          signature.user.email || signature.user._id
                        })`
                      : signature.user || "Unknown";
                    const refOwner = signature.referral?.owner?.name
                      ? `${signature.referral.owner.name} (${
                          signature.referral.owner.email ||
                          signature.referral.owner._id
                        })`
                      : signature.referral?.owner || null;
                    return (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <i className="fas fa-user text-blue-500"></i>
                          <p className="text-gray-900 font-medium">
                            Signer: {user}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <i className="fas fa-code text-purple-500"></i>
                          <p className="text-gray-700">
                            Code Used:{" "}
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                              {signature.referral?.code || "(none)"}
                            </span>
                          </p>
                        </div>
                        {refOwner && (
                          <div className="flex items-center gap-2 mb-2">
                            <i className="fas fa-user-tie text-green-500"></i>
                            <p className="text-gray-700">
                              Code Owner: {refOwner}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <i className="fas fa-clock text-gray-500"></i>
                          <p className="text-gray-500 text-sm">
                            {formatDate(signature.signedAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {petition.signatures.length > 10 && (
                    <div className="text-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-500 font-medium">
                        <i className="fas fa-ellipsis-h mr-2"></i>
                        ... and {petition.signatures.length - 10} more
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {petition && petition._id && (
        <div className="mt-8">
          <AdminCommentsSection petitionId={petition._id} />
        </div>
      )}
    </div>
  );
}
