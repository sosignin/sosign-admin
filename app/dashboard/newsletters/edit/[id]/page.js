"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditNewsletterPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    category: "Social Impact",
    author: "Sosign Editorial Team",
    issueNumber: "",
    coverImage: "",
    content: "",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
    isPublished: true,
    isFeatured: false,
  });

  useEffect(() => {
    const fetchNewsletter = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${apiUrl}/api/newsletters/admin/${id}`, {
          headers,
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch newsletter issue");

        const data = await res.json();
        setFormData({
          title: data.title || "",
          subject: data.subject || "",
          category: data.category || "Social Impact",
          author: data.author || "Sosign Editorial Team",
          issueNumber: data.issueNumber || "",
          coverImage: data.coverImage || "",
          content: data.content || "",
          excerpt: data.excerpt || "",
          metaTitle: data.metaTitle || data.title || "",
          metaDescription: data.metaDescription || data.excerpt || "",
          keywords: Array.isArray(data.keywords) ? data.keywords.join(", ") : data.keywords || "",
          isPublished: data.isPublished ?? true,
          isFeatured: data.isFeatured ?? false,
        });

        if (data.coverImage) {
          setImagePreview(data.coverImage);
        }
      } catch (err) {
        console.error("Error loading newsletter:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchNewsletter();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      setError("Please fill in both Title and Content fields.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

      const body = new FormData();
      body.append("title", formData.title);
      body.append("subject", formData.subject);
      body.append("content", formData.content);
      body.append("excerpt", formData.excerpt);
      body.append("author", formData.author);
      body.append("category", formData.category);
      if (formData.issueNumber) body.append("issueNumber", formData.issueNumber);
      body.append("metaTitle", formData.metaTitle);
      body.append("metaDescription", formData.metaDescription);
      body.append("keywords", formData.keywords);
      body.append("isPublished", formData.isPublished);
      body.append("isFeatured", formData.isFeatured);

      if (imageFile) {
        body.append("image", imageFile);
      } else if (formData.coverImage) {
        body.append("coverImage", formData.coverImage);
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${apiUrl}/api/newsletters/${id}`, {
        method: "PUT",
        headers,
        body,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update newsletter");
      }

      router.push("/dashboard/newsletters");
    } catch (err) {
      console.error("Error updating newsletter:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-rose-200 border-t-rose-600 mb-3"></div>
        <p className="text-gray-500">Loading newsletter issue details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/dashboard/newsletters"
            className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-rose-600 mb-2 transition-colors"
          >
            <i className="fas fa-arrow-left mr-1.5"></i> Back to Newsletters
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Newsletter Issue #{formData.issueNumber}
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
            <i className="fas fa-edit text-rose-600"></i> Edit Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
                Issue Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
                Issue Number
              </label>
              <input
                type="number"
                name="issueNumber"
                value={formData.issueNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
                Email Subject / Subtitle
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
              >
                <option value="Social Impact">Social Impact</option>
                <option value="Community Victories">Community Victories</option>
                <option value="Policy & Reform">Policy & Reform</option>
                <option value="Environment">Environment</option>
                <option value="Human Rights">Human Rights</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
              Cover Image
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
              />
              <span className="text-xs text-gray-400">OR</span>
              <input
                type="url"
                name="coverImage"
                placeholder="https://example.com/image.jpg"
                value={formData.coverImage}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
              />
            </div>
            {imagePreview && (
              <div className="mt-3 w-32 h-20 rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              rows="12"
              required
              value={formData.content}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500 font-mono leading-relaxed"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
              Short Excerpt
            </label>
            <textarea
              name="excerpt"
              rows="2"
              value={formData.excerpt}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
            ></textarea>
          </div>
        </div>

        {/* SEO Meta Tags */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
            <i className="fas fa-search text-emerald-600"></i> SEO Metadata & Search Engines
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
              Meta Title (SEO)
            </label>
            <input
              type="text"
              name="metaTitle"
              value={formData.metaTitle}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
              Meta Description (SEO)
            </label>
            <textarea
              name="metaDescription"
              rows="2"
              value={formData.metaDescription}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
              Keywords (Comma Separated)
            </label>
            <input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Options & Action */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleInputChange}
                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
              />
              Published
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
              />
              Featured
            </label>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/dashboard/newsletters"
              className="px-5 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-semibold hover:bg-gray-50 text-center w-full sm:w-auto"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-all disabled:opacity-50 text-center w-full sm:w-auto shadow-md shadow-rose-500/20"
            >
              {saving ? "Saving Changes..." : "Update Newsletter Issue"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
