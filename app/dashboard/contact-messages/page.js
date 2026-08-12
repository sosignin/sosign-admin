"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0, replied: 0 });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `${apiUrl}/api/contact/admin/all?status=${filter}&search=${encodeURIComponent(search)}`
      );

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setStats({
          total: data.totalCount || 0,
          unread: data.unreadCount || 0,
          read: (data.messages || []).filter((m) => m.status === "read").length,
          replied: (data.messages || []).filter((m) => m.status === "replied").length,
        });
      }
    } catch (err) {
      console.error("Error fetching contact messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoadingId(id);
    try {
      const res = await authFetch(`${apiUrl}/api/contact/admin/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchMessages();
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    setActionLoadingId(id);
    try {
      const res = await authFetch(`${apiUrl}/api/contact/admin/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== id));
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage(null);
        }
        fetchMessages();
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <i className="fas fa-envelope text-[#F43676]"></i>
            Contact Messages
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View, manage, and respond to user inquiries submitted via the contact form.
          </p>
        </div>
        <button
          onClick={fetchMessages}
          className="self-start md:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
        >
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Total Messages</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats.total}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <i className="fas fa-inbox"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-amber-500">Unread</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats.unread}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            <i className="fas fa-envelope"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Read</p>
            <p className="text-2xl font-extrabold text-slate-700 mt-1">{stats.read}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl">
            <i className="fas fa-envelope-open"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-500">Replied</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.replied}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            <i className="fas fa-reply"></i>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {["all", "unread", "read", "replied", "archived"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filter === status
                  ? "bg-[#302d55] text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            placeholder="Search name, email, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#F43676]"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            <i className="fas fa-circle-notch fa-spin text-2xl mb-2 text-[#F43676]"></i>
            <p>Loading contact messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <i className="fas fa-inbox text-4xl mb-3 opacity-40"></i>
            <p className="font-semibold text-slate-600">No contact messages found</p>
            <p className="text-xs mt-1">Submitted user inquiries will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  msg.status === "unread" ? "bg-amber-50/30 font-semibold" : ""
                }`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (msg.status === "unread") {
                      handleUpdateStatus(msg._id, "read");
                    }
                  }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        msg.status === "unread"
                          ? "bg-amber-100 text-amber-800"
                          : msg.status === "read"
                          ? "bg-blue-100 text-blue-800"
                          : msg.status === "replied"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {msg.status}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(msg.createdAt)}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 mb-0.5">{msg.subject}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{msg.message}</p>

                  <div className="mt-2 text-xs text-slate-600 flex items-center gap-4">
                    <span>
                      <i className="fas fa-user text-slate-400 mr-1"></i> {msg.name}
                    </span>
                    <span>
                      <i className="fas fa-envelope text-slate-400 mr-1"></i> {msg.email}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (msg.status === "unread") {
                        handleUpdateStatus(msg._id, "read");
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    View
                  </button>

                  <a
                    href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                    onClick={() => handleUpdateStatus(msg._id, "replied")}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fas fa-reply text-xs"></i> Reply
                  </a>

                  <button
                    disabled={actionLoadingId === msg._id}
                    onClick={() => handleDelete(msg._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Message"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message View Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    selectedMessage.status === "unread"
                      ? "bg-amber-100 text-amber-800"
                      : selectedMessage.status === "read"
                      ? "bg-blue-100 text-blue-800"
                      : selectedMessage.status === "replied"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {selectedMessage.status}
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">{selectedMessage.subject}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(selectedMessage.createdAt)}</p>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Sender Info */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 text-xs text-slate-700">
              <div>
                <span className="font-bold text-slate-500">From:</span> {selectedMessage.name}
              </div>
              <div>
                <span className="font-bold text-slate-500">Email:</span>{" "}
                <a href={`mailto:${selectedMessage.email}`} className="text-[#3650AD] underline">
                  {selectedMessage.email}
                </a>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">Message Body</p>
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Set Status:</span>
                <select
                  value={selectedMessage.status}
                  onChange={(e) => handleUpdateStatus(selectedMessage._id, e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-bold"
                >
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(selectedMessage._id)}
                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Delete
                </button>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                    selectedMessage.subject
                  )}`}
                  onClick={() => handleUpdateStatus(selectedMessage._id, "replied")}
                  className="px-5 py-2 bg-gradient-to-r from-[#3650AD] to-[#F43676] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <i className="fas fa-reply"></i> Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
