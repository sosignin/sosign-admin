"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";

const PetitionApprovalPage = () => {
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUnapprovedPetitions();
  }, []);

  const fetchUnapprovedPetitions = async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/petitions/unapproved`
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
      const res = await authFetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/petitions/${id}/approve`,
        {
          method: "PUT",
        }
      );
      if (res.ok) {
        setPetitions((prev) => prev.filter((p) => p._id !== id));
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert("Failed to approve petition: " + (errorData.message || res.statusText));
      }
    } catch (err) {
      alert("Failed to approve petition: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Unapproved Petitions
          </h1>
          <p className="text-gray-600 font-medium">
            Review and approve pending petitions
          </p>
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
              <p className="text-gray-600 font-medium">
                Review and approve pending petitions
              </p>
            </div>
          </div>
          {petitions.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <i className="fas fa-clipboard-check text-6xl text-gray-300 mb-4"></i>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur"></div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No petitions to approve
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                You&apos;re all caught up for now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {petitions.map((petition) => (
                <div
                  key={petition._id}
                  className="border border-gray-200 rounded-2xl p-5 bg-gradient-to-r from-gray-50 to-white hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                          <i className="fas fa-file-alt text-blue-600"></i>
                        </div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          {petition.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 inline-flex items-center gap-2 text-xs font-semibold rounded-full bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200">
                          <i className="fas fa-globe"></i>
                          {petition.country}
                        </span>
                        <span className="px-3 py-1 inline-flex items-center gap-2 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-200">
                          <i className="fas fa-calendar"></i>
                          {new Date(petition.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                          Problem
                        </label>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                            {petition.petitionDetails?.problem}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                          Solution
                        </label>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                            {petition.petitionDetails?.solution}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => approvePetition(petition._id)}
                      className="ml-4 px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 font-medium"
                    >
                      <i className="fas fa-check-circle"></i>
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetitionApprovalPage;
