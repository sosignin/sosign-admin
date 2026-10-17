"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";

export default function AccessLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    eventsLast24h: 0,
    highSeverityCount: 0,
    failedAuthCount: 0,
    adminActionsCount: 0,
    topIps: [],
    recentAlerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [actorTypeFilter, setActorTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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
        ...(severityFilter !== "all" && { severity: severityFilter }),
        ...(actorTypeFilter !== "all" && { actorType: actorTypeFilter }),
        ...(statusFilter !== "all" && { statusCode: statusFilter }),
      });

      const res = await authFetch(`${apiUrl}/api/admin/access-logs?${params.toString()}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to load access logs");
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error("Error fetching access logs:", err);
      setError(err.message || "Failed to load access logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/admin/access-logs/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {});
      }
    } catch (err) {
      console.debug("Failed to fetch access log stats:", err);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, [severityFilter, actorTypeFilter, statusFilter]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 30s live monitoring refresh
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs(1);
  };

  const handleExportJson = async () => {
    try {
      setIsExporting(true);
      const res = await authFetch(`${apiUrl}/api/admin/access-logs/export`);
      if (!res.ok) {
        throw new Error("Failed to export access logs");
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SoSign-CERT-In-Access-Logs-${new Date().toISOString().split("T")[0]}.json`;
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

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "critical":
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-600 text-white animate-pulse">Critical</span>;
      case "high":
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-200">High</span>;
      case "medium":
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">Low</span>;
    }
  };

  const getStatusBadge = (code) => {
    if (code >= 200 && code < 300) {
      return <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{code}</span>;
    }
    if (code === 401 || code === 403) {
      return <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{code}</span>;
    }
    if (code >= 400 && code < 500) {
      return <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{code}</span>;
    }
    return <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{code}</span>;
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              DPDP Act 2023 Sec 8(5)
            </span>
            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-400/30">
              CERT-In Log Directive
            </span>
            <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-400/30">
              180-Day Retention
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Access Logs & Security Monitoring</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time telemetry and immutable audit logs capturing personal data accesses, privileged admin activities, and security incident indicators.
          </p>
        </div>

        <button
          onClick={handleExportJson}
          disabled={isExporting}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <i className={`fas ${isExporting ? "fa-spinner fa-spin" : "fa-download"}`}></i>
          {isExporting ? "Exporting..." : "Export CERT-In Audit Logs (JSON)"}
        </button>
      </div>

      {/* KPI Monitoring Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Access Events</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{(stats.totalEvents || 0).toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Retained in database</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Last 24 Hours</div>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">{(stats.eventsLast24h || 0).toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active access queries</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-rose-600 uppercase tracking-wider">Security Alerts</div>
          <div className="text-2xl font-extrabold text-rose-900 mt-1">{(stats.highSeverityCount || 0).toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">High & Critical events</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Auth Failures</div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">{(stats.failedAuthCount || 0).toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">401/403 Blocked attempts</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Admin Actions</div>
          <div className="text-2xl font-extrabold text-indigo-900 mt-1">{(stats.adminActionsCount || 0).toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Privileged operations</div>
        </div>
      </div>

      {/* Security Incident Highlight Banner if alerts exist */}
      {stats.recentAlerts && stats.recentAlerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <i className="fas fa-shield-virus text-rose-600 text-xl mt-0.5"></i>
          <div className="flex-1 text-xs">
            <span className="font-bold text-rose-900">Recent Security Incident Alert:</span>{" "}
            <span className="text-rose-800">
              {stats.recentAlerts[0]?.action} at {stats.recentAlerts[0]?.resource} (IP: {formatIpAddress(stats.recentAlerts[0]?.ipAddress)}) - Status: {stats.recentAlerts[0]?.statusCode}
            </span>
            <div className="text-[11px] text-rose-600 mt-0.5">
              Logged at {new Date(stats.recentAlerts[0]?.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
            </div>
          </div>
          <button
            onClick={() => {
              setSeverityFilter("high");
              setCurrentPage(1);
            }}
            className="text-xs font-bold text-rose-700 underline hover:text-rose-900 shrink-0"
          >
            Filter Alerts
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] flex gap-2">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IP, email, actor name, action, or resource..."
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
          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Actor Type Filter */}
          <select
            value={actorTypeFilter}
            onChange={(e) => {
              setActorTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actors</option>
            <option value="admin">Admins</option>
            <option value="user">Registered Users</option>
            <option value="visitor">Visitors</option>
          </select>

          {/* Status Code Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status Codes</option>
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setSeverityFilter("all");
              setActorTypeFilter("all");
              setStatusFilter("all");
              setCurrentPage(1);
              fetchLogs(1);
              fetchStats();
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition"
            title="Reset Filters"
          >
            <i className="fas fa-undo"></i>
          </button>
        </div>
      </div>

      {/* Main Access Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-spinner fa-spin text-2xl text-blue-600 mb-2"></i>
            <p className="text-sm">Loading real-time access telemetry...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500">
            <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-clipboard-list text-3xl text-slate-300 mb-2"></i>
            <p className="text-base font-semibold text-slate-700">No access logs match current filters</p>
            <p className="text-xs text-slate-400 mt-1">
              Events are automatically captured on personal data queries, authentication, and privileged admin actions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Actor & Role</th>
                  <th className="py-3 px-4">Action & Resource</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Severity</th>
                  <th className="py-3 px-4">IP & Duration</th>
                  <th className="py-3 px-4 text-right">Inspection</th>
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
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {log.actorType === "admin" && (
                          <i className="fas fa-user-shield text-blue-600 text-xs" title="Admin"></i>
                        )}
                        {log.actorName || "Visitor"}
                      </div>
                      <div className="text-xs text-slate-400">{log.actorEmail || "Unauthenticated"}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Role: {log.role || log.actorType}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-xs text-slate-800">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded mr-1">
                          {log.method}
                        </span>
                        {log.action}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 truncate max-w-xs" title={log.resource}>
                        {log.resource}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(log.statusCode)}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {getSeverityBadge(log.severity)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                      <div className="font-mono text-[11px] text-slate-700">{formatIpAddress(log.ipAddress)}</div>
                      <div className="text-[11px] text-slate-400">{log.durationMs}ms</div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                      >
                        <i className="fas fa-search-plus mr-1 text-slate-500"></i> Inspect
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

      {/* Log Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fas fa-shield-alt"></i> CERT-In & DPDP Access Event Telemetry
                </div>
                <h3 className="text-lg font-bold">Access Log Dossier</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white text-lg p-1">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">Event Log ID:</span>
                  <span className="font-mono text-slate-800 select-all">{selectedLog._id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Timestamp (IST):</span>
                  <span className="font-medium text-slate-800">
                    {new Date(selectedLog.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Actor Details:</span>
                  <span className="font-bold text-slate-800">{selectedLog.actorName}</span>
                  <span className="text-slate-500 block">{selectedLog.actorEmail || "Unauthenticated Visitor"}</span>
                  <span className="text-[10px] text-slate-400">Type: {selectedLog.actorType} | Role: {selectedLog.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">HTTP Status & Execution:</span>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedLog.statusCode)}
                    <span className="font-semibold text-slate-700">{selectedLog.durationMs}ms</span>
                    {getSeverityBadge(selectedLog.severity)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Resource & Action
                </h4>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-xs">
                  <div><strong className="text-slate-700">Action:</strong> {selectedLog.action}</div>
                  <div className="mt-1"><strong className="text-slate-700">Endpoint:</strong> {selectedLog.method} {selectedLog.resource}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Network Telemetry
                </h4>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs space-y-1">
                  <div><span className="text-slate-400">Client IP Address:</span> {formatIpAddress(selectedLog.ipAddress)}</div>
                  <div className="break-all"><span className="text-slate-400">User Agent:</span> {selectedLog.userAgent || "None"}</div>
                </div>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1">Metadata Payload</h4>
                  <pre className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] font-mono text-slate-700 overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
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
