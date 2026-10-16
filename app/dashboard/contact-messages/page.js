"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0, replied: 0, resolved: 0, dpdp: 0 });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [adminResponseText, setAdminResponseText] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `${apiUrl}/api/contact/admin/all?status=${filter}&search=${encodeURIComponent(search)}`
      );

      if (res.ok) {
        const data = await res.json();
        const allMsgs = data.messages || [];
        setMessages(allMsgs);
        setStats({
          total: data.totalCount || 0,
          unread: data.unreadCount || 0,
          read: allMsgs.filter((m) => m.status === "read").length,
          replied: allMsgs.filter((m) => m.status === "replied").length,
          resolved: allMsgs.filter((m) => m.status === "resolved").length,
          dpdp: allMsgs.filter((m) => m.category && m.category !== "general").length,
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

  useEffect(() => {
    if (selectedMessage) {
      setAdminResponseText(selectedMessage.adminResponse || "");
    }
  }, [selectedMessage]);

  const handleUpdateStatus = async (id, newStatus, responseNote = null) => {
    setActionLoadingId(id);
    try {
      const payload = { status: newStatus };
      if (responseNote !== null) {
        payload.adminResponse = responseNote;
      }

      const res = await authFetch(`${apiUrl}/api/contact/admin/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchMessages();
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage((prev) => ({
            ...prev,
            status: newStatus,
            adminResponse: responseNote !== null ? responseNote : prev.adminResponse,
            resolvedAt: newStatus === "resolved" ? new Date() : prev.resolvedAt,
          }));
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

  const filteredMessages = messages.filter((m) => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "dpdp") return m.category && m.category !== "general";
    return m.category === categoryFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Citizen Inquiries & Grievance Cell</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage general contact messages and DPDP Act 2023 statutory citizen privacy grievances.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Total Inquiries</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats.total}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center text-lg">
            <i className="fas fa-inbox"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-amber-500">Unread</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats.unread}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
            <i className="fas fa-envelope"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-blue-500">Replied</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">{stats.replied}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
            <i className="fas fa-reply"></i>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-500">Resolved</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.resolved}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
            <i className="fas fa-check-circle"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-pink-50 p-5 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-indigo-700">DPDP Matters</p>
            <p className="text-2xl font-extrabold text-[#F43676] mt-1">{stats.dpdp}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white text-indigo-600 flex items-center justify-center text-lg shadow-xs">
            <i className="fas fa-shield-alt"></i>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["all", "unread", "read", "replied", "resolved", "archived"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filter === status
                  ? "bg-[#302d55] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {status}
            </button>
          ))}
          <span className="text-slate-300">|</span>
          <button
            onClick={() => setCategoryFilter(categoryFilter === "dpdp" ? "all" : "dpdp")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === "dpdp"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            <i className="fas fa-filter text-xs"></i> Only DPDP Requests
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            placeholder="Search ticket, name, email..."
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
            <p>Loading messages & grievances...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <i className="fas fa-inbox text-4xl mb-3 opacity-40"></i>
            <p className="font-semibold text-slate-600">No messages found matching criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMessages.map((msg) => {
              const isDPDP = msg.category && msg.category !== "general";
              return (
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
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {msg.ticketId && (
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          #{msg.ticketId}
                        </span>
                      )}
                      {isDPDP && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                          DPDP: {msg.category.replace("_", " ")}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          msg.status === "unread"
                            ? "bg-amber-100 text-amber-800"
                            : msg.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : msg.status === "replied"
                            ? "bg-blue-100 text-blue-800"
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
                      {msg.resolvedAt && (
                        <span className="text-emerald-700 font-semibold text-[11px]">
                          <i className="fas fa-check mr-1"></i> Resolved on {new Date(msg.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
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
                      View & Resolve
                    </button>

                    <a
                      href={`mailto:${msg.email}?subject=Re: [${msg.ticketId || "SOSIGN"}] ${encodeURIComponent(msg.subject)}`}
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
              );
            })}
          </div>
        )}
      </div>

      {/* Message & Grievance View Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {selectedMessage.ticketId && (
                    <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Ticket #{selectedMessage.ticketId}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      selectedMessage.status === "unread"
                        ? "bg-amber-100 text-amber-800"
                        : selectedMessage.status === "resolved"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedMessage.status === "replied"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {selectedMessage.status}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-800">{selectedMessage.subject}</h2>
                <p className="text-xs text-slate-400">{formatDate(selectedMessage.createdAt)}</p>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Sender & Classification Info */}
            <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-2 text-xs text-slate-700">
              <div>
                <span className="font-bold text-slate-500">From:</span> {selectedMessage.name}
              </div>
              <div>
                <span className="font-bold text-slate-500">Email:</span>{" "}
                <a href={`mailto:${selectedMessage.email}`} className="text-[#3650AD] underline">
                  {selectedMessage.email}
                </a>
              </div>
              <div>
                <span className="font-bold text-slate-500">Classification:</span>{" "}
                <span className="font-bold text-purple-700 uppercase">
                  {selectedMessage.category || "GENERAL"}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-500">Status:</span>{" "}
                <span className="capitalize font-bold">{selectedMessage.status}</span>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 mb-1.5">Citizen Message / Grievance Particulars</p>
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>

            {/* Grievance Resolution & Response Note */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Official Resolution Note (Visible to Citizen in Ticket Tracker):
              </label>
              <textarea
                rows={3}
                value={adminResponseText}
                onChange={(e) => setAdminResponseText(e.target.value)}
                placeholder="Enter formal grievance resolution, action taken, or explanation for the citizen..."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#F43676] resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedMessage._id, "resolved", adminResponseText)}
                  disabled={actionLoadingId === selectedMessage._id}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <i className="fas fa-check"></i> Save & Mark as Resolved
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedMessage._id, selectedMessage.status, adminResponseText)}
                  disabled={actionLoadingId === selectedMessage._id}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Save Note Only
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Quick Status:</span>
                <select
                  value={selectedMessage.status}
                  onChange={(e) => handleUpdateStatus(selectedMessage._id, e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-bold"
                >
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(selectedMessage._id)}
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Delete
                </button>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: [${selectedMessage.ticketId || "SOSIGN"}] ${encodeURIComponent(
                    selectedMessage.subject
                  )}`}
                  onClick={() => handleUpdateStatus(selectedMessage._id, "replied")}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#3650AD] to-[#F43676] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <i className="fas fa-reply"></i> Email Reply
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
