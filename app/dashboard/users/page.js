"use client";

import { useState, useEffect, useMemo } from "react";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch users
                const usersRes = await fetch(`${apiUrl}/api/admin/customers`, {
                    credentials: "include",
                });
                const usersData = await usersRes.json();

                // Fetch stats for total user count
                const statsRes = await fetch(`${apiUrl}/api/admin/stats`, {
                    credentials: "include",
                });
                const statsData = await statsRes.json();

                if (Array.isArray(usersData)) {
                    setUsers(usersData);
                } else {
                    console.error("Users data is not an array:", usersData);
                    setUsers([]);
                }

                if (statsData.success) {
                    setTotalUsers(statsData.stats.totalUsers);
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

    const sortedUsers = useMemo(() => {
        let items = [...users];
        if (searchTerm) {
            items = items.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
                {/* Header Actions removed as requested */}
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
                {/* Placeholder stats */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <i className="fas fa-calendar-alt text-6xl text-emerald-600"></i>
                    </div>
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-gray-500 text-sm font-medium">New This Week</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900">--</span>
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
                            placeholder="Search by name or email..."
                            className="block w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none"
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
                                <th onClick={() => handleSort("createdAt")} className="px-6 py-4 text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-100/50 transition-colors group">
                                    <div className="flex items-center gap-2">
                                        Joined Date
                                        <i className={`fas fa-sort text-[10px] transition-opacity ${sortConfig.key === "createdAt" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></i>
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-600 text-center">Status</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-600 text-center">Action</th>
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
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <i className="fas fa-envelope text-xs"></i>
                                                <span className="text-sm">{user.email}</span>
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
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
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

                {/* Pagination Placeholder */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <p>Showing <span className="font-bold text-gray-900">{sortedUsers.length}</span> of <span className="font-bold text-gray-900">{totalUsers}</span> users</p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-all disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-all disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
