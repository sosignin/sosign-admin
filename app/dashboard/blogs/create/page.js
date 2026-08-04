"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RichBlogEditor from "@/components/RichBlogEditor";

export default function CreateBlogPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [titleFont, setTitleFont] = useState("'Outfit', sans-serif");
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        excerpt: "",
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
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
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

            const cleanTitle = formData.title.replace(/<[^>]*>/g, "").trim();

            // Use FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append("title", cleanTitle);
            formDataToSend.append("titleFont", titleFont);
            formDataToSend.append("content", formData.content);
            formDataToSend.append("excerpt", formData.excerpt);
            formDataToSend.append("author", formData.author);
            formDataToSend.append("category", formData.category);
            formDataToSend.append("tags", formData.tags);
            formDataToSend.append("isFeatured", formData.isFeatured);
            formDataToSend.append("isPublished", formData.isPublished);
            if (imageFile) {
                formDataToSend.append("image", imageFile);
            }

            const res = await fetch(`${apiUrl}/api/blogs`, {
                method: "POST",
                credentials: "include",
                body: formDataToSend,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to create blog");
            }

            router.push("/dashboard/blogs");
        } catch (err) {
            console.error("Error creating blog:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 rounded-full">
                                Studio Redesign
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                            Create New Blog Post
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
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner animate-spin"></i>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane"></i>
                                Publish Post
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
                                <p className="text-xs font-bold text-slate-800">Publish Immediately</p>
                                <p className="text-[11px] text-gray-500">Visible to public right after saving</p>
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
                            Ready to Publish?
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Review your styled title, rich formatted content, and category tags before submitting.
                        </p>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner animate-spin"></i>
                                    Creating Blog Post...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus-circle"></i>
                                    Create Blog Post
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
