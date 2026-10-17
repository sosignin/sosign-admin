"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";

export default function BackupsPage() {
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState({
    totalBackups: 0,
    latestBackupDate: null,
    latestBackupSize: 0,
    totalVerified: 0,
    failedCount: 0,
    rpoHours: 24,
    rtoHours: 4,
    retentionDays: 90,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchBackups = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const res = await authFetch(`${apiUrl}/api/admin/backups?page=${page}&limit=10`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to load backup logs");
      }

      const data = await res.json();
      setBackups(data.backups || []);
      setStats(data.stats || {});
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error("Error fetching backups:", err);
      setError(err.message || "Failed to load backups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups(currentPage);
  }, []);

  const handleTriggerBackup = async () => {
    try {
      setIsCreating(true);
      setStatusMessage({ type: "", text: "" });

      const res = await authFetch(`${apiUrl}/api/admin/backups/create`, {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create database snapshot");
      }

      const data = await res.json();
      setStatusMessage({
        type: "success",
        text: `Point-in-time snapshot ${data.backup?.backupId} created successfully with verified SHA-256 checksum!`,
      });
      fetchBackups(1);
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message || "Backup failed" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleVerifyIntegrity = async (backupId) => {
    try {
      setVerifyingId(backupId);
      const res = await authFetch(`${apiUrl}/api/admin/backups/${backupId}/verify`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: `Integrity check PASSED for snapshot ${backupId}. Cryptographic SHA-256 matched perfectly.`,
        });
        fetchBackups(currentPage);
      } else {
        setStatusMessage({
          type: "error",
          text: `Integrity check FAILED: ${data.result?.message || "Corrupted archive"}`,
        });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: `Verification error: ${err.message}` });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDownload = (backupId) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : "";
    window.open(`${apiUrl}/api/admin/backups/${backupId}/download?token=${token}`, "_blank");
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Statutory Notice */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              DPDP Act 2023 Sec 8(5)
            </span>
            <span className="bg-teal-500/20 text-teal-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-400/30">
              Data Loss Prevention & Continuity
            </span>
            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-400/30">
              Daily Automated Schedule
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Database Backups & Disaster Recovery</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Automated and on-demand cryptographic snapshots to prevent personal data loss, ensure rapid restoration, and fulfill statutory business continuity obligations.
          </p>
        </div>

        <button
          onClick={handleTriggerBackup}
          disabled={isCreating}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <i className={`fas ${isCreating ? "fa-spinner fa-spin" : "fa-shield-alt"}`}></i>
          {isCreating ? "Creating Snapshot..." : "Trigger Immediate Backup"}
        </button>
      </div>

      {/* Notification Toast if present */}
      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`fas ${statusMessage.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage({ type: "", text: "" })} className="text-sm font-bold px-2">
            &times;
          </button>
        </div>
      )}

      {/* KPI Cards: Disaster Recovery Telemetry */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Snapshots</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{(stats.totalBackups || 0).toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Point-in-time archives</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">RPO Target</div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">&lt; {stats.rpoHours || 24}h</div>
          <div className="text-[11px] text-slate-400 mt-1">Recovery Point Objective</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-teal-600 uppercase tracking-wider">RTO Target</div>
          <div className="text-2xl font-extrabold text-teal-900 mt-1">&lt; {stats.rtoHours || 4}h</div>
          <div className="text-[11px] text-slate-400 mt-1">Recovery Time Objective</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Integrity Verified</div>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">{(stats.totalVerified || 0).toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">SHA-256 Checksum Valid</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-purple-600 uppercase tracking-wider">Retention Window</div>
          <div className="text-2xl font-extrabold text-purple-900 mt-1">{stats.retentionDays || 90} Days</div>
          <div className="text-[11px] text-slate-400 mt-1">Rolling backup retention</div>
        </div>
      </div>

      {/* Disaster Recovery Policy Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <i className="fas fa-clock text-base"></i>
          </div>
          <div>
            <span className="font-bold text-slate-900 block">Automated Daily Snapshot Schedule Active</span>
            <span className="text-slate-500">
              Snapshots are generated automatically every 24 hours (with collections: Users, Petitions, Consent Logs, Wallets, Deletion Vault).
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-slate-500 block">Latest Snapshot:</span>
          <span className="font-semibold text-slate-800">
            {stats.latestBackupDate
              ? new Date(stats.latestBackupDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"
              : "Pending Initial Run"}
          </span>
        </div>
      </div>

      {/* Main Snapshots Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-spinner fa-spin text-2xl text-emerald-600 mb-2"></i>
            <p className="text-sm">Loading backup archives and integrity telemetry...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500">
            <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-database text-3xl text-slate-300 mb-2"></i>
            <p className="text-base font-semibold text-slate-700">No database snapshots recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Trigger Immediate Backup&quot; above to create your first point-in-time cryptographic archive.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Backup ID & Timestamp</th>
                  <th className="py-3 px-4">Scope & Volume</th>
                  <th className="py-3 px-4">Archive Size</th>
                  <th className="py-3 px-4">Triggered By</th>
                  <th className="py-3 px-4">SHA-256 Checksum</th>
                  <th className="py-3 px-4 text-center">Integrity Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {backups.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                      <div className="font-mono font-bold text-slate-800">{b.backupId}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(b.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} IST
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedBackup(b)}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-md transition flex items-center gap-1.5"
                      >
                        <i className="fas fa-layer-group text-[10px]"></i>
                        <span>{(b.totalDocuments || 0).toLocaleString()} documents</span>
                        <span className="text-[10px] text-teal-600">({b.collectionsBackedUp?.length || 0} collections)</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-slate-700">
                      {formatBytes(b.sizeBytes)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                      <div className="font-medium text-slate-800">{b.triggeredBy?.adminName || "System Cron"}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{b.triggeredBy?.type}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-[11px] text-slate-600 truncate max-w-[130px]" title={b.checksumSha256}>
                        {b.checksumSha256 ? `${b.checksumSha256.substring(0, 10)}...${b.checksumSha256.substring(b.checksumSha256.length - 6)}` : "Computing..."}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {b.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <i className="fas fa-check-double text-[10px]"></i> Verified
                        </span>
                      ) : b.status === "failed" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          <i className="fas fa-times text-[10px]"></i> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <i className="fas fa-clock text-[10px]"></i> Unverified
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleVerifyIntegrity(b.backupId)}
                          disabled={verifyingId === b.backupId}
                          title="Verify SHA-256 Checksum"
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition disabled:opacity-50"
                        >
                          <i className={`fas ${verifyingId === b.backupId ? "fa-spinner fa-spin" : "fa-check"}`}></i>
                        </button>
                        <button
                          onClick={() => handleDownload(b.backupId)}
                          title="Download Snapshot for Offsite Redundancy"
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Page <span className="font-semibold text-slate-800">{currentPage}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => {
                  const nextP = currentPage - 1;
                  setCurrentPage(nextP);
                  fetchBackups(nextP);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => {
                  const nextP = currentPage + 1;
                  setCurrentPage(nextP);
                  fetchBackups(nextP);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Collection Breakdown Modal */}
      {selectedBackup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fas fa-database"></i> Snapshot Collection Manifest
                </div>
                <h3 className="text-lg font-bold">{selectedBackup.backupId}</h3>
              </div>
              <button onClick={() => setSelectedBackup(null)} className="text-slate-400 hover:text-white text-lg p-1">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">Archive Filename:</span>
                  <span className="font-mono text-slate-800 break-all">{selectedBackup.filename}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Total Size:</span>
                  <span className="font-bold text-slate-800">{formatBytes(selectedBackup.sizeBytes)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block mb-0.5">SHA-256 Checksum:</span>
                  <span className="font-mono text-[11px] text-slate-800 select-all break-all bg-white p-2 rounded border border-slate-200 block">
                    {selectedBackup.checksumSha256}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Collections Captured & Document Counts
                </h4>
                <div className="space-y-1.5">
                  {selectedBackup.collectionsBackedUp?.map((coll) => (
                    <div
                      key={coll.name}
                      className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                    >
                      <span className="font-mono font-medium text-slate-800 capitalize">{coll.name}</span>
                      <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        {(coll.count || 0).toLocaleString()} documents
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Data Fiduciary: LEO MEO IT Solution Private Limited
              </span>
              <button
                onClick={() => setSelectedBackup(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
