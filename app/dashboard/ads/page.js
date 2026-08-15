"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";

export default function AdsManagementPage() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        link: "",
        position: "sidebar",
        isActive: true,
        priority: 0,
        startDate: "",
        endDate: "",
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Fetch all ads
    const fetchAds = async () => {
        try {
            setLoading(true);
            const res = await authFetch(`${API_URL}/api/ads`);
            const data = await res.json();
            if (data.success) {
                setAds(data.ads);
            } else {
                setError(data.message || "Failed to fetch ads");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    // Handle form input changes
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            link: "",
            position: "sidebar",
            isActive: true,
            priority: 0,
            startDate: "",
            endDate: "",
        });
        setImageFile(null);
        setImagePreview(null);
        setEditingAd(null);
    };

    // Open edit modal
    const handleEdit = (ad) => {
        setEditingAd(ad);
        setFormData({
            title: ad.title || "",
            description: ad.description || "",
            link: ad.link || "",
            position: ad.position || "sidebar",
            isActive: ad.isActive ?? true,
            priority: ad.priority || 0,
            startDate: ad.startDate ? new Date(ad.startDate).toISOString().split("T")[0] : "",
            endDate: ad.endDate ? new Date(ad.endDate).toISOString().split("T")[0] : "",
        });
        setImagePreview(ad.image || ad.imageUrl);
        setShowModal(true);
    };

    // Submit form (create or edit)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("title", formData.title);
            formDataToSend.append("description", formData.description);
            formDataToSend.append("link", formData.link);
            formDataToSend.append("position", formData.position);
            formDataToSend.append("isActive", formData.isActive);
            formDataToSend.append("priority", formData.priority);

            if (formData.startDate) {
                formDataToSend.append("startDate", formData.startDate);
            }
            if (formData.endDate) {
                formDataToSend.append("endDate", formData.endDate);
            }

            if (imageFile) {
                formDataToSend.append("image", imageFile);
            }

            const url = editingAd
                ? `${API_URL}/api/ads/${editingAd._id}`
                : `${API_URL}/api/ads`;
            const method = editingAd ? "PUT" : "POST";

            const res = await authFetch(url, {
                method,
                body: formDataToSend,
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setShowModal(false);
                resetForm();
                fetchAds();
            } else {
                alert(data.message || "Failed to save ad");
            }
        } catch (err) {
            alert("Error saving ad: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Delete ad
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this ad?")) return;

        try {
            const res = await authFetch(`${API_URL}/api/ads/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                fetchAds();
            } else {
                alert(data.message || "Failed to delete ad");
            }
        } catch (err) {
            alert("Error deleting ad: " + err.message);
        }
    };

    // Toggle ad status
    const handleToggleStatus = async (id) => {
        try {
            const res = await authFetch(`${API_URL}/api/ads/${id}/toggle`, {
                method: "PUT",
            });
            const data = await res.json();

            if (data.success) {
                fetchAds();
            } else {
                alert(data.message || "Failed to toggle status");
            }
        } catch (err) {
            alert("Error toggling status: " + err.message);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-pink-600 via-indigo-700 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
                        <i className="fas fa-[#F43676] fa-ad"></i> Ads Management
                    </h1>
                    <p className="text-pink-100 text-sm mt-1">
                        Create and manage active advertisement banners across sidebar, header, and inline placements.
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="px-5 py-3 bg-gradient-to-r from-pink-500 to-[#F43676] hover:from-[#F43676] hover:to-pink-600 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-pink-500/20 flex items-center gap-2 shrink-0"
                >
                    <i className="fas fa-plus-circle text-base"></i>
                    <span>Create New Ad</span>
                </button>
            </div>

            {/* Error state */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={fetchAds} className="text-xs bg-red-100 px-3 py-1 rounded-lg hover:bg-red-200">Retry</button>
                </div>
            )}

            {/* Ads Grid */}
            {loading ? (
                <div className="py-16 text-center text-gray-500">
                    <i className="fas fa-spinner fa-spin text-3xl text-pink-600 mb-2"></i>
                    <p className="text-sm font-semibold">Loading advertisement banners...</p>
                </div>
            ) : ads.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-100 shadow-sm space-y-2">
                    <i className="fas fa-ad text-4xl text-gray-300 mb-2"></i>
                    <h3 className="font-bold text-gray-800 text-lg">No Advertisements Created</h3>
                    <p className="text-xs text-gray-500">Click &apos;Create New Ad&apos; above to publish your first banner!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.map((ad) => (
                        <div
                            key={ad._id}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                            <div className="relative h-44 bg-gray-100 overflow-hidden">
                                {ad.image || ad.imageUrl ? (
                                    <img
                                        src={ad.image || ad.imageUrl}
                                        alt={ad.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <i className="fas fa-image text-3xl"></i>
                                    </div>
                                )}
                                {/* Active Badge */}
                                <span
                                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                        ad.isActive
                                            ? "bg-green-500 text-white shadow-xs"
                                            : "bg-red-500 text-white shadow-xs"
                                    }`}
                                >
                                    {ad.isActive ? "Active" : "Inactive"}
                                </span>
                                {/* Position Badge */}
                                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-900/80 backdrop-blur-md text-white capitalize shadow-xs">
                                    {ad.position}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                    <h3 className="text-base font-extrabold text-gray-900 mb-1 truncate">
                                        {ad.title}
                                    </h3>
                                    {ad.description && (
                                        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                                            {ad.description}
                                        </p>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-xs font-bold text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                    <span className="flex items-center gap-1">
                                        <i className="fas fa-eye text-blue-500"></i> {ad.impressions || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <i className="fas fa-mouse-pointer text-pink-500"></i> {ad.clicks || 0}
                                    </span>
                                    <span className="flex items-center gap-1 ml-auto">
                                        <i className="fas fa-sort-amount-up text-amber-500"></i> P-{ad.priority}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        onClick={() => handleToggleStatus(ad._id)}
                                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                                            ad.isActive
                                                ? "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                                                : "bg-green-50 text-green-800 border border-green-200 hover:bg-green-100"
                                        }`}
                                    >
                                        {ad.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(ad)}
                                        className="py-2 px-3.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all"
                                        title="Edit Ad"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ad._id)}
                                        className="py-2 px-3.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all"
                                        title="Delete Ad"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE / EDIT AD MODAL (Clean, Centered & High Z-Index) */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col border border-pink-100 overflow-hidden text-gray-900 my-auto animate-in fade-in zoom-in duration-200">
                        
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#F43676] flex items-center justify-center text-lg font-black border border-pink-100">
                                    <i className="fas fa-ad"></i>
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-gray-900">
                                        {editingAd ? "Edit Advertisement" : "Create New Advertisement"}
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Upload ad banner image and set target click link
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition-colors text-sm font-bold"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                            
                            {/* Ad Image Upload */}
                            <div>
                                <label className="block text-gray-700 font-bold mb-1.5">
                                    Ad Banner Image {!editingAd && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative border-2 border-dashed border-pink-200 rounded-2xl p-4 text-center hover:border-[#F43676] bg-pink-50/30 transition-all cursor-pointer group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        required={!editingAd && !imagePreview}
                                    />
                                    {imagePreview ? (
                                        <div className="relative rounded-xl overflow-hidden max-h-48 border border-gray-200 bg-gray-50">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="max-h-48 mx-auto object-contain rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImageFile(null);
                                                    setImagePreview(editingAd ? (editingAd.image || editingAd.imageUrl) : null);
                                                }}
                                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700 z-20 text-xs shadow-md"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="py-6">
                                            <i className="fas fa-cloud-upload-alt text-3xl text-[#F43676] mb-2 block group-hover:scale-110 transition-transform"></i>
                                            <p className="text-gray-900 font-bold">Click or drag image to upload banner</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Supports JPG, PNG, WEBP up to 5MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-gray-700 font-bold mb-1">
                                    Ad Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full text-xs p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#F43676] focus:ring-2 focus:ring-pink-100 font-bold text-gray-900 bg-white"
                                    placeholder="e.g. Special Campaign Protest"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-gray-700 font-bold mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full text-xs p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#F43676] focus:ring-2 focus:ring-pink-100 font-semibold text-gray-900 bg-white"
                                    placeholder="Brief ad description or tagline..."
                                    rows={2}
                                />
                            </div>

                            {/* Target URL */}
                            <div>
                                <label className="block text-gray-700 font-bold mb-1">
                                    Target URL / Destination Link <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.link}
                                    onChange={(e) =>
                                        setFormData({ ...formData, link: e.target.value })
                                    }
                                    className="w-full text-xs p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#F43676] focus:ring-2 focus:ring-pink-100 font-semibold text-gray-900 bg-white"
                                    placeholder="https://sosign.in/campaign/..."
                                    required
                                />
                            </div>

                            {/* Position & Priority */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1">
                                        Placement Position
                                    </label>
                                    <select
                                        value={formData.position}
                                        onChange={(e) =>
                                            setFormData({ ...formData, position: e.target.value })
                                        }
                                        className="w-full text-xs p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#F43676] font-bold text-gray-900 bg-white"
                                    >
                                        <option value="sidebar">Sidebar (Home & Categories)</option>
                                        <option value="banner">Top Banner</option>
                                        <option value="inline">Inline Content</option>
                                        <option value="popup">Popup Modal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1">
                                        Priority (Higher = Shown First)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) =>
                                            setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                                        }
                                        className="w-full text-xs p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#F43676] font-bold text-gray-900 bg-white"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, startDate: e.target.value })
                                        }
                                        className="w-full text-xs p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#F43676] font-semibold text-gray-900 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1">
                                        End Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, endDate: e.target.value })
                                        }
                                        className="w-full text-xs p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#F43676] font-semibold text-gray-900 bg-white"
                                    />
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-2.5 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isActive: e.target.checked })
                                    }
                                    className="w-4 h-4 text-[#F43676] border-gray-300 rounded focus:ring-[#F43676] cursor-pointer"
                                />
                                <label htmlFor="isActive" className="text-xs font-bold text-gray-800 cursor-pointer">
                                    Active Status (Publish ad live immediately)
                                </label>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 bg-gradient-to-r from-[#F43676] to-[#e02a60] hover:from-[#e02a60] text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-pink-500/20 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check-circle"></i>
                                            <span>{editingAd ? "Update Advertisement" : "Publish Advertisement"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
