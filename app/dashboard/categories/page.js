"use client";

import { useState, useEffect, useMemo } from "react";

export default function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
    const [deleteLoading, setDeleteLoading] = useState(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryIcon, setNewCategoryIcon] = useState("FaTag");
    const [createError, setCreateError] = useState(null);
    const [createLoading, setCreateLoading] = useState(false);

    const iconChoices = [
        { name: "Tag (Default)", value: "FaTag" },
        { name: "Paw (Animals)", value: "FaPaw" },
        { name: "Gamepad (Game)", value: "FaGamepad" },
        { name: "Couch (Interior)", value: "FaCouch" },
        { name: "Spa (Lifestyle)", value: "FaSpa" },
        { name: "Person Running (Sports)", value: "FaPersonRunning" },
        { name: "Laptop Code (Technology)", value: "FaLaptopCode" },
        { name: "Plane (Travel)", value: "FaPlane" },
        { name: "Leaf (Environment)", value: "FaLeaf" },
        { name: "Graduation Cap (Education)", value: "FaGraduationCap" },
        { name: "Heart Pulse (Health)", value: "FaHeartPulse" },
        { name: "Landmark Dome (Politics)", value: "FaLandmarkDome" },
        { name: "Hand Fist (Human Rights)", value: "FaHandFist" }
    ];

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName || newCategoryName.trim().length === 0) {
            setCreateError("Category name is required");
            return;
        }
        if (newCategoryName.trim().length > 15) {
            setCreateError("Category name can be up to 15 characters only");
            return;
        }
        try {
            setCreateLoading(true);
            setCreateError(null);
            const res = await fetch(`${apiUrl}/api/admin/categories`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: newCategoryName.trim(),
                    icon: newCategoryIcon
                }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setCategories([data.category, ...categories]);
                setNewCategoryName("");
                setNewCategoryIcon("FaTag");
                setShowCreateModal(false);
            } else {
                setCreateError(data.message || "Failed to create category");
            }
        } catch (err) {
            console.error("Error creating category:", err);
            setCreateError("An error occurred while creating category.");
        } finally {
            setCreateLoading(false);
        }
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/admin/categories`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setCategories(data.categories);
            } else {
                throw new Error(data.message || "Failed to fetch categories");
            }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
            setError("Failed to load category management data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [apiUrl]);

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const handleDelete = async (categoryId) => {
        if (!window.confirm("Are you sure you want to delete this category? This might affect petitions using this category.")) return;

        try {
            setDeleteLoading(categoryId);
            const res = await fetch(`${apiUrl}/api/admin/categories/${categoryId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setCategories(categories.filter(c => c._id !== categoryId));
                // Optional: show a success toast if you have a toast system
            } else {
                alert(data.message || "Failed to delete category");
            }
        } catch (err) {
            console.error("Error deleting category:", err);
            alert("An error occurred while deleting the category.");
        } finally {
            setDeleteLoading(null);
        }
    };

    const filteredCategories = useMemo(() => {
        let items = [...categories];
        if (searchTerm) {
            items = items.filter(cat =>
                cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cat.slug?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        items.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });
        return items;
    }, [categories, searchTerm, sortConfig]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-fuchsia-100 border-t-fuchsia-600"></div>
                    <p className="text-gray-500 font-medium">Loading category management...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm flex items-center gap-3">
                    <i className="fas fa-times-circle text-red-500 text-xl"></i>
                    <p className="font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Category Management</h1>
                    <p className="text-gray-500 mt-1">View and manage petition categories</p>
                </div>
                <div className="flex gap-3">
                    <a
                        href="http://localhost:3000/categories"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                    >
                        <i className="fas fa-external-link-alt text-xs"></i>
                        View Public Page
                    </a>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-fuchsia-800 text-white font-semibold rounded-xl hover:from-fuchsia-700 hover:to-fuchsia-900 shadow-md transition-all text-sm flex items-center gap-2"
                    >
                        <i className="fas fa-plus text-xs"></i>
                        Create Category
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-tags text-6xl text-fuchsia-600"></i>
                    </div>
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-gray-500 text-sm font-medium">Total Categories</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900">{categories.length}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-star text-6xl text-amber-500"></i>
                    </div>
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-gray-500 text-sm font-medium">Platform Defaults</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900">
                                {categories.filter(c => c.isDefault).length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <i className="fas fa-search text-gray-400"></i>
                        </div>
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="block w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all text-sm outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th onClick={() => handleSort("name")} className="px-6 py-4 text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-100/50 transition-colors group">
                                    <div className="flex items-center gap-2">
                                        Category Name
                                        <i className={`fas fa-sort text-[10px] transition-opacity ${sortConfig.key === "name" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></i>
                                    </div>
                                </th>
                                <th onClick={() => handleSort("slug")} className="px-6 py-4 text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-100/50 transition-colors group">
                                    <div className="flex items-center gap-2">
                                        Slug
                                        <i className={`fas fa-sort text-[10px] transition-opacity ${sortConfig.key === "slug" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></i>
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-600">Type</th>
                                <th onClick={() => handleSort("createdAt")} className="px-6 py-4 text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-100/50 transition-colors group">
                                    <div className="flex items-center gap-2">
                                        Created At
                                        <i className={`fas fa-sort text-[10px] transition-opacity ${sortConfig.key === "createdAt" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></i>
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-600 text-right uppercase tracking-[0.05em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map((category) => (
                                    <tr key={category._id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 flex items-center justify-center border border-fuchsia-200/50">
                                                    <i className={`fas ${category.icon || 'fa-tag'} text-fuchsia-600`}></i>
                                                </div>
                                                <span className="font-bold text-gray-900">{category.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                {category.slug}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {category.isDefault ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                    System Default
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-fuchsia-100 text-fuchsia-700">
                                                    User Created
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">{formatDate(category.createdAt)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(category._id)}
                                                disabled={deleteLoading === category._id}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Category"
                                            >
                                                {deleteLoading === category._id ? (
                                                    <i className="fas fa-spinner fa-spin text-sm"></i>
                                                ) : (
                                                    <i className="fas fa-trash-alt text-sm"></i>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                <i className="fas fa-tags text-3xl text-gray-300"></i>
                                            </div>
                                            <p className="text-gray-500 font-medium">No categories found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Info Footer */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <p>Total shown: <span className="font-bold text-gray-900">{filteredCategories.length}</span> categories</p>
                </div>
            </div>

            {/* Create Category Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-xl font-bold text-gray-900">Create New Category</h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreateError(null);
                                }}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {createError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-medium">
                                {createError}
                            </div>
                        )}

                        <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-gray-700">Category Name</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={15}
                                    placeholder="e.g. Health"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all text-sm outline-none font-medium text-gray-900"
                                />
                                <span className="text-[11px] text-gray-400 font-semibold self-end">
                                    {newCategoryName.length}/15 characters
                                </span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-gray-700">Category Icon</label>
                                <select
                                    value={newCategoryIcon}
                                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all text-sm outline-none font-medium text-gray-900"
                                >
                                    {iconChoices.map((choice) => (
                                        <option key={choice.value} value={choice.value}>
                                            {choice.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCreateError(null);
                                    }}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-fuchsia-800 text-white font-semibold rounded-xl hover:from-fuchsia-700 hover:to-fuchsia-900 shadow-md transition-all text-sm flex items-center gap-2"
                                >
                                    {createLoading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Creating...
                                        </>
                                    ) : (
                                        "Create"
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
