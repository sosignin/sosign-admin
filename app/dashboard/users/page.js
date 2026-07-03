"use client";

import { useState, useEffect, useMemo } from "react";
import { getAuthHeaders } from "@/utils/api";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [verifiedUsers, setVerifiedUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
    const [activeTab, setActiveTab] = useState("all"); // "all" or "verified"

    // Mobile management state
    const [mobileModal, setMobileModal] = useState(null); // userId or null
    const [mobileInput, setMobileInput] = useState("");
    const [mobileLoading, setMobileLoading] = useState(false);

    // Name management state
    const [nameModal, setNameModal] = useState(null); // userId or null
    const [nameInput, setNameInput] = useState("");
    const [nameLoading, setNameLoading] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const headers = getAuthHeaders();
                // Fetch all users
                const usersRes = await fetch(`${apiUrl}/api/admin/customers`, {
                    headers,
                    credentials: "include",
                });
                const usersData = await usersRes.json();

                // Fetch stats for total user count
                const statsRes = await fetch(`${apiUrl}/api/admin/stats`, {
                    headers,
                    credentials: "include",
                });
                const statsData = await statsRes.json();

                // Fetch verified users
                const verifiedRes = await fetch(`${apiUrl}/api/admin/verified-users`, {
                    headers,
                    credentials: "include",
                });
                const verifiedData = await verifiedRes.json();

                if (Array.isArray(usersData)) {
                    setUsers(usersData);
                } else {
                    console.error("Users data is not an array:", usersData);
                    setUsers([]);
                }

                if (statsData.success) {
                    setTotalUsers(statsData.stats.totalUsers);
                }

                if (verifiedData.success) {
                    setVerifiedUsers(verifiedData.users || []);
                }
            } catch (err) {
                console.error("Failed to fetch user data:", err);
                setError("Failed to load user management data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiUrl]);

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const handleToggleSuspension = async (userId, currentStatus) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? "unsuspend" : "suspend"} this user?`)) return;

        try {
            const response = await fetch(`${apiUrl}/api/admin/customers/${userId}/suspend`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isSuspended: !currentStatus }),
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                // Update local state
                setUsers(users.map(u => u._id === userId ? { ...u, isSuspended: !currentStatus } : u));
                alert(data.message);
            } else {
                alert(data.message || "Failed to update user status.");
            }
        } catch (err) {
            console.error("Error toggling suspension:", err);
            alert("Something went wrong. Please try again.");
        }
    };

    const openMobileModal = (user) => {
        setMobileModal(user._id);
        setMobileInput(user.mobileNumber || "");
    };

    const closeMobileModal = () => {
        setMobileModal(null);
        setMobileInput("");
    };

    const openNameModal = (user) => {
        setNameModal(user._id);
        setNameInput(user.name || "");
    };

    const closeNameModal = () => {
        setNameModal(null);
        setNameInput("");
    };

    const handleUpdateName = async () => {
        if (!nameInput.trim()) {
            alert("Name cannot be empty.");
            return;
        }
        try {
            setNameLoading(true);
            const response = await fetch(`${apiUrl}/api/admin/customers/${nameModal}/name`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: nameInput }),
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                setUsers(users.map(u =>
                    u._id === nameModal
                        ? { ...u, name: data.user.name }
                        : u
                ));
                closeNameModal();
                alert(data.message);
            } else {
                alert(data.message || "Failed to update name.");
            }
        } catch (err) {
            console.error("Error updating name:", err);
            alert("Something went wrong. Please try again.");
        } finally {
            setNameLoading(false);
        }
    };

    const handleUpdateMobile = async () => {
        try {
            setMobileLoading(true);
            const response = await fetch(`${apiUrl}/api/admin/customers/${mobileModal}/mobile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mobileNumber: mobileInput }),
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                setUsers(users.map(u =>
                    u._id === mobileModal
                        ? { ...u, mobileNumber: data.user.mobileNumber || null }
                        : u
                ));
                closeMobileModal();
                alert(data.message);
            } else {
                alert(data.message || "Failed to update mobile number.");
            }
        } catch (err) {
            console.error("Error updating mobile:", err);
            alert("Something went wrong. Please try again.");
        } finally {
            setMobileLoading(false);
        }
    };

    const handleResetMobile = async () => {
        if (!confirm("Are you sure you want to reset (remove) this user's mobile number?")) return;
        try {
            setMobileLoading(true);
            const response = await fetch(`${apiUrl}/api/admin/customers/${mobileModal}/mobile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mobileNumber: "" }),
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                setUsers(users.map(u =>
                    u._id === mobileModal
                        ? { ...u, mobileNumber: null }
                        : u
                ));
                closeMobileModal();
                alert(data.message);
            } else {
                alert(data.message || "Failed to reset mobile number.");
            }
        } catch (err) {
            console.error("Error resetting mobile:", err);
            alert("Something went wrong. Please try again.");
        } finally {
            setMobileLoading(false);
        }
    };

    const isDummyUser = (email) => {
        if (!email) return false;
        return email.startsWith("dummy_") || /_[0-9]{4,6}@/.test(email);
    };

    const handleLoginAs = async (user) => {
        try {
            const response = await fetch(`${apiUrl}/api/admin/customers/${user._id}/login-as`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok && data.success && data.token) {
                let frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
                if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
                    frontendUrl = "http://localhost:3000";
                }
                window.open(`${frontendUrl}/login?token=${data.token}`, "_blank");
            } else {
                alert(data.message || "Failed to generate login token.");
            }
        } catch (err) {
            console.error("Error logging in as user:", err);
            alert("Something went wrong. Please try again.");
        }
    };

    // --- All Users sorting/filtering ---
    const sortedUsers = useMemo(() => {
        let items = [...users];
        if (searchTerm) {
            items = items.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.mobileNumber?.includes(searchTerm)
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
    }, [users, searchTerm, sortConfig]);

    // --- Verified Users sorting/filtering ---
    const sortedVerifiedUsers = useMemo(() => {
        let items = [...verifiedUsers];
        if (searchTerm) {
            items = items.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.aadhaarKyc?.maskedAadhaar?.includes(searchTerm) ||
                user.panKyc?.panNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.voterKyc?.voterId?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        items.sort((a, b) => {
            const getNestedValue = (obj, path) => {
                if (!obj || !path) return null;
                return path.split('.').reduce((acc, part) => acc && acc[part], obj);
            };

            const aValue = getNestedValue(a, sortConfig.key);
            const bValue = getNestedValue(b, sortConfig.key);

            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });
        return items;
    }, [verifiedUsers, searchTerm, sortConfig]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const formatDateWithTime = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
                    <p className="text-gray-500 font-medium">Loading user management...</p>
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage and monitor all platform users</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-users text-6xl text-indigo-600"></i>
                    </div>
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-gray-500 text-sm font-medium">Total Registered Users</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900">{totalUsers}</span>
                            <span className="text-emerald-500 text-sm font-bold flex items-center gap-1">
                                <i className="fas fa-check-circle text-[10px]"></i>
                                Active
                            </span>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-user-check text-6xl text-teal-600"></i>
                    </div>
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-gray-500 text-sm font-medium">Verified Users</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900">{verifiedUsers.length}</span>
                            <span className="text-teal-500 text-sm font-bold flex items-center gap-1">
                                <i className="fas fa-shield-alt text-[10px]"></i>
                                KYC Done
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
                <button
                    onClick={() => { setActiveTab("all"); setSearchTerm(""); setSortConfig({ key: "createdAt", direction: "desc" }); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                        activeTab === "all"
                            ? "bg-white text-indigo-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <i className="fas fa-users text-xs"></i>
                    All Users
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                        activeTab === "all"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-200 text-gray-500"
                    }`}>
                        {users.length}
                    </span>
                </button>
                <button
                    onClick={() => { setActiveTab("verified"); setSearchTerm(""); setSortConfig({ key: "createdAt", direction: "desc" }); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                        activeTab === "verified"
                            ? "bg-white text-teal-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <i className="fas fa-user-check text-xs"></i>
                    Verified Users
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                        activeTab === "verified"
                            ? "bg-teal-100 text-teal-700"
                            : "bg-gray-200 text-gray-500"
                    }`}>
                        {verifiedUsers.length}
                    </span>
                </button>
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
                            placeholder={activeTab === "all"
                                ? "Search by name, email, or mobile..."
                                : "Search by name, email, Aadhaar, PAN or Voter ID..."
                            }
                            className={`block w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 transition-all text-sm outline-none ${
                                activeTab === "all"
                                    ? "focus:ring-indigo-500/20 focus:border-indigo-500"
                                    : "focus:ring-teal-500/20 focus:border-teal-500"
                            }`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* All Users Table */}
                {activeTab === "all" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th onClick={() => handleSort("name")} className="px-6 py-4 text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-100/50 transition-colors group">
                                        <div className="flex items-center gap-2">
                                            User Info
                                            <i className={`fas fa-sort text-[10px] transition-opacity ${sortConfig.key === "name" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></i>
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort("email")} className="px-6 py-4 text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-100/50 transition-colors group">
                                        <div className="flex items-center gap-2">
                                            Email Address
                                            <i className={`fas fa-sort text-[10px] transition-opacity ${sortConfig.key === "email" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></i>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-phone text-xs text-gray-400"></i>
                                            Mobile
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort("createdAt")} className="px-6 py-4 text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-100/50 transition-colors group">
                                        <div className="flex items-center gap-2">
                                            Joined Date
                                            <i className={`fas fa-sort text-[10px] transition-opacity ${sortConfig.key === "createdAt" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></i>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-600 text-center">Status</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-600 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedUsers.length > 0 ? (
                                    sortedUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center border border-indigo-200/50">
                                                        <i className="fas fa-user text-indigo-600"></i>
                                                    </div>
                                                    <span className="font-bold text-gray-900">{user.name || "Unnamed User"}</span>
                                                    {isDummyUser(user.email) && (
                                                        <span 
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 cursor-help ml-2"
                                                            title="Dummy Account (Default Password: dummy_password_12345)"
                                                        >
                                                            Dummy
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => openNameModal(user)}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all ml-1"
                                                        title="Edit user name"
                                                    >
                                                        <i className="fas fa-pen text-[10px]"></i>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <i className="fas fa-envelope text-xs"></i>
                                                    <span className="text-sm">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {user.mobileNumber ? (
                                                        <span className="text-sm font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                                                            {user.mobileNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Not set</span>
                                                    )}
                                                    <button
                                                        onClick={() => openMobileModal(user)}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit mobile number"
                                                    >
                                                        <i className="fas fa-pen text-[10px]"></i>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <i className="fas fa-calendar-alt text-xs"></i>
                                                    <span className="text-sm font-medium">{formatDate(user.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {user.isSuspended ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                        Suspended
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleSuspension(user._id, user.isSuspended)}
                                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                            user.isSuspended
                                                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                                                                : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                                        }`}
                                                    >
                                                        {user.isSuspended ? "Unsuspend" : "Suspend"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleLoginAs(user)}
                                                        className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                                        title="Login as user in a new tab"
                                                    >
                                                        <i className="fas fa-sign-in-alt"></i>
                                                        Login
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <i className="fas fa-users text-3xl text-gray-300"></i>
                                                </div>
                                                <p className="text-gray-500 font-medium">No users found matching your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Verified Users Table */}
                {activeTab === "verified" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th onClick={() => handleSort("name")} className="px-6 py-4 text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-100/50 transition-colors group">
                                        <div className="flex items-center gap-2">
                                            User Details
                                            <i className={`fas fa-sort text-[10px] transition-opacity ${sortConfig.key === "name" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></i>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-600">Verified Documents</th>
                                    <th onClick={() => handleSort("createdAt")} className="px-6 py-4 text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-100/50 transition-colors group">
                                        <div className="flex items-center gap-2">
                                            Verification Date
                                            <i className={`fas fa-sort text-[10px] transition-opacity ${sortConfig.key === "createdAt" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></i>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-600 text-center">Status</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-600 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedVerifiedUsers.length > 0 ? (
                                    sortedVerifiedUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-teal-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center border border-teal-200/50">
                                                        <i className="fas fa-user text-teal-600"></i>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900">{user.name}</span>
                                                            {isDummyUser(user.email) && (
                                                                <span 
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 cursor-help"
                                                                    title="Dummy Account (Default Password: dummy_password_12345)"
                                                                >
                                                                    Dummy
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {user.aadhaarKyc?.status === "verified" && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Aadhaar:</span>
                                                            <span className="text-sm font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                                                {user.aadhaarKyc?.maskedAadhaar || "XXXX-XXXX-XXXX"}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {user.panKyc?.status === "verified" && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">PAN:</span>
                                                            <span className="text-sm font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                                                {user.panKyc?.panNumber || "XXXXX0000X"}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {user.voterKyc?.status === "verified" && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Voter ID:</span>
                                                            <span className="text-sm font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                                                {user.voterKyc?.voterId || "XXXXXX"}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {user.mobileNumber && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <i className="fas fa-phone text-[10px] text-gray-400"></i>
                                                            <span className="text-xs text-gray-600">{user.mobileNumber}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <i className="fas fa-calendar-check text-xs text-teal-500"></i>
                                                    <span className="text-sm font-medium">{formatDateWithTime(user.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-teal-100 text-teal-700 uppercase tracking-wider border border-teal-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                                                    Verified
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleLoginAs(user)}
                                                    className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 justify-center mx-auto"
                                                    title="Login as user in a new tab"
                                                >
                                                    <i className="fas fa-sign-in-alt"></i>
                                                    Login
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <i className="fas fa-user-slash text-3xl text-gray-300"></i>
                                                </div>
                                                <p className="text-gray-500 font-medium">No verified users found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    {activeTab === "all" ? (
                        <>
                            <p>Showing <span className="font-bold text-gray-900">{sortedUsers.length}</span> of <span className="font-bold text-gray-900">{totalUsers}</span> users</p>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-all disabled:opacity-50" disabled>Previous</button>
                                <button className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-all disabled:opacity-50" disabled>Next</button>
                            </div>
                        </>
                    ) : (
                        <p>Displaying <span className="font-bold text-gray-900">{sortedVerifiedUsers.length}</span> verified users</p>
                    )}
                </div>
            </div>

            {/* Mobile Number Edit Modal */}
            {mobileModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                <i className="fas fa-phone text-indigo-600"></i>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Manage Mobile Number</h3>
                                <p className="text-sm text-gray-500">
                                    {users.find(u => u._id === mobileModal)?.name || "User"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Mobile Number
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+91</span>
                                    <input
                                        type="tel"
                                        value={mobileInput}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                            setMobileInput(val);
                                        }}
                                        placeholder="Enter 10-digit number"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                        maxLength={10}
                                    />
                                </div>
                                {mobileInput && mobileInput.length !== 10 && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <i className="fas fa-exclamation-triangle text-[10px]"></i>
                                        Please enter a valid 10-digit mobile number
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpdateMobile}
                                    disabled={mobileLoading || (mobileInput && mobileInput.length !== 10)}
                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                >
                                    {mobileLoading ? (
                                        <i className="fas fa-spinner animate-spin"></i>
                                    ) : (
                                        <i className="fas fa-save text-xs"></i>
                                    )}
                                    {mobileInput ? "Update Mobile" : "Save"}
                                </button>
                                <button
                                    onClick={handleResetMobile}
                                    disabled={mobileLoading}
                                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border border-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                    title="Remove mobile number"
                                >
                                    {mobileLoading ? (
                                        <i className="fas fa-spinner animate-spin"></i>
                                    ) : (
                                        <i className="fas fa-eraser text-xs"></i>
                                    )}
                                    Reset
                                </button>
                            </div>
                            <button
                                onClick={closeMobileModal}
                                className="w-full py-2 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Name Edit Modal */}
            {nameModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                <i className="fas fa-user-edit text-indigo-600"></i>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Edit User Name</h3>
                                <p className="text-sm text-gray-500">
                                    {users.find(u => u._id === nameModal)?.email || "User"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    placeholder="Enter user's full name"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                />
                                {nameInput.trim() === "" && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <i className="fas fa-exclamation-triangle text-[10px]"></i>
                                        Name cannot be empty
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleUpdateName}
                                disabled={nameLoading || nameInput.trim() === ""}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                            >
                                {nameLoading ? (
                                    <i className="fas fa-spinner animate-spin"></i>
                                ) : (
                                    <i className="fas fa-save text-xs"></i>
                                )}
                                Update Name
                            </button>
                            <button
                                onClick={closeNameModal}
                                className="w-full py-2 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
