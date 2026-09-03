"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/utils/api";

export default function PetitionsPage() {
  const router = useRouter();
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPetitions, setTotalPetitions] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  // SEO Slug modal state
  const [editingSlugPetition, setEditingSlugPetition] = useState(null);
  const [slugInputValue, setSlugInputValue] = useState("");
  const [slugSaveLoading, setSlugSaveLoading] = useState(false);
  const [slugModalError, setSlugModalError] = useState("");
  const [slugModalSuccess, setSlugModalSuccess] = useState("");

  // Mother-Child petitions hierarchy state
  const [showHierarchyManager, setShowHierarchyManager] = useState(true);
  const [hierarchyData, setHierarchyData] = useState({ clusters: [], allPetitions: [] });
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [selectedMotherId, setSelectedMotherId] = useState("");
  const [selectedChildId, setSelectedChildId] = useState("");
  const [motherSearchQuery, setMotherSearchQuery] = useState("");
  const [childSearchQuery, setChildSearchQuery] = useState("");
  const [linkActionLoading, setLinkActionLoading] = useState(false);
  const [linkActionMessage, setLinkActionMessage] = useState({ text: "", type: "" });
  const [unlinkLoadingId, setUnlinkLoadingId] = useState(null);

  // Fetch petitions from backend
  const fetchPetitions = async (page = 1, searchTerm = "", country = "") => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(country && { country: country }),
      });

      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/petitions?${queryParams}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch petitions");
      }

      const data = await response.json();
      setPetitions(data.petitions);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalPetitions(data.totalPetitions);
    } catch (err) {
      setError("Failed to load petitions: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete petition
  const handleDeletePetition = async (petitionId, petitionTitle) => {
    if (!confirm(`Are you sure you want to delete "${petitionTitle}"?`)) {
      return;
    }

    try {
      setDeleteLoading(petitionId);
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/admin/petitions/${petitionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to delete petition");
      }

      // Refresh the petitions list
      await fetchPetitions(currentPage, search, selectedCountry);
      alert("Petition deleted successfully!");
    } catch (err) {
      alert("Failed to delete petition: " + err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Toggle banner featured status
  const handleToggleBanner = async (e, petitionId, currentStatus) => {
    e.stopPropagation();
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/petitions/${petitionId}/banner-feature`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFeaturedInBanner: !currentStatus }),
        }
      );
      if (res.ok) {
        await fetchPetitions(currentPage, search, selectedCountry);
      }
    } catch (err) {
      console.error("Error toggling banner status:", err);
    }
  };

  // Open SEO Slug modal
  const handleOpenSlugModal = (e, petition) => {
    e.stopPropagation();
    setEditingSlugPetition(petition);
    setSlugInputValue(petition.slug || "");
    setSlugModalError("");
    setSlugModalSuccess("");
  };

  // Reset slug from title in modal
  const handleResetModalSlugFromTitle = () => {
    if (editingSlugPetition?.title) {
      const auto = editingSlugPetition.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlugInputValue(auto);
    }
  };

  // Save SEO Slug from modal
  const handleSaveModalSlug = async (e) => {
    e.preventDefault();
    if (!editingSlugPetition) return;

    setSlugSaveLoading(true);
    setSlugModalError("");
    setSlugModalSuccess("");

    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/petitions/${editingSlugPetition._id}/slug`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: slugInputValue }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update SEO slug");

      setSlugModalSuccess("SEO URL slug updated successfully!");
      await fetchPetitions(currentPage, search, selectedCountry);
      setTimeout(() => {
        setEditingSlugPetition(null);
      }, 1200);
    } catch (err) {
      setSlugModalError(err.message);
    } finally {
      setSlugSaveLoading(false);
    }
  };

  // Toggle school stall map visibility
  const handleToggleSchoolStallMap = async (e, petitionId, currentStatus) => {
    e.stopPropagation();
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/petitions/${petitionId}/school-stall-map`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ showSchoolStallMap: !currentStatus }),
        }
      );
      if (res.ok) {
        await fetchPetitions(currentPage, search, selectedCountry);
      }
    } catch (err) {
      console.error("Failed to update school stall map status:", err);
    }
  };

  // Handle petition click to view details
  const handlePetitionClick = (petitionId) => {
    router.push(`/dashboard/petitions/${petitionId}`);
  };

  // Handle PDF download
  const handleDownloadPetition = async (petitionId, petitionTitle) => {
    try {
      setDownloadLoading(petitionId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        }/api/download-requests/admin/download/${petitionId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to download petition PDF");
      }

      // Get the PDF blob from the response
      const blob = await response.blob();

      // Create a download link for the PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `petition-${petitionId}-admin-export.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download petition: " + err.message);
    } finally {
      setDownloadLoading(null);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPetitions(1, search, selectedCountry);
  };

  // Handle country filter
  const handleCountryChange = (e) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setCurrentPage(1);
    fetchPetitions(1, search, country);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get unique countries for filter
  const countries = [...new Set(petitions.map((p) => p.country))].sort();

  // Fetch Mother-Child hierarchy data
  const fetchHierarchy = async () => {
    try {
      setHierarchyLoading(true);
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/petitions-hierarchy/mother-child`
      );
      if (res.ok) {
        const data = await res.json();
        setHierarchyData(data);
      }
    } catch (err) {
      console.error("Failed to fetch hierarchy:", err);
    } finally {
      setHierarchyLoading(false);
    }
  };

  // Link Child to Mother
  const handleLinkMotherChild = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedMotherId) {
      setLinkActionMessage({ text: "Please select a primary Mother Petition first.", type: "error" });
      return;
    }
    if (!selectedChildId) {
      setLinkActionMessage({ text: "Please select a Child Petition to connect.", type: "error" });
      return;
    }
    if (selectedMotherId === selectedChildId) {
      setLinkActionMessage({ text: "A petition cannot be linked as its own child.", type: "error" });
      return;
    }

    try {
      setLinkActionLoading(true);
      setLinkActionMessage({ text: "", type: "" });

      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/petitions/link-mother-child`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motherPetitionId: selectedMotherId,
            childPetitionIds: [selectedChildId],
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to link petitions");
      }

      setLinkActionMessage({ text: data.message, type: "success" });
      setSelectedChildId("");
      setChildSearchQuery("");

      await Promise.all([
        fetchHierarchy(),
        fetchPetitions(currentPage, search, selectedCountry),
      ]);
    } catch (err) {
      setLinkActionMessage({ text: err.message, type: "error" });
    } finally {
      setLinkActionLoading(false);
    }
  };

  // Unlink a Child petition
  const handleUnlinkChild = async (childId, childTitle) => {
    if (!confirm(`Are you sure you want to unlink "${childTitle || "this child petition"}" from its mother petition?`)) {
      return;
    }

    try {
      setUnlinkLoadingId(childId);
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/petitions/${childId}/unlink-mother`,
        { method: "PUT" }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to unlink petition");
      }

      setLinkActionMessage({ text: data.message, type: "success" });

      await Promise.all([
        fetchHierarchy(),
        fetchPetitions(currentPage, search, selectedCountry),
      ]);
    } catch (err) {
      alert("Failed to unlink petition: " + err.message);
    } finally {
      setUnlinkLoadingId(null);
    }
  };

  // Preselect petition from row action
  const handlePreselectForHierarchy = (e, petition, asRole = "mother") => {
    e.stopPropagation();
    setShowHierarchyManager(true);
    if (asRole === "mother") {
      setSelectedMotherId(petition._id);
    } else {
      setSelectedChildId(petition._id);
    }
    const el = document.getElementById("mother-child-manager-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Filtered dropdown options for Mother selection
  const filteredMotherOptions = (hierarchyData.allPetitions || []).filter((p) => {
    if (motherSearchQuery.trim()) {
      return p.title.toLowerCase().includes(motherSearchQuery.toLowerCase());
    }
    return true;
  });

  // Filtered dropdown options for Child selection
  const filteredChildOptions = (hierarchyData.allPetitions || []).filter((p) => {
    if (selectedMotherId && p._id === selectedMotherId) return false;
    if (childSearchQuery.trim()) {
      return p.title.toLowerCase().includes(childSearchQuery.toLowerCase());
    }
    return true;
  });

  const selectedMotherPetition = (hierarchyData.allPetitions || []).find((p) => p._id === selectedMotherId);
  const selectedChildPetition = (hierarchyData.allPetitions || []).find((p) => p._id === selectedChildId);
  const currentlyLinkedChildrenForSelectedMother =
    (hierarchyData.clusters || []).find((c) => c._id === selectedMotherId)?.children ||
    (hierarchyData.allPetitions || []).filter(
      (p) => p.motherPetition?._id === selectedMotherId || p.motherPetition === selectedMotherId
    );

  useEffect(() => {
    fetchPetitions();
    fetchHierarchy();
  }, []);

  if (loading && petitions.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Petitions Management</h1>
          <p className="text-gray-600 font-medium">Manage and monitor all petitions</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Petitions Management</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
            <i className="fas fa-file-alt text-blue-600"></i>
            <span className="text-gray-700 font-medium">Total: {totalPetitions} petitions</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
              <i className="fas fa-search text-green-600 text-lg"></i>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Search & Filter</h3>
          </div>
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400 group-focus-within:text-green-500 transition-colors"></i>
              </div>
              <input
                type="text"
                placeholder="Search petitions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg"
              />
            </div>
            <div className="sm:w-48 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-globe text-gray-400 group-focus-within:text-blue-500 transition-colors"></i>
              </div>
              <select
                value={selectedCountry}
                onChange={handleCountryChange}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center gap-2"
            >
              <i className="fas fa-search"></i>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Mother & Child Petitions Hierarchy Manager Section */}
      <div id="mother-child-manager-section" className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full -translate-y-12 translate-x-12 pointer-events-none"></div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white shadow-md shadow-purple-500/20">
              <i className="fas fa-sitemap text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-gray-900">Mother & Child Petitions Hierarchy</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  {hierarchyData.clusters?.length || 0} Mother Campaign{hierarchyData.clusters?.length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Designate any petition as a primary Mother Campaign and link related sub-petitions to combine signatures and community reach.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => fetchHierarchy()}
              disabled={hierarchyLoading}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Refresh hierarchy"
            >
              <i className={`fas fa-sync-alt ${hierarchyLoading ? "fa-spin" : ""}`}></i>
              Refresh
            </button>
            <button
              onClick={() => setShowHierarchyManager(!showHierarchyManager)}
              className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <i className={`fas ${showHierarchyManager ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
              {showHierarchyManager ? "Collapse" : "Expand Section"}
            </button>
          </div>
        </div>

        {showHierarchyManager && (
          <div className="mt-6 space-y-6 animate-in fade-in duration-200">
            {/* Feedback notification message */}
            {linkActionMessage.text && (
              <div
                className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold border ${
                  linkActionMessage.type === "success"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <i className={`fas ${linkActionMessage.type === "success" ? "fa-check-circle text-green-600" : "fa-exclamation-circle text-red-600"} text-sm`}></i>
                  <span>{linkActionMessage.text}</span>
                </div>
                <button
                  onClick={() => setLinkActionMessage({ text: "", type: "" })}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

            {/* Linking Interface - 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gradient-to-br from-slate-50 to-purple-50/30 p-5 rounded-2xl border border-purple-100/60">
              {/* Step 1: Select Mother Petition */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <i className="fas fa-crown text-amber-500"></i>
                    <span>Select Mother Petition (Primary Campaign)</span>
                  </label>
                  {selectedMotherId && (
                    <button
                      onClick={() => setSelectedMotherId("")}
                      className="text-[11px] text-gray-400 hover:text-red-500 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Search input for Mother dropdown */}
                <div className="relative">
                  <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                  <input
                    type="text"
                    placeholder="Filter mother petition by title..."
                    value={motherSearchQuery}
                    onChange={(e) => setMotherSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>

                {/* Dropdown for Mother selection */}
                <select
                  value={selectedMotherId}
                  onChange={(e) => setSelectedMotherId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none font-medium text-gray-800"
                >
                  <option value="">-- Choose Mother Petition --</option>
                  {filteredMotherOptions.map((pet) => (
                    <option key={pet._id} value={pet._id}>
                      {pet.title} (Sigs: {pet.numberOfSignatures || 0}) {pet.motherPetition ? "• [Currently Child]" : ""}
                    </option>
                  ))}
                </select>

                {/* Selected Mother Card Preview */}
                {selectedMotherPetition && (
                  <div className="p-3.5 bg-white rounded-xl border border-purple-200/80 shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 mb-1">
                          <i className="fas fa-crown text-amber-500 text-[9px]"></i> Mother Campaign
                        </span>
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-2">
                          {selectedMotherPetition.title}
                        </h4>
                      </div>
                      <span className="text-xs font-extrabold text-purple-600 shrink-0 bg-purple-50 px-2 py-1 rounded-lg">
                        {(selectedMotherPetition.numberOfSignatures || 0).toLocaleString()} sigs
                      </span>
                    </div>

                    {/* Currently linked children under this mother */}
                    {currentlyLinkedChildrenForSelectedMother.length > 0 ? (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Currently Linked Children ({currentlyLinkedChildrenForSelectedMother.length}):</span>
                        </p>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                          {currentlyLinkedChildrenForSelectedMother.map((child) => (
                            <div
                              key={child._id}
                              className="p-2 rounded-lg bg-gray-50 hover:bg-purple-50/50 border border-gray-200/70 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-800 truncate text-[11px]">{child.title}</p>
                                <span className="text-[10px] text-gray-500">{(child.numberOfSignatures || 0).toLocaleString()} signatures</span>
                              </div>
                              <button
                                onClick={() => handleUnlinkChild(child._id, child.title)}
                                disabled={unlinkLoadingId === child._id}
                                className="px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold shrink-0 transition-colors"
                                title="Unlink this child"
                              >
                                {unlinkLoadingId === child._id ? <i className="fas fa-spinner fa-spin"></i> : "Unlink"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic pt-1 border-t border-gray-100">
                        No child petitions linked yet. Select a child petition on the right to link.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Select Child Petition */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <i className="fas fa-link text-indigo-500"></i>
                    <span>Select Child Petition (Sub-Petition to Link)</span>
                  </label>
                  {selectedChildId && (
                    <button
                      onClick={() => setSelectedChildId("")}
                      className="text-[11px] text-gray-400 hover:text-red-500 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Search input for Child dropdown */}
                <div className="relative">
                  <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                  <input
                    type="text"
                    placeholder="Filter child petition by title..."
                    value={childSearchQuery}
                    onChange={(e) => setChildSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>

                {/* Dropdown for Child selection */}
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none font-medium text-gray-800"
                >
                  <option value="">-- Choose Child Petition to Link --</option>
                  {filteredChildOptions.map((pet) => (
                    <option key={pet._id} value={pet._id}>
                      {pet.title} (Sigs: {pet.numberOfSignatures || 0}) {pet.motherPetition ? "• [Linked to another Mother]" : ""}
                    </option>
                  ))}
                </select>

                {/* Selected Child Card Preview */}
                {selectedChildPetition && (
                  <div className="p-3.5 bg-white rounded-xl border border-indigo-200/80 shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 mb-1">
                          <i className="fas fa-link text-indigo-500 text-[9px]"></i> Sub-Petition
                        </span>
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-2">
                          {selectedChildPetition.title}
                        </h4>
                      </div>
                      <span className="text-xs font-extrabold text-indigo-600 shrink-0 bg-indigo-50 px-2 py-1 rounded-lg">
                        {(selectedChildPetition.numberOfSignatures || 0).toLocaleString()} sigs
                      </span>
                    </div>

                    {selectedChildPetition.motherPetition && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <i className="fas fa-info-circle mr-1"></i>
                        Notice: This petition is currently linked to &quot;{selectedChildPetition.motherPetition.title || "another mother"}&quot;. Linking it here will transfer it to the new Mother Petition.
                      </p>
                    )}
                  </div>
                )}

                {/* Link Action Button */}
                <button
                  type="button"
                  onClick={handleLinkMotherChild}
                  disabled={linkActionLoading || !selectedMotherId || !selectedChildId}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 transform active:scale-98"
                >
                  {linkActionLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Linking Petitions...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-link"></i>
                      <span>Link Child to Mother Petition</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active Mother-Child Clusters View */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <i className="fas fa-layer-group text-purple-600"></i>
                <span>Active Mother Campaigns Overview ({hierarchyData.clusters?.length || 0})</span>
              </h4>

              {hierarchyData.clusters && hierarchyData.clusters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hierarchyData.clusters.map((cluster) => (
                    <div
                      key={cluster._id}
                      className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            👑 Mother Campaign
                          </span>
                          <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {(cluster.combinedSignatures || 0).toLocaleString()} combined sigs
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-gray-900 line-clamp-2 leading-snug">
                          {cluster.title}
                        </h5>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {cluster.childrenCount} linked sub-petition{cluster.childrenCount === 1 ? "" : "s"}
                        </p>
                      </div>

                      {/* Sub-petitions pill list */}
                      <div className="space-y-1.5 pt-2 border-t border-gray-100 max-h-36 overflow-y-auto custom-scrollbar">
                        {cluster.children?.map((child) => (
                          <div
                            key={child._id}
                            className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-gray-50 text-[11px]"
                          >
                            <span className="truncate font-medium text-gray-700 flex-1" title={child.title}>
                              • {child.title}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold shrink-0">
                              {(child.numberOfSignatures || 0).toLocaleString()}
                            </span>
                            <button
                              onClick={() => handleUnlinkChild(child._id, child.title)}
                              disabled={unlinkLoadingId === child._id}
                              className="text-gray-400 hover:text-red-600 p-0.5"
                              title="Unlink"
                            >
                              <i className="fas fa-times text-[10px]"></i>
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Select this mother to add more children */}
                      <button
                        onClick={() => {
                          setSelectedMotherId(cluster._id);
                          const el = document.getElementById("mother-child-manager-section");
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="w-full py-1.5 rounded-lg text-center text-xs font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-purple-200 transition-colors"
                      >
                        + Add Child to this Mother
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 px-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500">
                  <i className="fas fa-info-circle text-purple-500 mb-1 text-base block"></i>
                  No Mother & Child relationships linked yet. Select a primary Mother Petition and Child Petition above to establish your first cluster!
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Petitions Table */}
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
                    <i className="fas fa-globe text-green-500"></i>
                    Country
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-signature text-purple-500"></i>
                    Signatures
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-user text-orange-500"></i>
                    Creator
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-calendar text-indigo-500"></i>
                    Created
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
                    <i className="fas fa-cog text-red-500"></i>
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {petitions.map((petition) => (
                <tr
                  key={petition._id}
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-200"
                  onClick={() => handlePetitionClick(petition._id)}
                >
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {petition.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {petition.petitionDetails?.problem
                          ? petition.petitionDetails.problem.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim().substring(0, 100)
                          : ""}...
                      </p>
                      {petition.requestedSigners?.length > 0 && (
                        <p className="text-xs text-blue-600 font-semibold mt-1 truncate">
                          <i className="fas fa-bullseye mr-1 text-[10px]"></i>
                          Target Signers: {petition.requestedSigners.map(s => s.name).join(", ")}
                        </p>
                      )}

                      {/* Mother & Child Hierarchy Badges */}
                      {petition.subPetitionsCount > 0 && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200">
                            <i className="fas fa-crown text-amber-500 text-[9px]"></i>
                            Mother Campaign ({petition.subPetitionsCount} children)
                          </span>
                        </div>
                      )}
                      {petition.motherPetition && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 truncate max-w-[240px]">
                            <i className="fas fa-link text-blue-600 text-[9px]"></i>
                            Child of: {petition.motherPetition.title || "Mother Campaign"}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200">
                      <i className="fas fa-globe mr-1"></i>
                      {petition.country}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <i className="fas fa-signature text-purple-500 mr-2"></i>
                      <span className="font-semibold">{petition.numberOfSignatures}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {petition.petitionStarter.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {petition.petitionStarter.user?.email || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(petition.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {petition.approved ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200">
                        <i className="fas fa-check-circle mr-1"></i>
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-200">
                        <i className="fas fa-clock mr-1"></i>
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {/* Download PDF Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          handleDownloadPetition(petition._id, petition.title);
                        }}
                        disabled={downloadLoading === petition._id}
                        className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-2 text-sm font-medium"
                        title="Download Petition PDF"
                      >
                        {downloadLoading === petition._id ? (
                          <>
                            <i className="fas fa-spinner animate-spin"></i>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-download"></i>
                            PDF
                          </>
                        )}
                      </button>
                      {/* Banner Feature Toggle Button */}
                      <button
                        onClick={(e) => handleToggleBanner(e, petition._id, petition.isFeaturedInBanner)}
                        className={`px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm flex items-center gap-1.5 ${
                          petition.isFeaturedInBanner
                            ? "bg-pink-600 text-white hover:bg-pink-700"
                            : "bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-600 border border-gray-300"
                        }`}
                        title={petition.isFeaturedInBanner ? "Remove from Banner" : "Add to Homepage Banner Slider"}
                      >
                        <i className="fas fa-star text-xs"></i>
                        {petition.isFeaturedInBanner ? "Banner" : "+ Banner"}
                      </button>
                      {/* Edit SEO Slug Button */}
                      <button
                        onClick={(e) => handleOpenSlugModal(e, petition)}
                        className="px-3 py-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
                        title="Edit SEO URL Slug"
                      >
                        <i className="fas fa-link text-xs"></i>
                        SEO Slug
                      </button>
                      {/* School Stall Map Toggle Button */}
                      <button
                        onClick={(e) => handleToggleSchoolStallMap(e, petition._id, petition.showSchoolStallMap)}
                        className={`px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm flex items-center gap-1.5 ${
                          petition.showSchoolStallMap
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-300"
                        }`}
                        title={petition.showSchoolStallMap ? "Remove School Stall Map" : "Add School Stall Map to this Petition"}
                      >
                        <i className="fas fa-school text-xs"></i>
                        {petition.showSchoolStallMap ? "School Map" : "+ School Map"}
                      </button>
                      {/* Link Parent/Child Hierarchy Button */}
                      <button
                        onClick={(e) => handlePreselectForHierarchy(e, petition, petition.motherPetition ? "child" : "mother")}
                        className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        title="Link as Mother Campaign or Child Petition"
                      >
                        <i className="fas fa-sitemap text-xs text-purple-600"></i>
                        Link Parent/Child
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          handleDeletePetition(petition._id, petition.title);
                        }}
                        disabled={deleteLoading === petition._id}
                        className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-2 text-sm font-medium"
                        title="Delete Petition"
                      >
                        {deleteLoading === petition._id ? (
                          <>
                            <i className="fas fa-spinner animate-spin"></i>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-trash"></i>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {petitions.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="relative inline-block">
              <i className="fas fa-file-alt text-6xl text-gray-300 mb-4"></i>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur"></div>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No petitions found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
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
                fetchPetitions(prevPage, search, selectedCountry);
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
                fetchPetitions(nextPage, search, selectedCountry);
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
                  {Math.min(currentPage * 10, totalPetitions)}
                </span>{" "}
                of <span className="font-medium">{totalPetitions}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => {
                    const prevPage = currentPage - 1;
                    setCurrentPage(prevPage);
                    fetchPetitions(prevPage, search, selectedCountry);
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
                          fetchPetitions(page, search, selectedCountry);
                        }}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 ${page === currentPage
                          ? "z-10 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500 text-blue-600 shadow-md"
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
                    fetchPetitions(nextPage, search, selectedCountry);
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
      {/* Edit SEO Slug Modal */}
      {editingSlugPetition && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="fas fa-link text-cyan-600"></i>
                  Edit SEO URL Slug
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update web address permalink for search engines.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlugPetition(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <i className="fas fa-times text-base"></i>
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-gray-100 text-xs text-gray-600">
              <span className="font-semibold text-slate-700">Petition: </span>
              {editingSlugPetition.title}
            </div>

            <form onSubmit={handleSaveModalSlug} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    URL Slug (SEO Permalink)
                  </label>
                  <button
                    type="button"
                    onClick={handleResetModalSlugFromTitle}
                    className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 underline cursor-pointer"
                  >
                    Reset from Title
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-gray-300 rounded-xl px-3 py-2.5 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                  <span className="text-xs font-semibold text-gray-400 select-none whitespace-nowrap">
                    sosign.in/currentpetitions/
                  </span>
                  <input
                    type="text"
                    value={slugInputValue}
                    onChange={(e) => setSlugInputValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-"))}
                    placeholder="my-custom-seo-slug"
                    className="w-full bg-transparent outline-none text-xs font-mono font-medium text-slate-800 placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>

              {slugModalSuccess && (
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <i className="fas fa-check-circle"></i> {slugModalSuccess}
                </p>
              )}
              {slugModalError && (
                <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
                  <i className="fas fa-exclamation-circle"></i> {slugModalError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingSlugPetition(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={slugSaveLoading}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {slugSaveLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                  Save SEO Slug
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
