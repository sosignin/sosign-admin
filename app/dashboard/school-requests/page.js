"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import { parseGoogleLocationString } from "@/utils/parseGoogleLocation";

export default function AdminSchoolRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);

  // Edit Modal State
  const [editingSchool, setEditingSchool] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [modalError, setModalError] = useState("");

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

  const openEditModal = (school) => {
    setEditingSchool(school);
    setEditName(school.name || "");
    setEditCity(school.city || "");
    setEditAddress(school.address || "");
    const lng = school.location?.coordinates?.[0] ?? "";
    const lat = school.location?.coordinates?.[1] ?? "";
    setEditLatitude(lat !== "" ? lat.toString() : "");
    setEditLongitude(lng !== "" ? lng.toString() : "");
    setGoogleMapsUrl("");
    setModalError("");
  };

  const closeEditModal = () => {
    setEditingSchool(null);
    setModalError("");
  };

  // Extract lat/lng from pasted Google Maps URL or coordinate string
  const handleGoogleMapsUrlChange = (val) => {
    setGoogleMapsUrl(val);
    if (!val) return;

    const coords = parseGoogleLocationString(val);
    if (coords) {
      setEditLatitude(coords.lat.toString());
      setEditLongitude(coords.lng.toString());
    }
  };

  const handleSaveLocation = async (approveAfter = false) => {
    if (!editingSchool) return;
    setModalError("");

    if (!editName.trim() || !editCity.trim()) {
      setModalError("School name and city are required.");
      return;
    }

    try {
      setSaveLoading(true);
      const payload = {
        name: editName.trim(),
        city: editCity.trim(),
        address: editAddress.trim(),
        latitude: editLatitude !== "" ? parseFloat(editLatitude) : undefined,
        longitude: editLongitude !== "" ? parseFloat(editLongitude) : undefined,
      };

      const endpoint = approveAfter
        ? `${apiUrl}/api/stall-reports/admin/school-requests/${editingSchool._id}/approve`
        : `${apiUrl}/api/stall-reports/admin/school-requests/${editingSchool._id}`;

      const res = await authFetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        closeEditModal();
        await fetchRequests(statusFilter);
      } else {
        const data = await res.json();
        setModalError(data.message || "Failed to update school location.");
      }
    } catch (err) {
      setModalError("Error updating location: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

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
              Review, edit exact GPS coordinates, and crosscheck missing Maharashtra cities & schools submitted by signers. Approved schools populate on the live 50m map.
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
                            href={`https://www.google.com/maps/search/${encodeURIComponent(`${item.name}, ${item.address || item.city}`)}/@${lat},${lng},17z`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors"
                            title={`Open ${item.name} on Google Maps`}
                          >
                            <i className="fas fa-map-marker-alt text-red-500"></i>
                            <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                          </a>
                        ) : (
                          <span className="text-amber-600 font-semibold flex items-center gap-1">
                            <i className="fas fa-exclamation-triangle"></i> No Coordinates
                          </span>
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
                        <div className="flex items-center justify-end gap-1.5">
                          {/* EDIT LOCATION & GPS COORDINATES BUTTON */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                            title="Edit exact school GPS location & details"
                          >
                            <i className="fas fa-edit"></i>
                            <span>Edit Location</span>
                          </button>

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

      {/* EDIT SCHOOL LOCATION & GPS COORDINATES MODAL */}
      {editingSchool && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-pink-100 text-gray-900 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#F43676] flex items-center justify-center text-lg font-black border border-pink-100">
                  <i className="fas fa-map-marked-alt"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    Edit Exact GPS Location & Details
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Adjust school coordinates so 50m geofence maps accurately
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                <i className="fas fa-exclamation-circle text-red-600"></i>
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Google Maps Link / DMS Quick Paste Helper */}
              <div className="bg-pink-50/60 p-3 rounded-2xl border border-pink-100 space-y-1">
                <label className="block text-[11px] text-pink-900 font-extrabold flex items-center gap-1">
                  <i className="fas fa-link text-[#F43676]"></i> Paste Google Maps Link or DMS String (Auto-Extracts Coordinates)
                </label>
                <input
                  type="text"
                  value={googleMapsUrl}
                  onChange={(e) => handleGoogleMapsUrlChange(e.target.value)}
                  placeholder="Paste Google Maps link, e.g. https://maps.app.goo.gl/... or @19.8654,75.3621"
                  className="w-full text-xs p-2.5 bg-white border border-pink-200 rounded-xl outline-none focus:border-[#F43676] text-gray-900 font-semibold"
                />
              </div>

              {/* City & School Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">City *</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-xl outline-none focus:border-pink-600 font-bold bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">School Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-xl outline-none focus:border-pink-600 font-bold bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Address / Locality</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. Near Beed Bypass, Sambhajinagar"
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl outline-none focus:border-pink-600 font-semibold bg-white text-gray-900"
                />
              </div>

              {/* Latitude & Longitude Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Latitude (N) *</label>
                  <input
                    type="number"
                    step="any"
                    value={editLatitude}
                    onChange={(e) => setEditLatitude(e.target.value)}
                    placeholder="e.g. 19.8654"
                    className="w-full text-xs p-2.5 border border-blue-300 rounded-xl outline-none focus:border-blue-600 font-mono font-bold bg-blue-50/40 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Longitude (E) *</label>
                  <input
                    type="number"
                    step="any"
                    value={editLongitude}
                    onChange={(e) => setEditLongitude(e.target.value)}
                    placeholder="e.g. 75.3621"
                    className="w-full text-xs p-2.5 border border-blue-300 rounded-xl outline-none focus:border-blue-600 font-mono font-bold bg-blue-50/40 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saveLoading}
                onClick={() => handleSaveLocation(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {saveLoading ? "Saving Location..." : "Save Location"}
              </button>

              {editingSchool.status !== "approved" && (
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={() => handleSaveLocation(true)}
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-green-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <i className="fas fa-check-circle"></i>
                  <span>{saveLoading ? "Saving & Approving..." : "Save & Approve"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
