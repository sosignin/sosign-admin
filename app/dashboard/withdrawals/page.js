"use client";

import { useState, useEffect } from "react";

export default function WithdrawalRequests() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [message, setMessage] = useState("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/withdrawals`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setWithdrawals(data);
            }
        } catch (err) {
            console.error("Failed to fetch withdrawals:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const handleUpdate = async (id, status) => {
        try {
            setUpdatingId(id);
            const res = await fetch(`${apiUrl}/api/withdrawals/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, adminMessage: message }),
                credentials: "include",
            });
            if (res.ok) {
                setWithdrawals(withdrawals.map(w => w._id === id ? { ...w, status, adminMessage: message } : w));
                setMessage("");
            }
        } catch (err) {
            console.error("Failed to update withdrawal:", err);
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500"><i className="fas fa-spinner fa-spin mr-2"></i> Loading requests...</div>;
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Withdrawal Requests</h1>
                <p className="text-gray-500">Manage fund withdrawal requests from campaign creators</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {withdrawals.map((w) => (
                                <tr key={w._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-gray-800">{w.user?.name}</p>
                                        <p className="text-xs text-gray-400">{w.user?.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-700 line-clamp-1">{w.campaign?.title}</p>
                                        <p className="text-xs text-gray-400">Raised: ₹{w.campaign?.raisedAmount?.toLocaleString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-lg font-bold text-blue-600">₹{w.amount.toLocaleString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs space-y-1">
                                            <p><span className="text-gray-400">Account:</span> {w.bankDetails?.accountNumber}</p>
                                            <p><span className="text-gray-400">Bank:</span> {w.bankDetails?.bankName}</p>
                                            <p><span className="text-gray-400">IFSC:</span> {w.bankDetails?.ifscCode}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            w.status === "approved" ? "bg-green-100 text-green-800" : 
                                            w.status === "rejected" ? "bg-red-100 text-red-800" : 
                                            "bg-yellow-100 text-yellow-800"
                                        }`}>
                                            {w.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {w.status === "pending" ? (
                                            <div className="flex flex-col gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Admin message..."
                                                    className="text-xs p-1 border rounded"
                                                    onChange={(e) => setMessage(e.target.value)}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdate(w._id, "approved")}
                                                        disabled={updatingId === w._id}
                                                        className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded hover:bg-green-600 disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdate(w._id, "rejected")}
                                                        disabled={updatingId === w._id}
                                                        className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded hover:bg-red-600 disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-gray-400 italic">{w.adminMessage || "No message"}</p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
