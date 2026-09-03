"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/utils/api";
import Link from "next/link";

// Synthesize pleasant sound chime using browser Web Audio API (zero external asset requirement)
export const playNotificationSound = () => {
  try {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // First tone (higher)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone (harmonious chord)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
    gain2.gain.setValueAtTime(0.15, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (err) {
    console.debug("Web Audio chime not supported or autoplay blocked:", err);
  }
};

// Formats relative time
export const timeAgo = (dateInput) => {
  if (!dateInput) return "Just now";
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

// Category styling config
export const CATEGORY_CONFIG = {
  petition_approval: {
    label: "Petition Approval",
    icon: "fas fa-check-circle",
    bg: "bg-green-50 text-green-600 border-green-200",
    badgeColor: "bg-green-500",
  },
  comment_approval: {
    label: "Comment",
    icon: "fas fa-comments",
    bg: "bg-orange-50 text-orange-600 border-orange-200",
    badgeColor: "bg-orange-500",
  },
  stall_report: {
    label: "Stall Report 🚨",
    icon: "fas fa-store-slash",
    bg: "bg-red-50 text-red-600 border-red-200",
    badgeColor: "bg-red-600",
  },
  school_request: {
    label: "School Request 🏫",
    icon: "fas fa-school",
    bg: "bg-indigo-50 text-indigo-600 border-indigo-200",
    badgeColor: "bg-indigo-600",
  },
  stall_dispute: {
    label: "Stall Dispute 🛡️",
    icon: "fas fa-shield-alt",
    bg: "bg-amber-50 text-amber-600 border-amber-200",
    badgeColor: "bg-amber-600",
  },
  petition_report: {
    label: "Petition Objection 🚩",
    icon: "fas fa-flag",
    bg: "bg-rose-50 text-rose-600 border-rose-200",
    badgeColor: "bg-rose-600",
  },
  signature_claim: {
    label: "Signature Claim ✍️",
    icon: "fas fa-file-signature",
    bg: "bg-blue-50 text-blue-600 border-blue-200",
    badgeColor: "bg-blue-600",
  },
  download_request: {
    label: "Download Request",
    icon: "fas fa-download",
    bg: "bg-teal-50 text-teal-600 border-teal-200",
    badgeColor: "bg-teal-600",
  },
  hide_request: {
    label: "Hide Request",
    icon: "fas fa-eye-slash",
    bg: "bg-orange-50 text-orange-600 border-orange-200",
    badgeColor: "bg-orange-600",
  },
  contact_message: {
    label: "Contact Message 📩",
    icon: "fas fa-envelope",
    bg: "bg-purple-50 text-purple-600 border-purple-200",
    badgeColor: "bg-purple-600",
  },
  wallet_request: {
    label: "Wallet Request",
    icon: "fas fa-money-check-alt",
    bg: "bg-rose-50 text-rose-600 border-rose-200",
    badgeColor: "bg-rose-600",
  },
  crowdfunding_approval: {
    label: "Crowdfunding",
    icon: "fas fa-hand-holding-heart",
    bg: "bg-rose-50 text-rose-600 border-rose-200",
    badgeColor: "bg-rose-600",
  },
  withdrawal_request: {
    label: "Withdrawal Request",
    icon: "fas fa-money-bill-wave",
    bg: "bg-amber-50 text-amber-600 border-amber-200",
    badgeColor: "bg-amber-600",
  },
  system: {
    label: "System",
    icon: "fas fa-bell",
    bg: "bg-gray-50 text-gray-600 border-gray-200",
    badgeColor: "bg-gray-600",
  },
};

export default function AdminNotificationCenter({ counts, onRefresh }) {
  const router = useRouter();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all", "unread"
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Read sound preference from localStorage
  useEffect(() => {
    try {
      const pref = localStorage.getItem("sosign_admin_notif_sound");
      if (pref !== null) {
        setSoundEnabled(pref === "true");
      }
    } catch {}
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    try {
      localStorage.setItem("sosign_admin_notif_sound", String(nextVal));
      if (nextVal) playNotificationSound();
    } catch {}
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Fetch recent notifications when dropdown opens or activeTab changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          limit: "15",
          ...(activeTab === "unread" ? { status: "unread" } : {}),
        });

        const res = await authFetch(`${apiUrl}/api/admin/notifications?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, activeTab, apiUrl]);

  // Mark single as read
  const handleMarkAsRead = async (e, notif) => {
    e.stopPropagation();
    try {
      await authFetch(`${apiUrl}/api/admin/notifications/${notif._id}/read`, {
        method: "PUT",
      });
      setNotifications((prev) =>
        prev.map((item) => (item._id === notif._id ? { ...item, isRead: true } : item))
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // Click on a notification row -> mark as read and navigate
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await authFetch(`${apiUrl}/api/admin/notifications/${notif._id}/read`, {
          method: "PUT",
        });
        if (onRefresh) onRefresh();
      } catch (err) {}
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await authFetch(`${apiUrl}/api/admin/notifications/mark-all-read`, {
        method: "PUT",
      });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Sync / Backfill pending items from DB
  const handleSyncPending = async () => {
    try {
      setIsSyncing(true);
      const res = await authFetch(`${apiUrl}/api/admin/notifications/sync-pending`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh notifications and badges
        const refreshRes = await authFetch(`${apiUrl}/api/admin/notifications?limit=15`);
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setNotifications(freshData.notifications || []);
        }
        if (onRefresh) onRefresh();
        alert(data.message || "Sync complete!");
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const unreadCount = counts?.unreadCount || 0;
  const totalActionCount = counts?.totalPendingAction || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? "bg-blue-50 text-blue-600 shadow-inner"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
        title="Admin Notifications"
        aria-label="Admin Notifications"
      >
        <i className="fas fa-bell text-lg"></i>

        {/* Pulsing Red Badge for Action Items / Unread */}
        {(unreadCount > 0 || totalActionCount > 0) && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-md animate-pulse ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount || totalActionCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-gray-100/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <i className="fas fa-bell text-blue-300 text-sm"></i>
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-medium bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-blue-200">
                  {totalActionCount} pending actionable item{totalActionCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {/* Header action icons */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
                  soundEnabled
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
                title={soundEnabled ? "Mute alert chime" : "Enable alert chime"}
              >
                <i className={`fas ${soundEnabled ? "fa-volume-up" : "fa-volume-mute"}`}></i>
              </button>

              <button
                onClick={handleSyncPending}
                disabled={isSyncing}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Sync existing pending items into notifications feed"
              >
                <i className={`fas fa-sync-alt ${isSyncing ? "fa-spin" : ""}`}></i>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Filter Tabs & Mark All Read */}
          <div className="px-4 py-2 bg-gray-50/90 border-b border-gray-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 bg-gray-200/60 p-0.5 rounded-lg">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === "unread"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 custom-scrollbar">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                <i className="fas fa-spinner fa-spin text-xl text-blue-500"></i>
                <p className="text-xs">Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => {
                const config = CATEGORY_CONFIG[notif.category] || CATEGORY_CONFIG.system;
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-blue-50/40 cursor-pointer transition-colors group relative ${
                      !notif.isRead ? "bg-blue-50/20" : ""
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.isRead && (
                      <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    )}

                    {/* Category Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${config.bg} shadow-sm`}
                    >
                      <i className={`${config.icon} text-sm`}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {config.label}
                        </span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <h4
                        className={`text-xs font-semibold truncate ${
                          notif.isRead ? "text-gray-700" : "text-gray-900"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mt-0.5">
                        {notif.message}
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0 flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, notif)}
                          className="w-6 h-6 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center text-[10px]"
                          title="Mark as read"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-check text-lg"></i>
                </div>
                <h4 className="text-xs font-bold text-gray-700">All caught up!</h4>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                  {activeTab === "unread"
                    ? "No unread notifications right now."
                    : "No notifications logged yet. New user submissions will appear here automatically."}
                </p>
                <button
                  onClick={handleSyncPending}
                  disabled={isSyncing}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <i className={`fas fa-sync-alt ${isSyncing ? "fa-spin" : ""}`}></i>
                  Scan & Sync Pending Items
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All Notifications</span>
              <i className="fas fa-arrow-right text-[10px]"></i>
            </Link>

            <span className="text-[10px] text-gray-400">Auto-refresh active</span>
          </div>
        </div>
      )}
    </div>
  );
}
