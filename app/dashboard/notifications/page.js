"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/utils/api";
import Link from "next/link";
import { CATEGORY_CONFIG, timeAgo } from "@/components/AdminNotificationCenter";

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchNotifications = async (targetPage = page) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: targetPage.toString(),
        limit: "15",
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      });

      const res = await authFetch(`${apiUrl}/api/admin/notifications?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.pages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotifications(1);
  };

  const handleMarkAsRead = async (id) => {
    try {
      setActionLoadingId(id);
      await authFetch(`${apiUrl}/api/admin/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      // Trigger global event for layout refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refresh-admin-notifications"));
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      setActionLoadingId(id);
      await authFetch(`${apiUrl}/api/admin/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refresh-admin-notifications"));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await authFetch(`${apiUrl}/api/admin/notifications/mark-all-read`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refresh-admin-notifications"));
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleClearRead = async () => {
    if (!confirm("Delete all read notifications?")) return;
    try {
      await authFetch(`${apiUrl}/api/admin/notifications/clear-all`, { method: "DELETE" });
      fetchNotifications(1);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("refresh-admin-notifications"));
      }
    } catch (err) {
      console.error("Error clearing read notifications:", err);
    }
  };

  const handleSyncPending = async () => {
    try {
      setIsSyncing(true);
      const res = await authFetch(`${apiUrl}/api/admin/notifications/sync-pending`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Sync complete!");
        fetchNotifications(1);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("refresh-admin-notifications"));
        }
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const categories = [
    { key: "all", label: "All Categories" },
    { key: "petition_approval", label: "Petition Approval" },
    { key: "comment_approval", label: "Comment Approval" },
    { key: "stall_report", label: "Stall Reports 🚨" },
    { key: "school_request", label: "School Requests 🏫" },
    { key: "stall_dispute", label: "Stall Disputes 🛡️" },
    { key: "petition_report", label: "Petition Objections 🚩" },
    { key: "signature_claim", label: "Signature Claims ✍️" },
    { key: "download_request", label: "Download Requests" },
    { key: "hide_request", label: "Hide Requests" },
    { key: "contact_message", label: "Contact Messages 📩" },
    { key: "wallet_request", label: "Wallet Requests" },
    { key: "crowdfunding_approval", label: "Crowdfunding" },
    { key: "withdrawal_request", label: "Withdrawals" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <i className="fas fa-bell text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Notification Center</h1>
              <p className="text-sm text-gray-500">
                Action-required alerts, approvals, and citizen submissions across all modules
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncPending}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs flex items-center gap-2 transition-colors"
            title="Scan database for pending items and generate notifications"
          >
            <i className={`fas fa-sync-alt ${isSyncing ? "fa-spin" : ""}`}></i>
            <span>{isSyncing ? "Scanning..." : "Scan & Sync Pending"}</span>
          </button>

          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-check-double text-blue-600"></i>
            <span>Mark All Read</span>
          </button>

          <button
            onClick={handleClearRead}
            className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-trash-alt"></i>
            <span>Clear Read</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/60 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("unread")}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "unread"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Unread Only
            </button>
            <button
              onClick={() => setStatusFilter("read")}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "read"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Read
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-100 focus:bg-white text-gray-800 placeholder-gray-400 rounded-xl border border-transparent focus:border-blue-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchNotifications(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </form>
        </div>

        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategoryFilter(c.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                categoryFilter === c.key
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => {
              const config = CATEGORY_CONFIG[notif.category] || CATEGORY_CONFIG.system;
              return (
                <div
                  key={notif._id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-blue-50/30 ${
                    !notif.isRead ? "bg-blue-50/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${config.bg} shadow-sm`}
                    >
                      <i className={`${config.icon} text-base`}></i>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          {config.label}
                        </span>
                        {!notif.isRead && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                            Unread
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          • {timeAgo(notif.createdAt)} ({new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 leading-snug">
                        {notif.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link
                      href={notif.link || "/dashboard"}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                    >
                      <span>Review</span>
                      <i className="fas fa-arrow-right text-[10px]"></i>
                    </Link>

                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif._id)}
                        disabled={actionLoadingId === notif._id}
                        className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-xs transition-colors"
                        title="Mark as read"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(notif._id)}
                      disabled={actionLoadingId === notif._id}
                      className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center text-xs transition-colors"
                      title="Delete notification"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-bell-slash text-2xl"></i>
            </div>
            <h3 className="text-base font-bold text-gray-800">No notifications found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No notifications matching your filter criteria. New submissions and actions will appear here.
            </p>
            <button
              onClick={handleSyncPending}
              disabled={isSyncing}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <i className={`fas fa-sync-alt ${isSyncing ? "fa-spin" : ""}`}></i>
              Scan & Sync Database
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Page {page} of {totalPages} ({totalCount} total notifications)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchNotifications(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => fetchNotifications(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
