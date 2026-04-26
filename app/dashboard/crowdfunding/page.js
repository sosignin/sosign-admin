"use client";

import { useState, useEffect } from "react";

export default function CrowdfundingApproval() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [viewingDonations, setViewingDonations] = useState(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${apiUrl}/api/crowdfunding/admin/all`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data);
            }
        } catch (err) {
            console.error("Failed to fetch campaigns:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleStatusUpdate = async (id, approved) => {
        try {
            setUpdatingId(id);
            const res = await fetch(`${apiUrl}/api/crowdfunding/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ approved }),
                credentials: "include",
            });
            if (res.ok) {
                setCampaigns(campaigns.map(c => c._id === id ? { ...c, approved } : c));
            }
        } catch (err) {
            console.error("Failed to update status:", err);
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500"><i className="fas fa-spinner fa-spin mr-2"></i> Loading campaigns...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Crowdfunding Management</h1>
                    <p className="text-gray-500">Approve or reject fundraising campaigns</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Creator</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Goal / Raised</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {campaigns.map((c) => (
                                <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                {c.image ? <img src={c.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><i className="fas fa-image"></i></div>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 line-clamp-1">{c.title}</p>
                                                <p className="text-xs text-gray-400">{c.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-gray-700">{c.creator?.name}</p>
                                        <p className="text-xs text-gray-400">{c.creator?.email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-gray-800">₹{c.raisedAmount.toLocaleString()}</p>
                                        <p className="text-xs text-gray-400">of ₹{c.goalAmount.toLocaleString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                            {c.approved ? "Approved" : "Pending"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setViewingDonations(c)}
                                                className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors"
                                            >
                                                Donations
                                            </button>
                                            {!c.approved ? (
                                                <button
                                                    onClick={() => handleStatusUpdate(c._id, true)}
                                                    disabled={updatingId === c._id}
                                                    className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                                >
                                                    Approve
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStatusUpdate(c._id, false)}
                                                    disabled={updatingId === c._id}
                                                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Donations Modal */}
            {viewingDonations && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">Campaign Donations</h3>
                                <p className="text-gray-500 text-sm">{viewingDonations.title}</p>
                            </div>
                            <button onClick={() => setViewingDonations(null)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {viewingDonations.donations?.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-xs font-bold text-gray-400 uppercase">Donor</th>
                                            <th className="px-4 py-2 text-xs font-bold text-gray-400 uppercase">Amount</th>
                                            <th className="px-4 py-2 text-xs font-bold text-gray-400 uppercase">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {viewingDonations.donations.map((d, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-700">{d.donorName}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-green-600">₹{d.amount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-center py-12 text-gray-400 italic">No donations found for this campaign.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
