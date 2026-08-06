"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authFetch } from "@/utils/api";

export default function WalletRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await authFetch(`${apiUrl}/api/wallet-requests/admin/all${filter ? `?status=${filter}` : ""}`);
            const data = await res.json();
            if (res.ok) {
                setRequests(data.requests);
            }
        } catch (err) {
            console.error("Failed to fetch requests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const handleAction = async (requestId, action) => {
        setActionLoading(requestId);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await authFetch(`${apiUrl}/api/wallet-requests/admin/${action}/${requestId}`, {
                method: "PUT",
            });
            if (res.ok) {
                fetchRequests();
            } else {
                const data = await res.json();
                alert(data.message || "Action failed");
            }
        } catch (err) {
            console.error(`Failed to ${action} request:`, err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Wallet Recharge Requests</h1>
                    <p className="text-gray-500">Manage manual UPI payment verifications</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    {["", "pending", "verification_pending", "approved", "rejected"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === status
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            {status === "" ? "All" : status.replace("_", " ").toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Points</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reference ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Proof</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-4">
                                            <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        No recharge requests found
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={req._id}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800">{req.userId?.name || "Deleted User"}</span>
                                                <span className="text-xs text-gray-500">{req.userId?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-gray-700">₹{req.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 font-bold text-blue-600">{req.points.toLocaleString()} Pts</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{req.referenceId}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.screenshot ? (
                                                <button
                                                    onClick={() => setSelectedImage(req.screenshot)}
                                                    className="w-12 h-12 rounded-lg border-2 border-white shadow-sm overflow-hidden hover:scale-110 transition-transform bg-gray-100"
                                                >
                                                    <img src={req.screenshot} alt="Proof" className="w-full h-full object-cover" />
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No proof</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === "approved" ? "bg-green-100 text-green-700" :
                                                req.status === "rejected" ? "bg-red-100 text-red-700" :
                                                    req.status === "verification_pending" ? "bg-orange-100 text-orange-700" :
                                                        "bg-gray-100 text-gray-700"
                                                }`}>
                                                {req.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.status !== "approved" && req.status !== "rejected" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(req._id, "approve")}
                                                            disabled={actionLoading === req._id}
                                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(req._id, "reject")}
                                                            disabled={actionLoading === req._id}
                                                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {req.status === "approved" && (
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <i className="fas fa-check-circle text-green-500"></i> Verified
                                                    </span>
                                                )}
                                                {req.status === "rejected" && (
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <i className="fas fa-times-circle text-red-500"></i> Rejected
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                            <img src={selectedImage} alt="Payment Proof Full" className="w-full max-h-[80vh] object-contain" />
                            <div className="p-6 bg-white flex justify-end gap-4">
                                <a
                                    href={selectedImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    Open Original
                                </a>
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
