"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function BlogManagementPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/api/blogs/admin/all?page=${currentPage}&limit=10`, {
                credentials: "include",
            });

            if (!res.ok) throw new Error("Failed to fetch blogs");

            const data = await res.json();
            setBlogs(data.blogs || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("Error fetching blogs:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, [currentPage]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this blog?")) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/api/blogs/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) throw new Error("Failed to delete blog");

            fetchBlogs();
        } catch (err) {
            console.error("Error deleting blog:", err);
            alert("Failed to delete blog");
        }
    };

    const toggleFeatured = async (id) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/api/blogs/${id}/featured`, {
                method: "PATCH",
                credentials: "include",
            });

            if (!res.ok) throw new Error("Failed to toggle featured");

            fetchBlogs();
        } catch (err) {
            console.error("Error toggling featured:", err);
        }
    };

    const togglePublished = async (id) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/api/blogs/${id}/publish`, {
                method: "PATCH",
                credentials: "include",
            });

            if (!res.ok) throw new Error("Failed to toggle published");

            fetchBlogs();
        } catch (err) {
            console.error("Error toggling published:", err);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-200 border-t-cyan-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 mb-4">Error: {error}</p>
                    <button
                        onClick={fetchBlogs}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Blog Management</h1>
                    <p className="text-gray-500 mt-1">Create and manage blog posts</p>
                </div>
                <Link
                    href="/dashboard/blogs/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg shadow-cyan-500/25"
                >
                    <i className="fas fa-plus"></i>
                    Create New Blog
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                            <i className="fas fa-blog text-cyan-600 text-xl"></i>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{blogs.length}</p>
                            <p className="text-gray-500 text-sm">Total Blogs</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <i className="fas fa-check-circle text-green-600 text-xl"></i>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">
                                {blogs.filter((b) => b.isPublished).length}
                            </p>
                            <p className="text-gray-500 text-sm">Published</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <i className="fas fa-star text-yellow-600 text-xl"></i>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">
                                {blogs.filter((b) => b.isFeatured).length}
                            </p>
                            <p className="text-gray-500 text-sm">Featured</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Blogs Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {blogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-blog text-gray-400 text-3xl"></i>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No blogs yet</h3>
                        <p className="text-gray-500 mb-6">Create your first blog post to get started</p>
                        <Link
                            href="/dashboard/blogs/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 transition-colors"
                        >
                            <i className="fas fa-plus"></i>
                            Create Blog
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Blog</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Author</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Featured</th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Published</th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {blogs.map((blog) => (
                                    <tr key={blog._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                    {blog.image ? (
                                                        <img
                                                            src={blog.image}
                                                            alt={blog.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <i className="fas fa-image text-gray-400"></i>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-800 truncate max-w-[200px]">
                                                        {blog.title ? String(blog.title).replace(/<[^>]*>/g, "").trim() : ""}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{blog.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{blog.author}</td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(blog.createdAt)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleFeatured(blog._id)}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${blog.isFeatured
                                                        ? "bg-yellow-100 text-yellow-600"
                                                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                    }`}
                                            >
                                                <i className={`fas fa-star ${blog.isFeatured ? "" : "far"}`}></i>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => togglePublished(blog._id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${blog.isPublished
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                    }`}
                                            >
                                                {blog.isPublished ? "Published" : "Draft"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    href={`/dashboard/blogs/edit/${blog._id}`}
                                                    className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"
                                                >
                                                    <i className="fas fa-edit text-sm"></i>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(blog._id)}
                                                    className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                                                >
                                                    <i className="fas fa-trash text-sm"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
