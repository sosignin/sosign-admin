"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import RichBlogEditor from "@/components/RichBlogEditor";
import { authFetch } from "@/utils/api";

export default function EditBlogPage() {
    const router = useRouter();
    const params = useParams();
    const blogId = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [titleFont, setTitleFont] = useState("'Outfit', sans-serif");
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        isSlugEdited: true,
        content: "",
        excerpt: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        author: "",
        category: "General",
        tags: "",
        isFeatured: false,
        isPublished: true,
    });

    const categories = [
        "General",
        "Change",
        "Inspiration",
        "Stories",
        "Community",
        "Action",
        "Impact",
        "Environment",
        "Education",
        "Health",
        "Politics",
        "Human Rights",
    ];

    const titleFonts = [
        { label: "Outfit (Modern Sans)", value: "'Outfit', sans-serif" },
        { label: "Inter (Clean Sans)", value: "'Inter', sans-serif" },
        { label: "Playfair Display (Editorial)", value: "'Playfair Display', serif" },
        { label: "Merriweather (Classic Serif)", value: "'Merriweather', serif" },
        { label: "Montserrat (Bold Sans)", value: "'Montserrat', sans-serif" },
        { label: "Fira Code (Tech Code)", value: "'Fira Code', monospace" },
        { label: "Caveat (Handwritten)", value: "'Caveat', cursive" },
    ];

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await authFetch(`${apiUrl}/api/blogs/admin/${blogId}`);

                if (!res.ok) throw new Error("Failed to fetch blog");

                const blog = await res.json();
                let rawTitle = blog.title || "";
                let extractedFont = blog.titleFont || "'Outfit', sans-serif";
                if (rawTitle.includes("font-family:")) {
                    const matchFont = rawTitle.match(/font-family:\s*([^"'>]+)/);
                    if (matchFont && matchFont[1]) {
                        extractedFont = matchFont[1].trim();
                    }
                    rawTitle = rawTitle.replace(/<[^>]*>/g, "").trim();
                }
                setTitleFont(extractedFont);

                setFormData({
                    title: rawTitle,
                    slug: blog.slug || "",
                    isSlugEdited: true,
                    content: blog.content || "",
                    excerpt: blog.excerpt || "",
                    metaTitle: blog.metaTitle || "",
                    metaDescription: blog.metaDescription || "",
                    metaKeywords: blog.metaKeywords || "",
                    author: blog.author || "",
                    category: blog.category || "General",
                    tags: blog.tags?.join(", ") || "",
                    isFeatured: blog.isFeatured || false,
                    isPublished: blog.isPublished || false,
                });
                if (blog.image) {
                    setImagePreview(blog.image);
                    setOriginalImage(blog.image);
                }
            } catch (err) {
                console.error("Error fetching blog:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (blogId) {
            fetchBlog();
        }
    }, [blogId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === "title") {
            const newTitle = value;
            const autoSlug = newTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            setFormData((prev) => ({
                ...prev,
                title: newTitle,
                slug: prev.isSlugEdited ? prev.slug : autoSlug,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }));
        }
    };

    const handleSlugChange = (e) => {
        const rawSlug = e.target.value;
        const cleanSlug = rawSlug
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-");
        setFormData((prev) => ({
            ...prev,
            slug: cleanSlug,
            isSlugEdited: true,
        }));
    };

    const resetSlugFromTitle = () => {
        const autoSlug = formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        setFormData((prev) => ({
            ...prev,
            slug: autoSlug,
            isSlugEdited: false,
        }));
    };

    // Handle image selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Clear selected image
    const clearImage = () => {
        setImageFile(null);
        setImagePreview(originalImage);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

            const cleanTitle = formData.title.replace(/<[^>]*>/g, "").trim();

            // Use FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append("title", cleanTitle);
            formDataToSend.append("titleFont", titleFont);
            formDataToSend.append("slug", formData.slug);
            formDataToSend.append("content", formData.content);
            formDataToSend.append("excerpt", formData.excerpt);
            formDataToSend.append("metaTitle", formData.metaTitle);
            formDataToSend.append("metaDescription", formData.metaDescription);
            formDataToSend.append("metaKeywords", formData.metaKeywords);
            formDataToSend.append("author", formData.author);
            formDataToSend.append("category", formData.category);
            formDataToSend.append("tags", formData.tags);
            formDataToSend.append("isFeatured", formData.isFeatured);
            formDataToSend.append("isPublished", formData.isPublished);
            if (imageFile) {
                formDataToSend.append("image", imageFile);
            }

            const res = await authFetch(`${apiUrl}/api/blogs/${blogId}`, {
                method: "PUT",
                body: formDataToSend,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to update blog");
            }

            router.push("/dashboard/blogs");
        } catch (err) {
            console.error("Error updating blog:", err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-200 border-t-cyan-600"></div>
                <p className="text-gray-500 font-semibold text-sm">Loading blog editor...</p>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header section with status badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/blogs"
                        className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-gray-700 hover:bg-cyan-500 hover:text-white transition-all shadow-xs"
                    >
                        <i className="fas fa-arrow-left text-lg"></i>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-pink-100 text-pink-800 rounded-full">
                                Editing Post
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                            Edit Blog Post
                        </h1>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/blogs"
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
                    >
                        {saving ? (
                            <>
                                <i className="fas fa-spinner animate-spin"></i>
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm font-semibold flex items-center gap-3">
                    <i className="fas fa-exclamation-circle text-lg"></i>
                    {error}
                </div>
            )}

            {/* Main Form Grid */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2 Cols): Title, Excerpt & Rich Text Editor */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title & Font Styling Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <label className="block text-sm font-bold text-slate-800">
                                Blog Title <span className="text-red-500">*</span>
                            </label>
                            {/* Title Font Picker */}
                            <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-xl px-3 py-1 text-xs">
                                <span className="text-gray-500 font-medium">Title Style:</span>
                                <select
                                    value={titleFont}
                                    onChange={(e) => setTitleFont(e.target.value)}
                                    className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                                >
                                    {titleFonts.map((tf) => (
                                        <option key={tf.value} value={tf.value} style={{ fontFamily: tf.value }}>
                                            {tf.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="Enter a compelling title..."
                            style={{ fontFamily: titleFont }}
                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none text-xl md:text-2xl font-bold transition-all text-slate-900 placeholder:text-gray-300 placeholder:font-normal"
                        />
                    </div>

                    {/* SEO Permalink / Custom URL Slug */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <i className="fas fa-link text-cyan-600"></i>
                                    SEO Permalink / URL Slug
                                </label>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Custom search-engine friendly web address for this blog post.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={resetSlugFromTitle}
                                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                                title="Auto-generate URL slug from title"
                            >
                                <i className="fas fa-sync-alt text-[10px]"></i>
                                Reset from Title
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                            <span className="text-xs font-semibold text-gray-400 select-none">
                                sosign.in/blog/
                            </span>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleSlugChange}
                                placeholder="my-custom-seo-url-slug"
                                className="w-full bg-transparent outline-none text-sm font-mono font-medium text-slate-800 placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    {/* Excerpt Input */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-2">
                        <label className="block text-sm font-bold text-slate-800">
                            Blog Excerpt / Short Summary
                        </label>
                        <p className="text-xs text-gray-400">
                            Appears on blog card previews, site search results, and social cards.
                        </p>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Provide a concise 1-2 sentence teaser about this post..."
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all resize-none text-slate-700 text-sm leading-relaxed"
                        />
                    </div>

                    {/* Content Section with Rich Customization Editor */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-800 px-2">
                            Blog Content & Typography Styling <span className="text-red-500">*</span>
                        </label>
                        <RichBlogEditor
                            value={formData.content}
                            onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                            title={formData.title}
                            author={formData.author}
                            category={formData.category}
                            imagePreview={imagePreview}
                        />
                    </div>
                </div>

                {/* Right Sidebar Column: Cover Image, Author, Category, Tags & Settings */}
                <div className="space-y-6">
                    {/* Cover Image Upload Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <label className="block text-sm font-bold text-slate-800">
                            Cover Banner Image
                        </label>
                        <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-cyan-400 transition-colors bg-slate-50/50">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {imagePreview ? (
                                <div className="relative group">
                                    <img
                                        src={imagePreview}
                                        alt="Cover preview"
                                        className="max-h-48 w-full object-cover rounded-xl shadow-xs"
                                    />
                                    {imageFile && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearImage();
                                            }}
                                            className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-all z-20 shadow-md"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2 font-medium">Click or drag to replace image</p>
                                </div>
                            ) : (
                                <div className="py-6">
                                    <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <i className="fas fa-cloud-upload-alt text-xl"></i>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">Upload Cover Image</p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meta Details Card (Author, Category, Tags) */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-gray-100 pb-3">
                            Metadata & Category
                        </h3>

                        {/* Author */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Author Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Sarah Jenkins"
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Primary Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all bg-white font-medium"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Tags (comma-separated)
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="community, design, news..."
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* SEO Meta Tags Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <i className="fas fa-search text-cyan-600"></i>
                                SEO Meta Tags
                            </h3>
                            <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                                Search Engines
                            </span>
                        </div>

                        {/* Meta Title */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-gray-700">
                                    Meta Title
                                </label>
                                <span className={`text-[11px] font-mono ${formData.metaTitle.length > 60 ? 'text-amber-500 font-bold' : 'text-gray-400'}`}>
                                    {formData.metaTitle.length}/60
                                </span>
                            </div>
                            <input
                                type="text"
                                name="metaTitle"
                                value={formData.metaTitle}
                                onChange={handleChange}
                                placeholder="Custom SEO Page Title (50-60 chars)..."
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                Appears in Google search results & browser tabs.
                            </p>
                        </div>

                        {/* Meta Description */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-gray-700">
                                    Meta Description
                                </label>
                                <span className={`text-[11px] font-mono ${formData.metaDescription.length > 160 ? 'text-amber-500 font-bold' : 'text-gray-400'}`}>
                                    {formData.metaDescription.length}/160
                                </span>
                            </div>
                            <textarea
                                name="metaDescription"
                                value={formData.metaDescription}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Search engine snippet summary (150-160 chars)..."
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all resize-none leading-relaxed"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                Displayed below the title in search engine result pages.
                            </p>
                        </div>

                        {/* Meta Keywords */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Meta Keywords (comma-separated)
                            </label>
                            <input
                                type="text"
                                name="metaKeywords"
                                value={formData.metaKeywords}
                                onChange={handleChange}
                                placeholder="e.g. paper leaks, exam scams, student rights..."
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                Meta keywords tag for indexing engines and topic classification.
                            </p>
                        </div>
                    </div>

                    {/* Publishing Options Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-gray-100 pb-3">
                            Publishing Controls
                        </h3>

                        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-gray-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                            <div>
                                <p className="text-xs font-bold text-slate-800">Featured Article</p>
                                <p className="text-[11px] text-gray-500">Highlight post on home banner</p>
                            </div>
                            <input
                                type="checkbox"
                                name="isFeatured"
                                checked={formData.isFeatured}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-gray-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                            <div>
                                <p className="text-xs font-bold text-slate-800">Published</p>
                                <p className="text-[11px] text-gray-500">Visible to public on main site</p>
                            </div>
                            <input
                                type="checkbox"
                                name="isPublished"
                                checked={formData.isPublished}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                            />
                        </label>
                    </div>

                    {/* Submit Button Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <i className="fas fa-check-circle text-cyan-400"></i>
                            Save Updates
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Changes will be reflected across your site immediately upon saving.
                        </p>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            {saving ? (
                                <>
                                    <i className="fas fa-spinner animate-spin"></i>
                                    Saving Changes...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
