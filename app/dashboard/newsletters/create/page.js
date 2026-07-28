"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateNewsletterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

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
    keywords: "sosign newsletter, petitions, social change, community advocacy",
    isPublished: true,
    isFeatured: false,
  });

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

    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

      const body = new FormData();
      body.append("title", formData.title);
      body.append("subject", formData.subject || formData.title);
      body.append("content", formData.content);
      body.append("excerpt", formData.excerpt);
      body.append("author", formData.author);
      body.append("category", formData.category);
      if (formData.issueNumber) body.append("issueNumber", formData.issueNumber);
      body.append("metaTitle", formData.metaTitle || formData.title);
      body.append("metaDescription", formData.metaDescription || formData.excerpt || "");
      body.append("keywords", formData.keywords);
      body.append("isPublished", formData.isPublished);
      body.append("isFeatured", formData.isFeatured);

      if (imageFile) {
        body.append("image", imageFile);
      } else if (formData.coverImage) {
        body.append("coverImage", formData.coverImage);
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${apiUrl}/api/newsletters`, {
        method: "POST",
        headers,
        body,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create newsletter");
      }

      router.push("/dashboard/newsletters");
    } catch (err) {
      console.error("Error creating newsletter:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/dashboard/newsletters"
            className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-rose-600 mb-2 transition-colors"
          >
            <i className="fas fa-arrow-left mr-1.5"></i> Back to Newsletters
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Newsletter Issue
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <i className={`fas ${previewMode ? "fa-pen" : "fa-eye"}`}></i>
          {previewMode ? "Edit Mode" : "Preview Issue"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Live Preview Mode */}
      {previewMode ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-lg space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-6">
            <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider">
              {formData.category} • Issue #{formData.issueNumber || "Next"}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mt-3">
              {formData.title || "Untitled Newsletter Issue"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
              {formData.subject}
            </p>
            <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
              <span>By {formData.author}</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>

          {(imagePreview || formData.coverImage) && (
            <div className="rounded-2xl overflow-hidden max-h-[400px]">
              <img
                src={imagePreview || formData.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="prose max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed text-base">
            {formData.content || "Newsletter content preview will appear here..."}
          </div>
        </div>
      ) : (
        /* Edit Form */
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Main Information */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <i className="fas fa-file-alt text-rose-600"></i> Issue Details
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
                  placeholder="e.g. Empowering Local Communities: July Edition"
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
                  placeholder="Auto-generated if empty"
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
                  placeholder="Catchy subject line for email & subheader"
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
                Cover Image (Upload file or image URL)
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
                Content (Rich Text / Article Body) <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                rows="12"
                required
                placeholder="Write your newsletter edition content here..."
                value={formData.content}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500 font-mono leading-relaxed"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
                Short Excerpt / Teaser
              </label>
              <textarea
                name="excerpt"
                rows="2"
                placeholder="Short summary for archive grid & email snippet (auto-generated if empty)"
                value={formData.excerpt}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
              ></textarea>
            </div>
          </div>

          {/* Section 2: SEO Meta Tags (Crucial for SEO requirement) */}
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
                placeholder="Title that appears in Google Search Results"
                value={formData.metaTitle}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">Recommended: 50-60 characters</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
                Meta Description (SEO)
              </label>
              <textarea
                name="metaDescription"
                rows="2"
                placeholder="Snippet that appears in Google Search Results below the title"
                value={formData.metaDescription}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
              ></textarea>
              <p className="text-[11px] text-gray-400 mt-1">Recommended: 150-160 characters</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">
                Keywords (Comma Separated)
              </label>
              <input
                type="text"
                name="keywords"
                placeholder="petitions, social change, community news, advocacy"
                value={formData.keywords}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Section 3: Options & Publish */}
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
                Publish Immediately
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                Feature this issue
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
                disabled={loading}
                className="px-6 py-2.5 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-all disabled:opacity-50 text-center w-full sm:w-auto shadow-md shadow-rose-500/20"
              >
                {loading ? "Publishing..." : "Save Newsletter Issue"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
