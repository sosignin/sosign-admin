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
            setError("Failed to fetch ads");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

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

    // Open modal for creating new ad
    const handleCreateNew = () => {
        resetForm();
        setShowModal(true);
    };

    // Open modal for editing ad
    const handleEdit = (ad) => {
        setEditingAd(ad);
        setFormData({
            title: ad.title,
            description: ad.description || "",
            link: ad.link || "",
            position: ad.position,
            isActive: ad.isActive,
            priority: ad.priority,
            startDate: ad.startDate ? ad.startDate.split("T")[0] : "",
            endDate: ad.endDate ? ad.endDate.split("T")[0] : "",
        });
        setImagePreview(ad.image || ad.imageUrl);
        setShowModal(true);
    };

    // Handle image selection
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

    // Handle form submission
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
            if (formData.startDate) formDataToSend.append("startDate", formData.startDate);
            if (formData.endDate) formDataToSend.append("endDate", formData.endDate);
            if (imageFile) formDataToSend.append("image", imageFile);

            const url = editingAd
                ? `${API_URL}/api/ads/${editingAd._id}`
                : `${API_URL}/api/ads`;

            const method = editingAd ? "PUT" : "POST";

            const res = await authFetch(url, {
                method,
                body: formDataToSend,
            });

            const data = await res.json();

            if (data.success) {
                setShowModal(false);
                resetForm();
                fetchAds();
            } else {
                alert(data.message || "Failed to save ad");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to save ad");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this ad?")) return;

        try {
            const res = await authFetch(`${API_URL}/api/ads/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ _action: "delete" }),
            });

            const data = await res.json();

            if (data.success) {
                fetchAds();
            } else {
                alert(data.message || "Failed to delete ad");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete ad");
        }
    };

    // Handle toggle status
    const handleToggleStatus = async (id) => {
        try {
            const res = await authFetch(`${API_URL}/api/ads/${id}/toggle`, {
                method: "POST",
            });

            const data = await res.json();

            if (data.success) {
                fetchAds();
            } else {
                alert(data.message || "Failed to update status");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Ads Management
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your advertisement banners</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    Create New Ad
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            {/* Ads Grid */}
            {ads.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <i className="fas fa-ad text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No ads yet</h3>
                    <p className="text-gray-400">Create your first ad to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.map((ad) => (
                        <div
                            key={ad._id}
                            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                        >
                            {/* Image */}
                            <div className="relative h-48 bg-gray-100">
                                <img
                                    src={ad.image || ad.imageUrl}
                                    alt={ad.title}
                                    className="w-full h-full object-cover"
                                />
                                {/* Status Badge */}
                                <span
                                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${ad.isActive
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {ad.isActive ? "Active" : "Inactive"}
                                </span>
                                {/* Position Badge */}
                                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                                    {ad.position}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                                    {ad.title}
                                </h3>
                                {ad.description && (
                                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                                        {ad.description}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                                    <span className="flex items-center gap-1">
                                        <i className="fas fa-eye"></i>
                                        {ad.impressions || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <i className="fas fa-mouse-pointer"></i>
                                        {ad.clicks || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <i className="fas fa-star"></i>
                                        {ad.priority}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleStatus(ad._id)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${ad.isActive
                                            ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                            : "bg-green-50 text-green-700 hover:bg-green-100"
                                            }`}
                                    >
                                        {ad.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(ad)}
                                        className="py-2 px-3 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ad._id)}
                                        className="py-2 px-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-all"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingAd ? "Edit Ad" : "Create New Ad"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ad Image {!editingAd && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        required={!editingAd && !imagePreview}
                                    />
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="max-h-48 mx-auto rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImageFile(null);
                                                    setImagePreview(editingAd ? (editingAd.image || editingAd.imageUrl) : null);
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 z-20"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="py-8">
                                            <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2 block"></i>
                                            <p className="text-gray-500">Click or drag to upload image</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="Enter ad title"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="Enter ad description (optional)"
                                    rows={3}
                                />
                            </div>

                            {/* Target URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Target URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.link}
                                    onChange={(e) =>
                                        setFormData({ ...formData, link: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="https://example.com"
                                />
                            </div>

                            {/* Position & Priority */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Position
                                    </label>
                                    <select
                                        value={formData.position}
                                        onChange={(e) =>
                                            setFormData({ ...formData, position: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    >
                                        <option value="sidebar">Sidebar</option>
                                        <option value="header">Header</option>
                                        <option value="footer">Footer</option>
                                        <option value="inline">Inline</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Priority
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) =>
                                            setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, startDate: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, endDate: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isActive: e.target.checked })
                                    }
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                    Active (Show this ad on the website)
                                </label>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save"></i>
                                            {editingAd ? "Update Ad" : "Create Ad"}
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
