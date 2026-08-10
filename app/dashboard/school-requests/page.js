"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";

export default function AdminSchoolRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchRequests = async (status = statusFilter) => {
    try {
      setLoading(true);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/school-requests?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.schools || []);
      }
    } catch (err) {
      console.error("Failed to fetch school requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(statusFilter);
  }, [statusFilter]);

  const handleApprove = async (schoolId) => {
    try {
      setActionLoading(schoolId);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/school-requests/${schoolId}/approve`, {
        method: "PUT",
      });
      if (res.ok) {
        await fetchRequests(statusFilter);
      } else {
        alert("Failed to approve school request.");
      }
    } catch (err) {
      alert("Error approving school request: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (schoolId) => {
    if (!confirm("Are you sure you want to reject this school request?")) return;
    try {
      setActionLoading(schoolId);
      const res = await authFetch(`${apiUrl}/api/stall-reports/admin/school-requests/${schoolId}/reject`, {
        method: "PUT",
      });
      if (res.ok) {
        await fetchRequests(statusFilter);
      } else {
        alert("Failed to reject school request.");
      }
    } catch (err) {
      alert("Error rejecting school request: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-indigo-700 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <i className="fas fa-school"></i> City & School Requests
            </h1>
            <p className="text-pink-100 text-sm mt-1">
              Review and crosscheck missing Maharashtra cities & schools submitted by signers. Approved schools will populate on the live 50m map.
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/30">
            <span className="text-2xl font-black">{requests.length}</span>
            <span className="block text-xs uppercase tracking-wider font-semibold text-pink-100">{statusFilter} Requests</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        {["pending", "approved", "rejected", "all"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 capitalize ${
              statusFilter === st
                ? "border-pink-600 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{st} Requests</span>
          </button>
        ))}
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="py-16 text-center text-gray-500">
          <i className="fas fa-spinner fa-spin text-3xl text-pink-600 mb-2"></i>
          <p className="text-sm font-semibold">Loading pending school & city requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-100 shadow-sm space-y-2">
          <i className="fas fa-check-circle text-4xl text-green-500 mb-2"></i>
          <h3 className="font-bold text-gray-800 text-lg">No Pending Requests</h3>
          <p className="text-xs text-gray-500">All submitted cities and schools have been reviewed!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-bold border-b">
                  <th className="p-4">City</th>
                  <th className="p-4">School Name</th>
                  <th className="p-4">Address / Locality</th>
                  <th className="p-4">GPS Coordinates</th>
                  <th className="p-4">Requested By</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {requests.map((item) => {
                  const lng = item.location?.coordinates?.[0];
                  const lat = item.location?.coordinates?.[1];
                  const isApproved = item.status === "approved" || item.isApproved;
                  const isRejected = item.status === "rejected";

                  return (
                    <tr key={item._id} className="hover:bg-pink-50/40 transition-colors">
                      <td className="p-4 font-bold text-gray-900">
                        <span className="px-2.5 py-1 rounded-lg bg-pink-100 text-pink-800 font-extrabold text-[11px]">
                          {item.city}
                        </span>
                      </td>
                      <td className="p-4 font-extrabold text-gray-900 text-sm">
                        {item.name}
                      </td>
                      <td className="p-4 text-gray-600">
                        {item.address || item.city}
                      </td>
                      <td className="p-4">
                        {lat && lng ? (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200"
                          >
                            <i className="fas fa-map-marker-alt text-red-500"></i>
                            <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{item.requestedBy?.name || "Signer"}</div>
                        <div className="text-[11px] text-gray-500">{item.requestedBy?.email || "N/A"}</div>
                      </td>
                      <td className="p-4">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-green-100 text-green-800 border border-green-200">
                            <i className="fas fa-check-circle text-green-600"></i> Approved
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-200">
                            <i className="fas fa-times-circle text-red-600"></i> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <i className="fas fa-clock text-amber-600"></i> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isApproved && (
                            <button
                              onClick={() => handleApprove(item._id)}
                              disabled={actionLoading === item._id}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                            >
                              <i className="fas fa-check"></i>
                              <span>Approve</span>
                            </button>
                          )}
                          {!isRejected && (
                            <button
                              onClick={() => handleReject(item._id)}
                              disabled={actionLoading === item._id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                            >
                              <i className="fas fa-times"></i>
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
