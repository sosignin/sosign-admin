"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BannerManagementPage() {
  const router = useRouter();
  const [bannerPetitions, setBannerPetitions] = useState([]);
  const [allPetitions, setAllPetitions] = useState([]);
  const [loadingBanner, setLoadingBanner] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("banner"); // 'banner' or 'all'

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch active banner petitions
  const fetchBannerPetitions = async () => {
    try {
      setLoadingBanner(true);
      const res = await fetch(`${apiUrl}/api/admin/petitions/banner`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setBannerPetitions(data.petitions || []);
      }
    } catch (err) {
      console.error("Failed to fetch banner petitions:", err);
    } finally {
      setLoadingBanner(false);
    }
  };

  // Fetch all petitions for selection
  const fetchAllPetitions = async (pageNum = 1, searchTerm = "") => {
    try {
      setLoadingAll(true);
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
      });

      const res = await fetch(`${apiUrl}/api/admin/petitions?${queryParams}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAllPetitions(data.petitions || []);
        setPage(data.currentPage);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch all petitions:", err);
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    fetchBannerPetitions();
    fetchAllPetitions(1, search);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAllPetitions(1, search);
  };

  // Toggle banner status (Add / Remove)
  const handleToggleBanner = async (petitionId, currentFeaturedStatus, currentOrder = 0) => {
    try {
      setActionLoading(petitionId);
      const newStatus = !currentFeaturedStatus;
      const res = await fetch(`${apiUrl}/api/admin/petitions/${petitionId}/banner-feature`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          isFeaturedInBanner: newStatus,
          bannerOrder: currentOrder,
        }),
      });

      if (res.ok) {
        await Promise.all([fetchBannerPetitions(), fetchAllPetitions(page, search)]);
      } else {
        const err = await res.json();
        alert("Failed: " + (err.message || "Error updating banner status"));
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Move banner petition order Up or Down
  const handleMoveOrder = async (petitionId, currentOrder, direction) => {
    const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;
    try {
      setActionLoading(petitionId);
      const res = await fetch(`${apiUrl}/api/admin/petitions/${petitionId}/banner-feature`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          isFeaturedInBanner: true,
          bannerOrder: newOrder,
        }),
      });

      if (res.ok) {
        await fetchBannerPetitions();
      }
    } catch (err) {
      console.error("Error moving banner order:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-rose-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <i className="fas fa-images"></i> Homepage Banner Slider Management
            </h1>
            <p className="text-purple-100 text-sm mt-1">
              Select and prioritize petitions to display first in the main website hero banner slider.
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/30">
            <span className="text-2xl font-black">{bannerPetitions.length}</span>
            <span className="block text-xs uppercase tracking-wider font-semibold text-purple-100">Featured in Banner</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab("banner")}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "banner"
              ? "border-pink-600 text-pink-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fas fa-star"></i> Featured Banner Petitions ({bannerPetitions.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "all"
              ? "border-pink-600 text-pink-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fas fa-search"></i> Select from All Petitions
        </button>
      </div>

      {/* Tab 1: Active Banner Petitions */}
      {activeTab === "banner" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-list-ol text-pink-600"></i> Active Banner Slider Order
            </h2>
            <button
              onClick={() => setActiveTab("all")}
              className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <i className="fas fa-plus"></i> Add Petition to Banner
            </button>
          </div>

          {loadingBanner ? (
            <div className="py-12 text-center text-gray-500">
              <i className="fas fa-spinner fa-spin text-2xl mb-2 text-pink-600"></i>
              <p className="text-sm font-semibold">Loading banner petitions...</p>
            </div>
          ) : bannerPetitions.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <i className="fas fa-images text-4xl text-gray-300 mb-3"></i>
              <p className="font-bold text-gray-700">No petitions featured in banner yet</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Click below to search all petitions and feature them in the banner slider.</p>
              <button
                onClick={() => setActiveTab("all")}
                className="px-5 py-2.5 text-xs font-bold bg-pink-600 text-white rounded-xl shadow hover:bg-pink-700 transition-colors"
              >
                Browse Petitions & Add to Banner
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Image</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Starter</th>
                    <th className="p-3">Signatures</th>
                    <th className="p-3 text-center">Re-order</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bannerPetitions.map((petition, idx) => (
                    <tr key={petition._id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="p-3 font-black text-pink-600 text-base">#{idx + 1}</td>
                      <td className="p-3">
                        {petition.petitionDetails?.image ? (
                          <img
                            src={petition.petitionDetails.image}
                            alt=""
                            className="w-14 h-10 object-cover rounded-lg shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 font-bold">
                            No Img
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-gray-900 line-clamp-1">{petition.title}</p>
                        <span className="text-[11px] text-gray-400">{petition.country} • {petition.categories?.join(", ")}</span>
                      </td>
                      <td className="p-3 text-xs font-medium text-gray-700">
                        {petition.petitionStarter?.name || petition.petitionStarter?.user?.name || "N/A"}
                      </td>
                      <td className="p-3 font-bold text-purple-700">
                        {petition.numberOfSignatures || 0}
                      </td>
                      <td className="p-3 text-center space-x-1">
                        <button
                          onClick={() => handleMoveOrder(petition._id, petition.bannerOrder || idx, "up")}
                          disabled={idx === 0 || actionLoading === petition._id}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-purple-100 text-gray-700 rounded disabled:opacity-30"
                          title="Move Up"
                        >
                          <i className="fas fa-arrow-up"></i>
                        </button>
                        <button
                          onClick={() => handleMoveOrder(petition._id, petition.bannerOrder || idx, "down")}
                          disabled={idx === bannerPetitions.length - 1 || actionLoading === petition._id}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-purple-100 text-gray-700 rounded disabled:opacity-30"
                          title="Move Down"
                        >
                          <i className="fas fa-arrow-down"></i>
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleBanner(petition._id, true, petition.bannerOrder)}
                          disabled={actionLoading === petition._id}
                          className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-xl transition-all"
                        >
                          {actionLoading === petition._id ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <>
                              <i className="fas fa-trash-alt mr-1"></i> Remove
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Search & Select from All Petitions */}
      {activeTab === "all" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-search text-purple-600"></i> Search Petitions to Feature in Banner
            </h2>

            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search petition title or details..."
                className="px-3.5 py-2 text-xs border border-gray-300 rounded-xl w-64 outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow"
              >
                Search
              </button>
            </form>
          </div>

          {loadingAll ? (
            <div className="py-12 text-center text-gray-500">
              <i className="fas fa-spinner fa-spin text-2xl mb-2 text-purple-600"></i>
              <p className="text-sm font-semibold">Loading petitions...</p>
            </div>
          ) : allPetitions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="font-bold">No petitions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="p-3">Image</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Starter</th>
                    <th className="p-3">Signatures</th>
                    <th className="p-3">Banner Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allPetitions.map((petition) => {
                    const isFeatured = Boolean(petition.isFeaturedInBanner);
                    return (
                      <tr key={petition._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          {petition.petitionDetails?.image ? (
                            <img
                              src={petition.petitionDetails.image}
                              alt=""
                              className="w-14 h-10 object-cover rounded-lg shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 font-bold">
                              No Img
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-gray-900 line-clamp-1">{petition.title}</p>
                          <span className="text-[11px] text-gray-400">{petition.country} • {petition.categories?.join(", ")}</span>
                        </td>
                        <td className="p-3 text-xs font-medium text-gray-700">
                          {petition.petitionStarter?.name || petition.petitionStarter?.user?.name || "N/A"}
                        </td>
                        <td className="p-3 font-bold text-purple-700">
                          {petition.numberOfSignatures || 0}
                        </td>
                        <td className="p-3">
                          {isFeatured ? (
                            <span className="px-2.5 py-1 text-[10px] font-extrabold bg-pink-100 text-pink-700 rounded-full border border-pink-200 inline-flex items-center gap-1">
                              <i className="fas fa-star text-pink-600"></i> Featured in Banner
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded-full inline-block">
                              Not Featured
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleToggleBanner(petition._id, isFeatured, petition.bannerOrder)}
                            disabled={actionLoading === petition._id}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm ${
                              isFeatured
                                ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                            }`}
                          >
                            {actionLoading === petition._id ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : isFeatured ? (
                              <>
                                <i className="fas fa-times mr-1"></i> Remove
                              </>
                            ) : (
                              <>
                                <i className="fas fa-plus mr-1"></i> Add to Banner
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchAllPetitions(page - 1, search)}
                    disabled={page <= 1}
                    className="px-3 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchAllPetitions(page + 1, search)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
