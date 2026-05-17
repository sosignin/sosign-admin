"use client";

import { useState, useEffect, useMemo } from "react";

export default function VerifiedUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${apiUrl}/api/admin/verified-users`, {
                    credentials: "include",
                });
                const data = await response.json();

                if (data.success) {
                    setUsers(data.users || []);
                } else {
                    setError(data.message || "Failed to fetch verified users.");
                }
            } catch (err) {
                console.error("Failed to fetch verified users:", err);
                setError("Failed to load verified users data.");
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

    const sortedUsers = useMemo(() => {
        let items = [...users];
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
            // Handle nested keys (e.g., 'aadhaarKyc.verifiedAt')
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
    }, [users, searchTerm, sortConfig]);

    const formatDate = (dateString) => {
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
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-100 border-t-teal-600"></div>
                    <p className="text-gray-500 font-medium">Loading verified users...</p>
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Verified Users</h1>
                    <p className="text-gray-500 mt-1">Users who have completed identity verification</p>
                </div>
                <div className="bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-200">
                        <i className="fas fa-user-check text-white"></i>
                    </div>
                    <div>
                        <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">Total Verified</p>
                        <p className="text-xl font-black text-teal-900 leading-none">{users.length}</p>
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
                            placeholder="Search by name, email, Aadhaar, PAN or Voter ID..."
                            className="block w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm outline-none"
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedUsers.length > 0 ? (
                                sortedUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-teal-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center border border-teal-200/50">
                                                    <i className="fas fa-user text-teal-600"></i>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{user.name}</span>
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
                                                <span className="text-sm font-medium">{formatDate(user.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-teal-100 text-teal-700 uppercase tracking-wider border border-teal-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                                                Verified
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center">
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

                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 text-sm text-gray-500">
                    <p>Displaying <span className="font-bold text-gray-900">{sortedUsers.length}</span> verified users</p>
                </div>
            </div>
        </div>
    );
}
