"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authFetch } from "@/utils/api";

export default function NewsletterManagementPage() {
  const [activeTab, setActiveTab] = useState("issues"); // "issues" or "subscribers"
  const [newsletters, setNewsletters] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({ total: 0, publishedCount: 0, draftCount: 0, totalSubscribers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subscriberSearch, setSubscriberSearch] = useState("");

  const fetchNewsletters = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await authFetch(`${apiUrl}/api/newsletters/admin/all?page=${currentPage}&limit=10`);

      if (!res.ok) throw new Error("Failed to fetch newsletters");

      const data = await res.json();
      setNewsletters(data.newsletters || []);
      if (data.stats) setStats(data.stats);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching newsletters:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const searchParam = subscriberSearch ? `&search=${encodeURIComponent(subscriberSearch)}` : "";
      const res = await authFetch(`${apiUrl}/api/newsletters/admin/subscribers?page=${currentPage}&limit=20${searchParam}`);

      if (!res.ok) throw new Error("Failed to fetch subscribers");

      const data = await res.json();
      setSubscribers(data.subscribers || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching subscribers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "issues") {
      fetchNewsletters();
    } else {
      fetchSubscribers();
    }
  }, [activeTab, currentPage, subscriberSearch]);

  const handleDeleteNewsletter = async (id) => {
    if (!confirm("Are you sure you want to delete this newsletter edition?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await authFetch(`${apiUrl}/api/newsletters/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "delete" }),
      });

      if (!res.ok) throw new Error("Failed to delete newsletter");

      fetchNewsletters();
    } catch (err) {
      console.error("Error deleting newsletter:", err);
      alert("Failed to delete newsletter");
    }
  };

  const togglePublished = async (id) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await authFetch(`${apiUrl}/api/newsletters/${id}/publish`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to toggle status");

      fetchNewsletters();
    } catch (err) {
      console.error("Error toggling publish status:", err);
    }
  };

  const handleDeleteSubscriber = async (id) => {
    if (!confirm("Are you sure you want to remove this subscriber?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await authFetch(`${apiUrl}/api/newsletters/admin/subscribers/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "delete" }),
      });

      if (!res.ok) throw new Error("Failed to delete subscriber");

      fetchSubscribers();
    } catch (err) {
      console.error("Error removing subscriber:", err);
      alert("Failed to delete subscriber");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-xl">
              <i className="fas fa-envelope-open-text text-xl"></i>
            </span>
            Newsletter Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create, manage SEO newsletter editions and oversee email subscribers.
          </p>
        </div>
        <Link
          href="/dashboard/newsletters/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-medium rounded-xl hover:from-rose-700 hover:to-pink-700 transition-all shadow-md shadow-rose-500/20"
        >
          <i className="fas fa-plus"></i> Create Newsletter Issue
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Total Editions</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <i className="fas fa-newspaper text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Published</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.publishedCount || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <i className="fas fa-check-circle text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Drafts</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.draftCount || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/50 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <i className="fas fa-pencil-alt text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Active Subscribers</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.totalSubscribers || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/50 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400">
              <i className="fas fa-users text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => { setActiveTab("issues"); setCurrentPage(1); }}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === "issues"
              ? "border-rose-600 text-rose-600 dark:text-rose-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <i className="fas fa-list-alt mr-2"></i> Newsletter Issues ({stats.total || 0})
        </button>
        <button
          onClick={() => { setActiveTab("subscribers"); setCurrentPage(1); }}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === "subscribers"
              ? "border-rose-600 text-rose-600 dark:text-rose-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <i className="fas fa-user-friends mr-2"></i> Email Subscribers ({stats.totalSubscribers || 0})
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-rose-200 border-t-rose-600 mb-3"></div>
          <p className="text-gray-500">Loading {activeTab === "issues" ? "newsletters" : "subscribers"}...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
          <p className="text-red-600 font-medium mb-3">Error: {error}</p>
          <button
            onClick={() => activeTab === "issues" ? fetchNewsletters() : fetchSubscribers()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tab Content 1: Issues List */}
      {!loading && !error && activeTab === "issues" && (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {newsletters.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-paper-plane text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Newsletter Issues Found</h3>
              <p className="text-gray-500 text-sm mt-1 mb-6">Get started by creating your first SEO newsletter edition!</p>
              <Link
                href="/dashboard/newsletters/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 transition-all"
              >
                <i className="fas fa-plus"></i> Create Issue #1
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Issue #</th>
                    <th className="py-4 px-6">Newsletter Details</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Views</th>
                    <th className="py-4 px-6">Date Published</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                  {newsletters.map((newsletter) => (
                    <tr key={newsletter._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">
                        #{newsletter.issueNumber || 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {newsletter.coverImage ? (
                            <img
                              src={newsletter.coverImage}
                              alt={newsletter.title}
                              className="w-12 h-12 object-cover rounded-lg shrink-0 border"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                              NL
                            </div>
                          )}
                          <div className="max-w-md">
                            <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                              {newsletter.title}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {newsletter.subject || newsletter.excerpt}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                          {newsletter.category || "General"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => togglePublished(newsletter._id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            newsletter.isPublished
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${newsletter.isPublished ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                          {newsletter.isPublished ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-medium">
                        <i className="fas fa-eye text-xs text-gray-400 mr-1.5"></i>
                        {newsletter.views || 0}
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-xs">
                        {formatDate(newsletter.publishedAt || newsletter.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <a
                          href={`/newsletter/${newsletter.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors inline-block"
                          title="Preview Issue Page"
                        >
                          <i className="fas fa-external-link-alt"></i>
                        </a>
                        <Link
                          href={`/dashboard/newsletters/edit/${newsletter._id}`}
                          className="p-2 text-gray-400 hover:text-rose-600 transition-colors inline-block"
                          title="Edit Issue"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          onClick={() => handleDeleteNewsletter(newsletter._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors inline-block"
                          title="Delete Issue"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Subscribers List */}
      {!loading && !error && activeTab === "subscribers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search subscribers by email..."
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {subscribers.length === 0 ? (
              <div className="py-16 text-center">
                <i className="fas fa-users-slash text-4xl text-gray-300 mb-3"></i>
                <p className="text-gray-500 font-medium">No subscribers found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Subscriber Email</th>
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Source</th>
                      <th className="py-4 px-6">Subscribed Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                          {subscriber.email}
                        </td>
                        <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                          {subscriber.name || "N/A"}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            subscriber.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          }`}>
                            {subscriber.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-500">
                          {subscriber.source || "website"}
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-500">
                          {formatDate(subscriber.subscribedAt || subscriber.createdAt)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(subscriber._id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove Subscriber"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
