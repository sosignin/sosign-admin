"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ALL_PERMISSIONS = [
    { key: "dashboard", label: "Dashboard", icon: "fas fa-home", color: "blue" },
    { key: "petition-approval", label: "Petition Approval", icon: "fas fa-check-circle", color: "green" },
    { key: "comment-approval", label: "Comment Approval", icon: "fas fa-comments", color: "orange" },
    { key: "petitions", label: "All Petitions", icon: "fas fa-file-alt", color: "purple" },
    { key: "successfulpetitions", label: "Successful Petitions", icon: "fas fa-trophy", color: "yellow" },
    { key: "ads", label: "Ads Management", icon: "fas fa-ad", color: "pink" },
    { key: "download-requests", label: "Download Requests", icon: "fas fa-download", color: "teal" },
    { key: "hide-requests", label: "Hide Requests", icon: "fas fa-eye-slash", color: "amber" },
    { key: "blogs", label: "Blog Management", icon: "fas fa-blog", color: "cyan" },
    { key: "wallets", label: "Wallet Management", icon: "fas fa-wallet", color: "emerald" },
    { key: "wallet-requests", label: "Wallet Requests", icon: "fas fa-money-check-alt", color: "rose" },
    { key: "users", label: "User Management", icon: "fas fa-users", color: "indigo" },
    { key: "categories", label: "Category Management", icon: "fas fa-tags", color: "fuchsia" },
    { key: "crowdfunding", label: "Crowdfunding Approval", icon: "fas fa-hand-holding-usd", color: "lime" },
    { key: "withdrawals", label: "Withdrawal Requests", icon: "fas fa-money-bill-wave", color: "orange" },
    { key: "rejected-petitions", label: "Rejected Petitions", icon: "fas fa-times-circle", color: "red" },
    { key: "progress-updates", label: "Progress Updates", icon: "fas fa-tasks", color: "sky" },
    { key: "faqs", label: "FAQs Management", icon: "fas fa-question-circle", color: "violet" },
    { key: "plans", label: "Plan Management", icon: "fas fa-crown", color: "amber" },
    { key: "rapid-creation", label: "Rapid Creation", icon: "fas fa-bolt", color: "yellow" },
    { key: "seo-research", label: "SEO Research", icon: "fas fa-search", color: "teal" },
];

export default function SubAdminManagement() {
    const router = useRouter();
    const [subAdmins, setSubAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        permissions: [],
    });
    const [newPassword, setNewPassword] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [showFormPassword, setShowFormPassword] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        fetchSubAdmins();
    }, []);

    // Auto-hide success messages
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(""), 4000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const fetchSubAdmins = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/subadmin/all`, {
                credentials: "include",
            });
            if (res.status === 403) {
                router.push("/dashboard");
                return;
            }
            if (!res.ok) throw new Error("Failed to fetch sub-admins");
            const data = await res.json();
            setSubAdmins(data.subAdmins || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load sub-admins");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError("");

        try {
            const res = await fetch(`${apiUrl}/api/subadmin/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create sub-admin");

            setCreatedCredentials({ email: formData.email, password: formData.password });
            setSuccess("Sub-admin created successfully!");
            setShowCreateModal(false);
            setFormData({ name: "", email: "", password: "", permissions: [] });
            fetchSubAdmins();
        } catch (err) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedSubAdmin) return;
        setFormLoading(true);
        setError("");

        try {
            const res = await fetch(`${apiUrl}/api/subadmin/${selectedSubAdmin._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    permissions: formData.permissions,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update sub-admin");

            setSuccess("Sub-admin updated successfully!");
            setShowEditModal(false);
            setSelectedSubAdmin(null);
            fetchSubAdmins();
        } catch (err) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleActive = async (subAdmin) => {
        try {
            const res = await fetch(`${apiUrl}/api/subadmin/${subAdmin._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isActive: !subAdmin.isActive }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            setSuccess(`Sub-admin ${subAdmin.isActive ? "deactivated" : "activated"} successfully!`);
            fetchSubAdmins();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!selectedSubAdmin) return;
        setFormLoading(true);
        setError("");

        try {
            const res = await fetch(`${apiUrl}/api/subadmin/${selectedSubAdmin._id}/reset-password`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to reset password");

            setSuccess("Password reset successfully!");
            setShowResetPasswordModal(false);
            setNewPassword("");
            setSelectedSubAdmin(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedSubAdmin) return;
        setFormLoading(true);
        setError("");

        try {
            const res = await fetch(`${apiUrl}/api/subadmin/${selectedSubAdmin._id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete sub-admin");

            setSuccess("Sub-admin deleted successfully!");
            setShowDeleteConfirm(false);
            setSelectedSubAdmin(null);
            fetchSubAdmins();
        } catch (err) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const openEditModal = (subAdmin) => {
        setSelectedSubAdmin(subAdmin);
        setFormData({
            name: subAdmin.name,
            email: subAdmin.email,
            password: "",
            permissions: subAdmin.permissions || [],
        });
        setShowEditModal(true);
    };

    const openResetModal = (subAdmin) => {
        setSelectedSubAdmin(subAdmin);
        setNewPassword("");
        setShowResetPasswordModal(true);
    };

    const openDeleteConfirm = (subAdmin) => {
        setSelectedSubAdmin(subAdmin);
        setShowDeleteConfirm(true);
    };

    const togglePermission = (key) => {
        setFormData((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(key)
                ? prev.permissions.filter((p) => p !== key)
                : [...prev.permissions, key],
        }));
    };

    const selectAllPermissions = () => {
        setFormData((prev) => ({
            ...prev,
            permissions: ALL_PERMISSIONS.map((p) => p.key),
        }));
    };

    const clearAllPermissions = () => {
        setFormData((prev) => ({ ...prev, permissions: [] }));
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-purple-200 border-t-purple-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <i className="fas fa-user-shield text-purple-600"></i>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        Sub-Admin Management
                    </h1>
                    <p className="text-gray-500 mt-1">Create and manage sub-admin accounts with limited access</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: "", email: "", password: "", permissions: [] });
                        setShowCreateModal(true);
                        setCreatedCredentials(null);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-violet-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-300"
                >
                    <i className="fas fa-plus"></i>
                    Create Sub-Admin
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <i className="fas fa-exclamation-triangle text-red-500 mr-3 text-lg"></i>
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                        <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <i className="fas fa-check-circle text-green-500 mr-3 text-lg"></i>
                            <p className="text-green-700 text-sm font-medium">{success}</p>
                        </div>
                        <button onClick={() => setSuccess("")} className="text-green-400 hover:text-green-600">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* Created credentials card */}
            {createdCredentials && (
                <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-xl shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <i className="fas fa-key text-blue-600"></i>
                                <h3 className="text-blue-800 font-bold">New Sub-Admin Credentials</h3>
                            </div>
                            <p className="text-blue-700 text-sm mb-1">
                                <strong>Email:</strong> {createdCredentials.email}
                            </p>
                            <p className="text-blue-700 text-sm">
                                <strong>Password:</strong> {createdCredentials.password}
                            </p>
                            <p className="text-blue-500 text-xs mt-2">
                                <i className="fas fa-info-circle mr-1"></i>
                                Share these credentials with the sub-admin. This is the only time the password will be visible.
                            </p>
                        </div>
                        <button onClick={() => setCreatedCredentials(null)} className="text-blue-400 hover:text-blue-600">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* Sub-admins list */}
            {subAdmins.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-user-shield text-violet-500 text-3xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Sub-Admins Yet</h3>
                    <p className="text-gray-500 mb-6">Create your first sub-admin to delegate admin panel access</p>
                    <button
                        onClick={() => {
                            setFormData({ name: "", email: "", password: "", permissions: [] });
                            setShowCreateModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        <i className="fas fa-plus"></i>
                        Create First Sub-Admin
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {subAdmins.map((subAdmin) => (
                        <div
                            key={subAdmin._id}
                            className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border p-6 transition-all duration-300 hover:shadow-xl ${
                                subAdmin.isActive ? "border-gray-200/60" : "border-red-200/60 bg-red-50/30"
                            }`}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Info */}
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
                                        subAdmin.isActive
                                            ? "bg-gradient-to-br from-violet-500 to-purple-600"
                                            : "bg-gradient-to-br from-gray-400 to-gray-500"
                                    }`}>
                                        <i className="fas fa-user-shield text-white text-lg"></i>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-lg font-bold text-gray-800">{subAdmin.name}</h3>
                                            {subAdmin.isActive ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                                                    <i className="fas fa-check-circle text-[9px]"></i>Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                                                    <i className="fas fa-ban text-[9px]"></i>Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">{subAdmin.email}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {(subAdmin.permissions || []).map((perm) => {
                                                const permInfo = ALL_PERMISSIONS.find((p) => p.key === perm);
                                                return (
                                                    <span
                                                        key={perm}
                                                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100"
                                                    >
                                                        <i className={`${permInfo?.icon || "fas fa-circle"} text-[9px]`}></i>
                                                        {permInfo?.label || perm}
                                                    </span>
                                                );
                                            })}
                                            {(!subAdmin.permissions || subAdmin.permissions.length === 0) && (
                                                <span className="text-xs text-gray-400 italic">No permissions assigned</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Created: {new Date(subAdmin.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleToggleActive(subAdmin)}
                                        className={`p-2.5 rounded-xl transition-all duration-200 ${
                                            subAdmin.isActive
                                                ? "text-orange-600 hover:bg-orange-50 border border-orange-200"
                                                : "text-green-600 hover:bg-green-50 border border-green-200"
                                        }`}
                                        title={subAdmin.isActive ? "Deactivate" : "Activate"}
                                    >
                                        <i className={`fas ${subAdmin.isActive ? "fa-toggle-on" : "fa-toggle-off"} text-lg`}></i>
                                    </button>
                                    <button
                                        onClick={() => openEditModal(subAdmin)}
                                        className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 border border-blue-200 transition-all duration-200"
                                        title="Edit"
                                    >
                                        <i className="fas fa-edit text-lg"></i>
                                    </button>
                                    <button
                                        onClick={() => openResetModal(subAdmin)}
                                        className="p-2.5 rounded-xl text-purple-600 hover:bg-purple-50 border border-purple-200 transition-all duration-200"
                                        title="Reset Password"
                                    >
                                        <i className="fas fa-key text-lg"></i>
                                    </button>
                                    <button
                                        onClick={() => openDeleteConfirm(subAdmin)}
                                        className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-all duration-200"
                                        title="Delete"
                                    >
                                        <i className="fas fa-trash text-lg"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ============ CREATE MODAL ============ */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                                        <i className="fas fa-user-plus text-white"></i>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800">Create Sub-Admin</h2>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        placeholder="Enter name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        placeholder="Enter email"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showFormPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        placeholder="Minimum 6 characters"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowFormPassword(!showFormPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <i className={`fas ${showFormPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                    </button>
                                </div>
                            </div>

                            {/* Permissions */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-gray-700">Permissions</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={selectAllPermissions} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                                            Select All
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button type="button" onClick={clearAllPermissions} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {ALL_PERMISSIONS.map((perm) => (
                                        <label
                                            key={perm.key}
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                                                formData.permissions.includes(perm.key)
                                                    ? "border-purple-300 bg-purple-50 shadow-sm"
                                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.includes(perm.key)}
                                                onChange={() => togglePermission(perm.key)}
                                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                            />
                                            <i className={`${perm.icon} text-sm ${formData.permissions.includes(perm.key) ? "text-purple-600" : "text-gray-400"}`}></i>
                                            <span className={`text-sm font-medium ${formData.permissions.includes(perm.key) ? "text-purple-800" : "text-gray-600"}`}>
                                                {perm.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                                >
                                    {formLoading ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>Creating...</>
                                    ) : (
                                        <><i className="fas fa-plus mr-2"></i>Create Sub-Admin</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ EDIT MODAL ============ */}
            {showEditModal && selectedSubAdmin && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                        <i className="fas fa-edit text-white"></i>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800">Edit Sub-Admin</h2>
                                </div>
                                <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Permissions */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-gray-700">Permissions</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={selectAllPermissions} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                            Select All
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button type="button" onClick={clearAllPermissions} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {ALL_PERMISSIONS.map((perm) => (
                                        <label
                                            key={perm.key}
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                                                formData.permissions.includes(perm.key)
                                                    ? "border-blue-300 bg-blue-50 shadow-sm"
                                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.includes(perm.key)}
                                                onChange={() => togglePermission(perm.key)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <i className={`${perm.icon} text-sm ${formData.permissions.includes(perm.key) ? "text-blue-600" : "text-gray-400"}`}></i>
                                            <span className={`text-sm font-medium ${formData.permissions.includes(perm.key) ? "text-blue-800" : "text-gray-600"}`}>
                                                {perm.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={formLoading} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-60">
                                    {formLoading ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</>
                                    ) : (
                                        <><i className="fas fa-check mr-2"></i>Save Changes</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ RESET PASSWORD MODAL ============ */}
            {showResetPasswordModal && selectedSubAdmin && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowResetPasswordModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                                        <i className="fas fa-key text-white"></i>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
                                        <p className="text-sm text-gray-500">{selectedSubAdmin.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowResetPasswordModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleResetPassword} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="Enter new password (min 6 chars)"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowResetPasswordModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={formLoading} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-60">
                                    {formLoading ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>Resetting...</>
                                    ) : (
                                        <><i className="fas fa-key mr-2"></i>Reset Password</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ DELETE CONFIRMATION ============ */}
            {showDeleteConfirm && selectedSubAdmin && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-trash text-red-500 text-2xl"></i>
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Sub-Admin</h2>
                            <p className="text-gray-500 mb-1">Are you sure you want to delete</p>
                            <p className="font-semibold text-gray-800 mb-6">{selectedSubAdmin.name} ({selectedSubAdmin.email})?</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={formLoading}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                                >
                                    {formLoading ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>Deleting...</>
                                    ) : (
                                        <><i className="fas fa-trash mr-2"></i>Delete</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
