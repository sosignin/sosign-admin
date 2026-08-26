"use client";

import { useState, useEffect, useMemo } from "react";
import { authFetch } from "@/utils/api";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [verifiedUsers, setVerifiedUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
    const [activeTab, setActiveTab] = useState("all"); // "all" | "genuine" | "verified" | "dummy"
    const [verifiedSubFilter, setVerifiedSubFilter] = useState("all"); // "all" | "real" | "dummy"

    // Mobile management state
    const [mobileModal, setMobileModal] = useState(null); // userId or null
    const [mobileInput, setMobileInput] = useState("");
    const [mobileLoading, setMobileLoading] = useState(false);

    // Name management state
    const [nameModal, setNameModal] = useState(null); // userId or null
    const [nameInput, setNameInput] = useState("");
    const [nameLoading, setNameLoading] = useState(false);

    // Full KYC Card / Data Inspector modal state
    const [kycModalUser, setKycModalUser] = useState(null);
    const [activeKycTab, setActiveKycTab] = useState("aadhaar"); // "aadhaar" | "pan" | "voter" | "raw"
    const [copiedJson, setCopiedJson] = useState(false);
    const [previewImage, setPreviewImage] = useState(null); // { url, title }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch all users
                const usersRes = await authFetch(`${apiUrl}/api/admin/customers`);
                const usersData = await usersRes.json();

                // Fetch stats for total user count
                const statsRes = await authFetch(`${apiUrl}/api/admin/stats`);
                const statsData = await statsRes.json();

                // Fetch verified users
                const verifiedRes = await authFetch(`${apiUrl}/api/admin/verified-users`);
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
            const response = await authFetch(`${apiUrl}/api/admin/customers/${userId}/suspend`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isSuspended: !currentStatus }),
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
            const response = await authFetch(`${apiUrl}/api/admin/customers/${nameModal}/name`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: nameInput }),
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
            const response = await authFetch(`${apiUrl}/api/admin/customers/${mobileModal}/mobile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mobileNumber: mobileInput }),
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
            const response = await authFetch(`${apiUrl}/api/admin/customers/${mobileModal}/mobile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ mobileNumber: "" }),
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

    const openKycModal = (user, defaultTab = "aadhaar") => {
        setKycModalUser(user);
        setActiveKycTab(defaultTab);
        setCopiedJson(false);
    };

    const closeKycModal = () => {
        setKycModalUser(null);
        setCopiedJson(false);
    };

    const handleCopyJson = (data) => {
        try {
            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            setCopiedJson(true);
            setTimeout(() => setCopiedJson(false), 2000);
        } catch (e) {
            console.error("Failed to copy JSON:", e);
        }
    };

    const isDummyUser = (user) => {
        if (!user) return false;
        if (typeof user === "object" && user.isDummy) return true;
        const email = (typeof user === "string" ? user : user.email || "").toLowerCase();
        const bio = (typeof user === "object" ? user.bio || "" : "").toLowerCase();
        const address = (typeof user === "object" ? user.aadhaarKyc?.address || "" : "").toLowerCase();
        const maskedAadhaar = (typeof user === "object" ? user.aadhaarKyc?.maskedAadhaar || "" : "");
        const name = (typeof user === "object" ? user.name || "" : "").toLowerCase();

        return (
            email.startsWith("dummy_") ||
            /_[0-9]{4,6}@/.test(email) ||
            email.includes("@example.com") ||
            email.includes("dummy") ||
            bio.includes("dummy") ||
            address.includes("sosign hub") ||
            maskedAadhaar.startsWith("XXXX-XXXX-") ||
            name.includes("dummy")
        );
    };

    const handleLoginAs = async (user) => {
        try {
            const response = await authFetch(`${apiUrl}/api/admin/customers/${user._id}/login-as`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
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

    const dummyUsers = useMemo(() => {
        const allList = [...users, ...verifiedUsers];
        const map = new Map();
        allList.forEach((u) => {
            if (u && u._id && isDummyUser(u)) {
                map.set(u._id.toString(), u);
            }
        });
        return Array.from(map.values());
    }, [users, verifiedUsers]);

    const genuineUsers = useMemo(() => {
        return users.filter((u) => !isDummyUser(u));
    }, [users]);

    // --- All / Genuine / Dummy Users sorting/filtering ---
    const sortedUsers = useMemo(() => {
        let items = activeTab === "dummy"
            ? [...dummyUsers]
            : activeTab === "genuine"
            ? [...genuineUsers]
            : [...users];

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
    }, [users, dummyUsers, genuineUsers, activeTab, searchTerm, sortConfig]);

    // --- Verified Users sorting/filtering ---
    const sortedVerifiedUsers = useMemo(() => {
        let items = [...verifiedUsers];
        if (verifiedSubFilter === "real") {
            items = items.filter((u) => !isDummyUser(u));
        } else if (verifiedSubFilter === "dummy") {
            items = items.filter((u) => isDummyUser(u));
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            items = items.filter(user =>
                user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.mobileNumber?.includes(term) ||
                user.aadhaarKyc?.name?.toLowerCase().includes(term) ||
                user.aadhaarKyc?.maskedAadhaar?.includes(term) ||
                user.aadhaarKyc?.address?.toLowerCase().includes(term) ||
                user.aadhaarKyc?.district?.toLowerCase().includes(term) ||
                user.aadhaarKyc?.state?.toLowerCase().includes(term) ||
                user.aadhaarKyc?.pincode?.includes(term) ||
                user.panKyc?.panNumber?.toLowerCase().includes(term) ||
                user.panKyc?.registeredName?.toLowerCase().includes(term) ||
                user.voterKyc?.voterId?.toLowerCase().includes(term) ||
                user.voterKyc?.registeredName?.toLowerCase().includes(term)
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
    }, [verifiedUsers, verifiedSubFilter, searchTerm, sortConfig]);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => setActiveTab("all")}>
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-users text-6xl text-indigo-600"></i>
                    </div>
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-gray-500 text-xs font-medium">Total Registered Users</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-gray-900">{totalUsers}</span>
                            <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                                <i className="fas fa-check-circle text-[10px]"></i>
                                Total
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => setActiveTab("genuine")}>
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-user-shield text-6xl text-emerald-600"></i>
                    </div>
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-gray-500 text-xs font-medium">Genuine Organic Users</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-emerald-900">{genuineUsers.length}</span>
                            <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                                <i className="fas fa-shield-alt text-[10px]"></i>
                                Organic Real
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => setActiveTab("verified")}>
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-user-check text-6xl text-teal-600"></i>
                    </div>
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-gray-500 text-xs font-medium">Verified Users (KYC)</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-gray-900">{verifiedUsers.length}</span>
                            <span className="text-teal-500 text-xs font-bold flex items-center gap-1">
                                <i className="fas fa-certificate text-[10px]"></i>
                                KYC Verified
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => setActiveTab("dummy")}>
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-robot text-6xl text-purple-600"></i>
                    </div>
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-gray-500 text-xs font-medium">Rapid Creation (Dummy Users)</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-purple-900">{dummyUsers.length}</span>
                            <span className="text-purple-600 text-xs font-bold flex items-center gap-1">
                                <i className="fas fa-bolt text-[10px]"></i>
                                Rapid Created
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1.5 rounded-2xl w-fit">
                <button
                    onClick={() => { setActiveTab("all"); setSearchTerm(""); setSortConfig({ key: "createdAt", direction: "desc" }); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
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
                    onClick={() => { setActiveTab("genuine"); setSearchTerm(""); setSortConfig({ key: "createdAt", direction: "desc" }); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                        activeTab === "genuine"
                            ? "bg-white text-emerald-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <i className="fas fa-user-shield text-xs text-emerald-600"></i>
                    Genuine Users
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                        activeTab === "genuine"
                            ? "bg-emerald-100 text-emerald-800 font-extrabold"
                            : "bg-emerald-100/60 text-emerald-700"
                    }`}>
                        {genuineUsers.length}
                    </span>
                </button>
                <button
                    onClick={() => { setActiveTab("verified"); setSearchTerm(""); setSortConfig({ key: "createdAt", direction: "desc" }); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
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
                <button
                    onClick={() => { setActiveTab("dummy"); setSearchTerm(""); setSortConfig({ key: "createdAt", direction: "desc" }); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                        activeTab === "dummy"
                            ? "bg-white text-purple-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    <i className="fas fa-robot text-xs text-purple-600"></i>
                    Dummy Users (Rapid Creation)
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                        activeTab === "dummy"
                            ? "bg-purple-100 text-purple-700 font-extrabold"
                            : "bg-purple-100/60 text-purple-600"
                    }`}>
                        {dummyUsers.length}
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
                            placeholder={
                                activeTab === "all"
                                    ? "Search all users by name, email, or mobile..."
                                    : activeTab === "dummy"
                                    ? "Search rapid creation dummy users..."
                                    : "Search by name, email, Aadhaar, PAN or Voter ID..."
                            }
                            className={`block w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 transition-all text-sm outline-none ${
                                activeTab === "all"
                                    ? "focus:ring-indigo-500/20 focus:border-indigo-500"
                                    : activeTab === "dummy"
                                    ? "focus:ring-purple-500/20 focus:border-purple-500"
                                    : "focus:ring-teal-500/20 focus:border-teal-500"
                            }`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-xs font-bold text-gray-500">
                        {activeTab === "dummy" && (
                            <span className="text-purple-700 flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                                <i className="fas fa-robot text-purple-600"></i>
                                Displaying <strong className="text-purple-900 font-extrabold">{sortedUsers.length}</strong> Rapid Creation Dummy Users (Both Verified & Unverified)
                            </span>
                        )}
                        {activeTab === "genuine" && (
                            <span className="text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                <i className="fas fa-user-shield text-emerald-600"></i>
                                Displaying <strong className="text-emerald-900 font-extrabold">{sortedUsers.length}</strong> Genuine Organic Users (Excludes Rapid Creation Accounts)
                            </span>
                        )}
                        {activeTab === "all" && (
                            <span className="text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                                Displaying <strong className="text-indigo-900 font-extrabold">{sortedUsers.length}</strong> total users
                            </span>
                        )}
                        {activeTab === "verified" && (
                            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                                <span className="text-gray-400 font-medium">Filter Verified:</span>
                                <button
                                    onClick={() => setVerifiedSubFilter("all")}
                                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                        verifiedSubFilter === "all" ? "bg-teal-700 text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    All Verified ({verifiedUsers.length})
                                </button>
                                <button
                                    onClick={() => setVerifiedSubFilter("real")}
                                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                        verifiedSubFilter === "real" ? "bg-emerald-700 text-white shadow-xs" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                    }`}
                                >
                                    🛡️ Real Verified ({verifiedUsers.filter((u) => !isDummyUser(u)).length})
                                </button>
                                <button
                                    onClick={() => setVerifiedSubFilter("dummy")}
                                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                        verifiedSubFilter === "dummy" ? "bg-purple-700 text-white shadow-xs" : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                                    }`}
                                >
                                    🤖 Rapid Dummy Verified ({verifiedUsers.filter((u) => isDummyUser(u)).length})
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* All Users / Genuine Users / Dummy Users Table */}
                {(activeTab === "all" || activeTab === "genuine" || activeTab === "dummy") && (
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
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-gray-900">{user.name || "Unnamed User"}</span>
                                                            {isDummyUser(user) && (
                                                                <span 
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 cursor-help shrink-0"
                                                                    title="Rapid Creation Dummy Account (Default Password: dummy_password_12345)"
                                                                >
                                                                    <i className="fas fa-robot text-[9px]"></i> Rapid Dummy
                                                                </span>
                                                            )}
                                                            {user.aadhaarKyc?.status === "verified" && (
                                                                <button
                                                                    onClick={() => openKycModal(user, "aadhaar")}
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-all cursor-pointer shrink-0"
                                                                    title="Aadhaar Verified - Click to view full Aadhaar card & address"
                                                                >
                                                                    <i className="fas fa-id-card text-[9px] text-blue-600"></i> Aadhaar KYC
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => openNameModal(user)}
                                                                className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                                title="Edit user name"
                                                            >
                                                                <i className="fas fa-pen text-[10px]"></i>
                                                            </button>
                                                        </div>
                                                        {user.aadhaarKyc?.status === "verified" && user.aadhaarKyc?.name && user.aadhaarKyc.name !== user.name && (
                                                            <span className="text-[11px] text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                                                                <i className="fas fa-id-badge text-[9px]"></i> Aadhaar Name: {user.aadhaarKyc.name}
                                                            </span>
                                                        )}
                                                    </div>
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
                                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                                    {user.aadhaarKyc?.status === "verified" && (
                                                        <button
                                                            onClick={() => openKycModal(user, "aadhaar")}
                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                                            title="View full Aadhaar Card & Address"
                                                        >
                                                            <i className="fas fa-id-card text-blue-600"></i>
                                                            KYC
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleToggleSuspension(user._id, user.isSuspended)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                            user.isSuspended
                                                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                                                                : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                                        }`}
                                                    >
                                                        {user.isSuspended ? "Unsuspend" : "Suspend"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleLoginAs(user)}
                                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
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
                                    <th className="px-6 py-4 text-sm font-bold text-gray-600">Verified Identity & Documents</th>
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
                                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center border border-teal-200/50 shadow-xs">
                                                        <i className="fas fa-user-check text-teal-600 text-base"></i>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-gray-900">{user.name}</span>
                                                            {isDummyUser(user) && (
                                                                <span 
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 cursor-help shrink-0"
                                                                    title="Rapid Creation Dummy Account (Default Password: dummy_password_12345)"
                                                                >
                                                                    <i className="fas fa-robot text-[9px]"></i> Rapid Dummy
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500">{user.email}</span>
                                                        {user.mobileNumber && (
                                                            <span className="text-[11px] text-gray-600 flex items-center gap-1 mt-0.5">
                                                                <i className="fas fa-phone text-[9px] text-gray-400"></i> {user.mobileNumber}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2 min-w-[280px] max-w-[400px]">
                                                    {/* Aadhaar Card Preview Box */}
                                                    {user.aadhaarKyc?.status === "verified" && (
                                                        <div className="p-3 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white rounded-xl border border-blue-200 shadow-xs">
                                                            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-blue-100">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]">
                                                                        <i className="fas fa-id-card"></i>
                                                                    </div>
                                                                    <span className="text-[11px] font-black text-blue-950 uppercase tracking-tight">Aadhaar (UIDAI)</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => openKycModal(user, "aadhaar")}
                                                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-extrabold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                                                    title="View complete Aadhaar Card, Address, DOB, Gender, and Raw Data"
                                                                >
                                                                    <i className="fas fa-eye text-[9px]"></i> View Full Aadhaar
                                                                </button>
                                                            </div>
                                                            <div className="mt-2 space-y-1 text-xs">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-gray-500 font-medium">Aadhaar No:</span>
                                                                    <span className="font-mono font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                                                        {user.aadhaarKyc.maskedAadhaar || "XXXX-XXXX-XXXX"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-gray-500 font-medium">Name on Card:</span>
                                                                    <span className="font-bold text-gray-800 truncate max-w-[170px]" title={user.aadhaarKyc.name || user.name}>
                                                                        {user.aadhaarKyc.name || user.name}
                                                                    </span>
                                                                </div>
                                                                {(user.aadhaarKyc.dob || user.aadhaarKyc.gender) && (
                                                                    <div className="flex items-center justify-between gap-2 text-[11px]">
                                                                        <span className="text-gray-500 font-medium">DOB / Gender:</span>
                                                                        <span className="text-gray-700">
                                                                            {user.aadhaarKyc.dob || "—"}{user.aadhaarKyc.gender ? ` (${user.aadhaarKyc.gender})` : ""}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {(user.aadhaarKyc.address || user.aadhaarKyc.state || user.aadhaarKyc.pincode) && (
                                                                    <div className="pt-1.5 border-t border-blue-100/70 text-[11px] text-gray-600">
                                                                        <span className="text-gray-400 font-medium">Address: </span>
                                                                        <span className="text-gray-800 font-medium line-clamp-1" title={user.aadhaarKyc.address || `${user.aadhaarKyc.district || ""} ${user.aadhaarKyc.state || ""} ${user.aadhaarKyc.pincode || ""}`}>
                                                                            {user.aadhaarKyc.address || `${user.aadhaarKyc.district ? user.aadhaarKyc.district + ", " : ""}${user.aadhaarKyc.state || ""} ${user.aadhaarKyc.pincode || ""}`}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* PAN Card Pill */}
                                                    {user.panKyc?.status === "verified" && (
                                                        <div className="p-2 bg-amber-50/80 rounded-lg border border-amber-200 flex items-center justify-between gap-2">
                                                            <div className="text-xs">
                                                                <span className="text-amber-900 font-extrabold mr-1">PAN:</span>
                                                                <span className="font-mono font-bold text-gray-900">{user.panKyc.panNumber}</span>
                                                                {user.panKyc.registeredName && <span className="text-gray-600 text-[11px] ml-1.5">({user.panKyc.registeredName})</span>}
                                                            </div>
                                                            <button
                                                                onClick={() => openKycModal(user, "pan")}
                                                                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold"
                                                            >
                                                                View PAN
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Voter ID Pill */}
                                                    {user.voterKyc?.status === "verified" && (
                                                        <div className="p-2 bg-purple-50/80 rounded-lg border border-purple-200 flex items-center justify-between gap-2">
                                                            <div className="text-xs">
                                                                <span className="text-purple-900 font-extrabold mr-1">Voter ID:</span>
                                                                <span className="font-mono font-bold text-gray-900">{user.voterKyc.voterId}</span>
                                                                {user.voterKyc.registeredName && <span className="text-gray-600 text-[11px] ml-1.5">({user.voterKyc.registeredName})</span>}
                                                            </div>
                                                            <button
                                                                onClick={() => openKycModal(user, "voter")}
                                                                className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold"
                                                            >
                                                                View Voter
                                                            </button>
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
                                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => openKycModal(user, "aadhaar")}
                                                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                                                        title="Inspect full Aadhaar card data and address"
                                                    >
                                                        <i className="fas fa-id-card text-blue-600"></i>
                                                        KYC Data
                                                    </button>
                                                    <button
                                                        onClick={() => handleLoginAs(user)}
                                                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
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

            {/* Comprehensive Aadhaar / Identity KYC Modal */}
            {kycModalUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                        {/* Top Government-Style Tricolor Accent Strip */}
                        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600"></div>

                        {/* Modal Header */}
                        <div className="p-6 bg-gradient-to-r from-gray-900 via-slate-900 to-blue-950 text-white flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner flex-shrink-0">
                                    <i className="fas fa-id-card text-2xl"></i>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                            UIDAI / e-KYC Record
                                        </span>
                                        {kycModalUser.aadhaarKyc?.status === "verified" ? (
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-400/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                Aadhaar Verified
                                            </span>
                                        ) : (
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-white/10 px-2 py-0.5 rounded">
                                                Not Verified
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-extrabold text-white mt-1">
                                        {kycModalUser.aadhaarKyc?.name || kycModalUser.name}
                                    </h3>
                                    <p className="text-xs text-blue-200/80 font-mono">
                                        {kycModalUser.email} {kycModalUser.mobileNumber ? `• +91 ${kycModalUser.mobileNumber}` : ""}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeKycModal}
                                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
                                title="Close"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-gray-200 bg-gray-50 px-6 gap-2 pt-2">
                            <button
                                onClick={() => setActiveKycTab("aadhaar")}
                                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                                    activeKycTab === "aadhaar"
                                        ? "bg-white text-blue-700 border-blue-600 shadow-xs"
                                        : "text-gray-500 hover:text-gray-800 border-transparent"
                                }`}
                            >
                                <i className="fas fa-id-card text-blue-600"></i>
                                Aadhaar Card
                                {kycModalUser.aadhaarKyc?.status === "verified" && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                )}
                            </button>

                            {kycModalUser.panKyc?.status === "verified" && (
                                <button
                                    onClick={() => setActiveKycTab("pan")}
                                    className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                                        activeKycTab === "pan"
                                            ? "bg-white text-amber-700 border-amber-600 shadow-xs"
                                            : "text-gray-500 hover:text-gray-800 border-transparent"
                                    }`}
                                >
                                    <i className="fas fa-credit-card text-amber-600"></i>
                                    PAN Card
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                </button>
                            )}

                            {kycModalUser.voterKyc?.status === "verified" && (
                                <button
                                    onClick={() => setActiveKycTab("voter")}
                                    className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                                        activeKycTab === "voter"
                                            ? "bg-white text-purple-700 border-purple-600 shadow-xs"
                                            : "text-gray-500 hover:text-gray-800 border-transparent"
                                    }`}
                                >
                                    <i className="fas fa-vote-yea text-purple-600"></i>
                                    Voter ID
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                </button>
                            )}

                            <button
                                onClick={() => setActiveKycTab("raw")}
                                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
                                    activeKycTab === "raw"
                                        ? "bg-white text-gray-900 border-gray-700 shadow-xs"
                                        : "text-gray-500 hover:text-gray-800 border-transparent"
                                }`}
                            >
                                <i className="fas fa-code text-gray-500"></i>
                                Raw JSON Payload
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-gray-50/30">
                            {/* TAB 1: AADHAAR CARD DETAILS */}
                            {activeKycTab === "aadhaar" && (
                                <div className="space-y-6">
                                    {/* Visual Digital Aadhaar Card */}
                                    <div className="relative bg-gradient-to-br from-amber-50/40 via-white to-blue-50/50 rounded-2xl p-6 border-2 border-blue-200/80 shadow-md overflow-hidden">
                                        {/* Card Security Background Watermark */}
                                        <div className="absolute right-4 bottom-2 opacity-5 pointer-events-none text-9xl font-black text-blue-900 select-none">
                                            UIDAI
                                        </div>

                                        {/* Card Top Strip */}
                                        <div className="flex items-center justify-between border-b border-gray-200/80 pb-3 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                                    🇮🇳
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">भारत सरकार / Government of India</h4>
                                                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-tight">भारतीय विशिष्ट पहचान प्राधिकरण / UIDAI</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shadow-xs">
                                                <i className="fas fa-check-circle"></i> Authenticated
                                            </span>
                                        </div>

                                        {/* Card Body with Profile & Core Information */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                                            {/* Profile Photo / Avatar Column */}
                                            <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-200 shadow-xs text-center">
                                                {kycModalUser.aadhaarKyc?.profileImage ? (
                                                    <div
                                                        className="w-28 h-36 rounded-lg overflow-hidden border border-gray-300 shadow-inner bg-gray-100 mb-2 cursor-pointer group relative"
                                                        onClick={() => {
                                                            const imgSrc = kycModalUser.aadhaarKyc.profileImage.startsWith("data:")
                                                                ? kycModalUser.aadhaarKyc.profileImage
                                                                : `data:image/jpeg;base64,${kycModalUser.aadhaarKyc.profileImage}`;
                                                            setPreviewImage({
                                                                url: imgSrc,
                                                                title: `Verified Aadhaar Biometric Photo - ${kycModalUser.aadhaarKyc.name || kycModalUser.name}`
                                                            });
                                                        }}
                                                        title="Click to view enlarged biometric photo"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={
                                                                kycModalUser.aadhaarKyc.profileImage.startsWith("data:")
                                                                    ? kycModalUser.aadhaarKyc.profileImage
                                                                    : `data:image/jpeg;base64,${kycModalUser.aadhaarKyc.profileImage}`
                                                            }
                                                            alt="Aadhaar Photo"
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                        />
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                                                            <i className="fas fa-search-plus"></i>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-28 h-36 rounded-lg bg-gradient-to-b from-blue-50 to-indigo-100 border border-blue-200 flex flex-col items-center justify-center text-blue-600 mb-2">
                                                        <i className="fas fa-user-tie text-4xl mb-2 text-blue-400"></i>
                                                        <span className="text-[9px] font-bold uppercase text-blue-700">Digital KYC</span>
                                                    </div>
                                                )}
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Verified Biometrics</span>
                                            </div>

                                            {/* Main Aadhaar Attributes */}
                                            <div className="md:col-span-8 space-y-3.5">
                                                <div>
                                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Full Name (As on Aadhaar)</p>
                                                    <p className="text-lg font-black text-gray-900 mt-0.5">
                                                        {kycModalUser.aadhaarKyc?.name || kycModalUser.name}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-xs">
                                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Date of Birth (DOB)</p>
                                                        <p className="text-xs font-bold text-gray-800 mt-0.5 flex items-center gap-1.5">
                                                            <i className="fas fa-birthday-cake text-blue-500 text-[10px]"></i>
                                                            {kycModalUser.aadhaarKyc?.dob || "Not specified"}
                                                        </p>
                                                    </div>
                                                    <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-xs">
                                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Gender</p>
                                                        <p className="text-xs font-bold text-gray-800 mt-0.5 flex items-center gap-1.5">
                                                            <i className="fas fa-venus-mars text-indigo-500 text-[10px]"></i>
                                                            {kycModalUser.aadhaarKyc?.gender || "Not specified"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {kycModalUser.aadhaarKyc?.careOf && (
                                                    <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-xs">
                                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Care Of (Father / Husband / Guardian)</p>
                                                        <p className="text-xs font-bold text-gray-800 mt-0.5">
                                                            {kycModalUser.aadhaarKyc.careOf}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Aadhaar Number Display Banner */}
                                                <div className="p-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl text-white shadow-sm flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[9px] uppercase font-extrabold text-blue-300 tracking-widest block">Aadhaar Number</span>
                                                        <span className="text-base font-mono font-black tracking-widest text-white">
                                                            {kycModalUser.aadhaarKyc?.maskedAadhaar || "XXXX-XXXX-XXXX"}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(kycModalUser.aadhaarKyc?.maskedAadhaar || "");
                                                            alert("Aadhaar Number copied to clipboard!");
                                                        }}
                                                        className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                                        title="Copy Aadhaar Number"
                                                    >
                                                        <i className="fas fa-copy"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Card Tagline */}
                                        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                                            <span className="text-[11px] font-black text-red-700 tracking-wide">
                                                मेरा आधार, मेरी पहचान (Mera Aadhaar, Meri Pehchan)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Complete Address Card */}
                                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                                                <i className="fas fa-map-marked-alt"></i>
                                            </div>
                                            <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-tight">Full Residential Address (As Per Aadhaar)</h4>
                                        </div>
                                        <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs font-semibold text-gray-800 leading-relaxed">
                                            {kycModalUser.aadhaarKyc?.address || (
                                                <span className="text-gray-400 italic">Complete address text was not provided in this verification payload.</span>
                                            )}
                                        </div>

                                        {/* Address Breakdown Badges */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block">District</span>
                                                <span className="text-xs font-bold text-gray-800 mt-0.5 block truncate">
                                                    {kycModalUser.aadhaarKyc?.district || "N/A"}
                                                </span>
                                            </div>
                                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block">State</span>
                                                <span className="text-xs font-bold text-gray-800 mt-0.5 block truncate">
                                                    {kycModalUser.aadhaarKyc?.state || "N/A"}
                                                </span>
                                            </div>
                                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block">PIN Code</span>
                                                <span className="text-xs font-bold font-mono text-gray-800 mt-0.5 block">
                                                    {kycModalUser.aadhaarKyc?.pincode || "N/A"}
                                                </span>
                                            </div>
                                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 block">Country</span>
                                                <span className="text-xs font-bold text-gray-800 mt-0.5 block">
                                                    {kycModalUser.aadhaarKyc?.country || "India"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verification Audit Details & Cross-Check */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Verification Audit */}
                                        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-2.5">
                                            <h5 className="text-xs font-extrabold text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                                                <i className="fas fa-shield-check text-blue-600"></i>
                                                Verification Audit Trail
                                            </h5>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between py-1 border-b border-gray-100">
                                                    <span className="text-gray-500 font-medium">Verification Method:</span>
                                                    <span className="font-bold text-gray-800">
                                                        {kycModalUser.aadhaarKyc?.verificationMethod === "digilocker"
                                                            ? "DigiLocker OAuth (Govt. e-KYC)"
                                                            : kycModalUser.aadhaarKyc?.verificationMethod === "ocr"
                                                            ? "Dual-Side Card OCR Scan"
                                                            : "Direct Aadhaar OTP / API"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-1 border-b border-gray-100">
                                                    <span className="text-gray-500 font-medium">Verification Date:</span>
                                                    <span className="font-bold text-gray-800">
                                                        {formatDateWithTime(kycModalUser.aadhaarKyc?.verifiedAt || kycModalUser.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-1">
                                                    <span className="text-gray-500 font-medium">Legal Status:</span>
                                                    <span className="font-bold text-emerald-600">Legally Verified (IT Act 2000)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Account Cross-Check */}
                                        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-2.5">
                                            <h5 className="text-xs font-extrabold text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                                                <i className="fas fa-user-check text-teal-600"></i>
                                                Platform Account Matching
                                            </h5>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between py-1 border-b border-gray-100">
                                                    <span className="text-gray-500 font-medium">Account Name:</span>
                                                    <span className="font-bold text-gray-800">{kycModalUser.name}</span>
                                                </div>
                                                <div className="flex justify-between py-1 border-b border-gray-100">
                                                    <span className="text-gray-500 font-medium">Name Match Status:</span>
                                                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                                                        <i className="fas fa-check-circle text-xs"></i>
                                                        {kycModalUser.aadhaarKyc?.name && kycModalUser.aadhaarKyc.name.toLowerCase().trim() === kycModalUser.name?.toLowerCase().trim()
                                                            ? "Exact Match (100%)"
                                                            : "Verified Profile"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-1">
                                                    <span className="text-gray-500 font-medium">Account Type:</span>
                                                    <span className="font-bold text-gray-800">
                                                        {isDummyUser(kycModalUser) ? "🤖 Rapid Creation Dummy" : "🛡️ Genuine Organic User"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: PAN CARD DETAILS */}
                            {activeKycTab === "pan" && kycModalUser.panKyc?.status === "verified" && (
                                <div className="space-y-4">
                                    <div className="p-6 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 rounded-2xl border-2 border-amber-200 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg font-bold">
                                                    <i className="fas fa-credit-card"></i>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-extrabold text-amber-950 uppercase">Income Tax Department (Govt. of India)</h4>
                                                    <p className="text-xs text-amber-700 font-semibold">Permanent Account Number (PAN) Card Verification</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-amber-800 bg-amber-200/80 px-2.5 py-1 rounded-full uppercase">
                                                Verified
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-3 bg-white rounded-xl border border-gray-100">
                                                <span className="text-[10px] font-extrabold uppercase text-gray-400 block">PAN Number</span>
                                                <span className="text-base font-mono font-black text-gray-900 mt-0.5 block">{kycModalUser.panKyc.panNumber}</span>
                                            </div>
                                            <div className="p-3 bg-white rounded-xl border border-gray-100">
                                                <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Registered Name on PAN</span>
                                                <span className="text-sm font-bold text-gray-900 mt-0.5 block">{kycModalUser.panKyc.registeredName || "N/A"}</span>
                                            </div>
                                            <div className="p-3 bg-white rounded-xl border border-gray-100">
                                                <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Father&apos;s Name</span>
                                                <span className="text-sm font-bold text-gray-800 mt-0.5 block">{kycModalUser.panKyc.fatherName || "N/A"}</span>
                                            </div>
                                            <div className="p-3 bg-white rounded-xl border border-gray-100">
                                                <span className="text-[10px] font-extrabold uppercase text-gray-400 block">PAN Card Type</span>
                                                <span className="text-sm font-bold text-gray-800 mt-0.5 block uppercase">{kycModalUser.panKyc.panType || "Individual"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: VOTER ID DETAILS */}
                            {activeKycTab === "voter" && kycModalUser.voterKyc?.status === "verified" && (
                                <div className="space-y-4">
                                    <div className="p-6 bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 rounded-2xl border-2 border-purple-200 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between border-b border-purple-200/80 pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg font-bold">
                                                    <i className="fas fa-vote-yea"></i>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-extrabold text-purple-950 uppercase">Election Commission of India (ECI)</h4>
                                                    <p className="text-xs text-purple-700 font-semibold">Electoral Photo Identity Card (EPIC / Voter ID)</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-purple-800 bg-purple-200/80 px-2.5 py-1 rounded-full uppercase">
                                                Verified
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-3 bg-white rounded-xl border border-gray-100">
                                                <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Voter ID (EPIC Number)</span>
                                                <span className="text-base font-mono font-black text-gray-900 mt-0.5 block">{kycModalUser.voterKyc.voterId}</span>
                                            </div>
                                            <div className="p-3 bg-white rounded-xl border border-gray-100">
                                                <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Elector Name</span>
                                                <span className="text-sm font-bold text-gray-900 mt-0.5 block">{kycModalUser.voterKyc.registeredName || "N/A"}</span>
                                            </div>
                                            <div className="p-3 bg-white rounded-xl border border-gray-100">
                                                <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Relation Name & Type</span>
                                                <span className="text-sm font-bold text-gray-800 mt-0.5 block">
                                                    {kycModalUser.voterKyc.relation || "N/A"} {kycModalUser.voterKyc.relationType ? `(${kycModalUser.voterKyc.relationType})` : ""}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-white rounded-xl border border-gray-100">
                                                <span className="text-[10px] font-extrabold uppercase text-gray-400 block">District & Area</span>
                                                <span className="text-sm font-bold text-gray-800 mt-0.5 block">
                                                    {kycModalUser.voterKyc.district || kycModalUser.voterKyc.area || "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: RAW JSON PAYLOAD INSPECTOR */}
                            {activeKycTab === "raw" && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-extrabold text-gray-700 uppercase tracking-tight">Complete Raw JSON Data from KYC Gateway</span>
                                        <button
                                            onClick={() => handleCopyJson({
                                                user: {
                                                    _id: kycModalUser._id,
                                                    name: kycModalUser.name,
                                                    email: kycModalUser.email,
                                                    mobileNumber: kycModalUser.mobileNumber,
                                                    isDummy: kycModalUser.isDummy,
                                                },
                                                aadhaarKyc: kycModalUser.aadhaarKyc,
                                                panKyc: kycModalUser.panKyc,
                                                voterKyc: kycModalUser.voterKyc,
                                            })}
                                            className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                        >
                                            {copiedJson ? (
                                                <>
                                                    <i className="fas fa-check text-emerald-400"></i> Copied to Clipboard!
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-copy"></i> Copy Raw JSON
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <pre className="p-4 bg-gray-900 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-[50vh] border border-gray-800 leading-relaxed shadow-inner">
                                        {JSON.stringify(
                                            {
                                                user: {
                                                    _id: kycModalUser._id,
                                                    name: kycModalUser.name,
                                                    email: kycModalUser.email,
                                                    mobileNumber: kycModalUser.mobileNumber,
                                                    isDummy: kycModalUser.isDummy,
                                                },
                                                aadhaarKyc: kycModalUser.aadhaarKyc || {},
                                                panKyc: kycModalUser.panKyc || {},
                                                voterKyc: kycModalUser.voterKyc || {},
                                            },
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                <i className="fas fa-lock text-gray-400"></i>
                                Protected Admin Data View
                            </span>
                            <button
                                onClick={closeKycModal}
                                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Image Lightbox Modal */}
            {previewImage && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="relative max-w-4xl w-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col items-center p-4">
                        <div className="w-full flex items-center justify-between pb-3 border-b border-gray-800 mb-3 text-white">
                            <span className="text-sm font-bold flex items-center gap-2">
                                <i className="fas fa-id-card text-blue-400"></i>
                                {previewImage.title}
                            </span>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewImage.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <i className="fas fa-download"></i> Download Image
                                </a>
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div className="w-full max-h-[75vh] flex items-center justify-center overflow-auto p-2 bg-black/40 rounded-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewImage.url}
                                alt={previewImage.title}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
