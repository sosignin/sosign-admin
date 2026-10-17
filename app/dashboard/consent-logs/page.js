"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";

export default function ConsentLogsPage() {
  const [logs, setLogs] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    registration: 0,
    signature: 0,
    cookie: 0,
    withdrawal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [consentTypeFilter, setConsentTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        ...(search && { search: search.trim() }),
        ...(consentTypeFilter !== "all" && { consentType: consentTypeFilter }),
        ...(statusFilter !== "all" && { granted: statusFilter }),
        ...(languageFilter !== "all" && { language: languageFilter }),
      });

      const res = await authFetch(`${apiUrl}/api/consent/admin/logs?${params.toString()}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to load consent logs");
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setCounts(data.counts || { total: 0, registration: 0, signature: 0, cookie: 0, withdrawal: 0 });
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error("Error fetching consent logs:", err);
      setError(err.message || "Failed to load consent logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, [consentTypeFilter, statusFilter, languageFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs(1);
  };

  const handleExportJson = async () => {
    try {
      setIsExporting(true);
      const res = await authFetch(`${apiUrl}/api/consent/admin/export`);
      if (!res.ok) {
        throw new Error("Failed to export consent audit ledger");
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SoSign-DPDP-Consent-Proof-Ledger-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const getLanguageLabel = (code) => {
    const langMap = {
      en: "English (en)",
      hi: "Hindi (हिन्दी)",
      bn: "Bengali (বাংলা)",
      mr: "Marathi (मराठी)",
      te: "Telugu (తెలుగు)",
      ta: "Tamil (தமிழ்)",
      gu: "Gujarati (ગુજરાતી)",
      kn: "Kannada (ಕನ್ನಡ)",
      ml: "Malayalam (മലയാളം)",
      pa: "Punjabi (ਪੰਜਾਬੀ)",
      or: "Odia (ଓଡ଼ିଆ)",
      ur: "Urdu (اردو)",
      as: "Assamese (অসমীয়া)",
    };
    return langMap[code] || code || "English";
  };

  const getConsentTypeBadge = (type) => {
    switch (type) {
      case "registration":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Registration Consent</span>;
      case "petition_signature":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Petition Signature</span>;
      case "cookie_banner":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Cookie / Tracking</span>;
      case "consent_withdrawal":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Consent Withdrawn (Sec 6(4))</span>;
      case "data_erasure_request":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">Erasure Consent</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{type?.replace(/_/g, " ")}</span>;
    }
  };

  const formatIpAddress = (ip) => {
    if (!ip) return "127.0.0.1";
    let clean = String(ip).trim();
    if (clean.startsWith("::ffff:")) {
      clean = clean.replace("::ffff:", "");
    }
    if (
      clean === "::1" ||
      clean === "1" ||
      clean === "::" ||
      clean === "localhost" ||
      clean === "::ffff:127.0.0.1"
    ) {
      return "127.0.0.1";
    }
    return clean;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Statutory Notice */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              DPDP Act 2023 Sec 6(10)
            </span>
            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-400/30">
              Eighth Schedule Multilingual
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Consent Proof & Audit Ledger</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Verifiable, timestamped audit trail proving free, specific, informed, and unambiguous affirmative consent for every Data Principal.
          </p>
        </div>

        <button
          onClick={handleExportJson}
          disabled={isExporting}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <i className={`fas ${isExporting ? "fa-spinner fa-spin" : "fa-download"}`}></i>
          {isExporting ? "Exporting..." : "Export Audit Ledger (JSON)"}
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Proofs Logged</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{counts.total.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all touchpoints</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Registrations</div>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">{counts.registration.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active citizen signups</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-purple-600 uppercase tracking-wider">Signatures</div>
          <div className="text-2xl font-extrabold text-purple-900 mt-1">{counts.signature.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Petition endorsers</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-teal-600 uppercase tracking-wider">Cookies & Privacy</div>
          <div className="text-2xl font-extrabold text-teal-900 mt-1">{counts.cookie.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Banner interactions</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Withdrawn</div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">{counts.withdrawal.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sec 6(4) revocations</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] flex gap-2">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by citizen name, email, IP address, purpose..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-lg transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Type Filter */}
          <select
            value={consentTypeFilter}
            onChange={(e) => {
              setConsentTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Consent Types</option>
            <option value="registration">Registration</option>
            <option value="petition_signature">Petition Signature</option>
            <option value="cookie_banner">Cookie Banner</option>
            <option value="consent_withdrawal">Withdrawals (Sec 6(4))</option>
            <option value="marketing_communications">Marketing</option>
            <option value="analytics_tracking">Analytics</option>
            <option value="data_erasure_request">Data Erasure</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="true">Affirmative (Granted)</option>
            <option value="false">Withdrawn / Refused</option>
          </select>

          {/* Language Filter */}
          <select
            value={languageFilter}
            onChange={(e) => {
              setLanguageFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Notice Languages</option>
            <option value="en">English (en)</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="bn">Bengali (বাংলা)</option>
            <option value="mr">Marathi (मराठी)</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="gu">Gujarati (ગુજરાતી)</option>
            <option value="kn">Kannada (ಕನ್ನಡ)</option>
            <option value="ml">Malayalam (മലയാളം)</option>
            <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
            <option value="or">Odia (ଓଡ଼ିଆ)</option>
            <option value="ur">Urdu (اردو)</option>
            <option value="as">Assamese (অসমীয়া)</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setConsentTypeFilter("all");
              setStatusFilter("all");
              setLanguageFilter("all");
              setCurrentPage(1);
              fetchLogs(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition"
            title="Reset Filters"
          >
            <i className="fas fa-undo"></i>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-spinner fa-spin text-2xl text-blue-600 mb-2"></i>
            <p className="text-sm">Loading verifiable consent audit records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500">
            <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-clipboard-check text-3xl text-slate-300 mb-2"></i>
            <p className="text-base font-semibold text-slate-700">No consent audit logs found</p>
            <p className="text-xs text-slate-400 mt-1">
              Logs are automatically generated when citizens register, sign petitions, or update consent settings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Data Principal</th>
                  <th className="py-3 px-4">Consent Purpose / Type</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Notice Lang & Ver</th>
                  <th className="py-3 px-4">Method & IP</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">
                        {new Date(log.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {log.userName || (log.userEmail ? log.userEmail.split("@")[0] : "Anonymous Visitor")}
                      </div>
                      <div className="text-xs text-slate-400">
                        {log.userEmail || "Cookie / Public Visitor"}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="mb-1">{getConsentTypeBadge(log.consentType)}</div>
                      <div className="text-xs text-slate-600 line-clamp-1" title={log.purpose}>
                        {log.purpose}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {log.granted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <i className="fas fa-check text-[10px]"></i> Granted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          <i className="fas fa-times text-[10px]"></i> Revoked
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      <div className="font-medium text-slate-800">
                        {getLanguageLabel(log.noticeLanguage)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Notice: {log.noticeVersion || "2026.1-DPDP"}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                      <div className="font-mono text-[11px] text-slate-700">
                        {formatIpAddress(log.ipAddress)}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {log.method || "affirmative_action"}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                      >
                        <i className="fas fa-fingerprint mr-1 text-slate-500"></i> Proof
                      </button>
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
                  fetchLogs(nextP);
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
                  fetchLogs(nextP);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Proof Certificate Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fas fa-shield-alt"></i> DPDP Act 2023 Statutory Audit Proof
                </div>
                <h3 className="text-lg font-bold">Consent Verification Certificate</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Proof Record ID:</span>
                  <span className="font-mono text-slate-800 select-all">{selectedLog._id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Recorded Timestamp:</span>
                  <span className="font-medium text-slate-800">
                    {new Date(selectedLog.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Data Principal (User):</span>
                  <span className="font-semibold text-slate-800">{selectedLog.userName || "Public Citizen"}</span>
                  <span className="text-slate-500 block">{selectedLog.userEmail || "No Email Associated"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Consent Status:</span>
                  {selectedLog.granted ? (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      Affirmative Consent Granted (True)
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                      Consent Revoked / Refused (False)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Purpose of Processing (DPDP Sec 6(1))
                </h4>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-800 font-medium">
                  {selectedLog.purpose}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Notice Language:</span>
                  <span className="font-semibold text-slate-800">{getLanguageLabel(selectedLog.noticeLanguage)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Notice Version:</span>
                  <span className="font-semibold text-slate-800">{selectedLog.noticeVersion || "2026.1-DPDP"}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Consent Method:</span>
                  <span className="font-semibold text-slate-800">{selectedLog.method || "affirmative_action"}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Network & Client Telemetry (Section 6(10) Proof)
                </h4>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs space-y-1">
                  <div>
                    <span className="text-slate-400">IP Address:</span> {formatIpAddress(selectedLog.ipAddress)}
                  </div>
                  <div className="break-all">
                    <span className="text-slate-400">User Agent:</span> {selectedLog.userAgent || "Unknown"}
                  </div>
                </div>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Context Metadata
                  </h4>
                  <pre className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] font-mono text-slate-700 overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Data Fiduciary: LEO MEO IT Solution Private Limited (SoSign Platform)
              </span>
              <button
                onClick={() => setSelectedLog(null)}
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
