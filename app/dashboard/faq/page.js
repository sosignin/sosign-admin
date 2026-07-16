"use client";

import { useState, useEffect } from "react";

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [questionInput, setQuestionInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("general");
  const [orderInput, setOrderInput] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
  };

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/faqs`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch FAQs");

      const data = await res.json();
      setFaqs(data.faqs || []);
    } catch (err) {
      console.error("Error fetching FAQs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [apiUrl]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setQuestionInput("");
    setAnswerInput("");
    setCategoryInput("general");
    setOrderInput(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (faq) => {
    setEditingId(faq._id);
    setQuestionInput(faq.question);
    setAnswerInput(faq.answer);
    setCategoryInput(faq.category || "general");
    setOrderInput(faq.order || 0);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      const res = await fetch(`${apiUrl}/api/faqs/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete FAQ");

      alert("FAQ deleted successfully!");
      fetchFaqs();
    } catch (err) {
      console.error("Error deleting FAQ:", err);
      alert(err.message || "Failed to delete FAQ");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionInput.trim() || !answerInput.trim()) {
      alert("Please fill in both the Question and the Answer.");
      return;
    }

    setSubmitting(false);
    try {
      const payload = {
        question: questionInput.trim(),
        answer: answerInput.trim(),
        category: categoryInput.toLowerCase(),
        order: Number(orderInput),
      };

      const url = editingId ? `${apiUrl}/api/faqs/${editingId}` : `${apiUrl}/api/faqs`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save FAQ");
      }

      alert(editingId ? "FAQ updated successfully!" : "FAQ created successfully!");
      setIsModalOpen(false);
      fetchFaqs();
    } catch (err) {
      console.error("Error saving FAQ:", err);
      alert(err.message || "Error saving FAQ");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "general", "petitions", "verification", "crowdfunding"];

  if (loading && faqs.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">FAQ Management</h1>
          <p className="text-gray-500 mt-1">Add, update, or reorder questions for the customer-facing site & Google SEO schemas.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:from-indigo-600 hover:to-blue-700 transition-all cursor-pointer"
        >
          <i className="fas fa-plus"></i>
          Add New FAQ
        </button>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
            <i className="fas fa-question text-indigo-600 text-xl"></i>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{faqs.length}</p>
            <p className="text-gray-500 text-sm">Total FAQ Questions</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 md:col-span-2 flex items-center">
          <div className="relative w-full">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search FAQs by question or answer keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-800 placeholder-gray-400 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize cursor-pointer ${
              activeCategory === cat
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
            }`}
          >
            {cat === "all" ? "All categories" : cat}
          </button>
        ))}
      </div>

      {/* FAQs List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold text-xs uppercase tracking-wider">
                <th className="px-6 py-4 w-16 text-center">Order</th>
                <th className="px-6 py-4">Question & Answer</th>
                <th className="px-6 py-4 w-40">Category</th>
                <th className="px-6 py-4 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => (
                  <tr key={faq._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-center font-semibold text-gray-500 bg-gray-50/20">
                      {faq.order || 0}
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-gray-900 text-base mb-1">{faq.question}</p>
                      <p className="text-gray-500 line-clamp-2 max-w-2xl text-xs">{faq.answer}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/50 capitalize">
                        {faq.category || "general"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(faq)}
                          className="w-9 h-9 flex items-center justify-center text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Edit FAQ"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(faq._id)}
                          className="w-9 h-9 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Delete FAQ"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium">
                    No FAQs found in this filter/search query. Click "Add New FAQ" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit FAQ Details" : "Create New FAQ"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-all cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Question *
                  </label>
                  <input
                    type="text"
                    required
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Enter the search-friendly question"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Answer Description *
                  </label>
                  <textarea
                    required
                    rows="6"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Provide a detailed, complete answer. Use keywords for SEO benefit."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-800 text-sm leading-relaxed"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-800 capitalize text-sm"
                    >
                      <option value="general">General</option>
                      <option value="petitions">Petitions</option>
                      <option value="verification">Verification & KYC</option>
                      <option value="crowdfunding">Crowdfunding</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Sorting Weight / Order
                    </label>
                    <input
                      type="number"
                      value={orderInput}
                      onChange={(e) => setOrderInput(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-800 text-sm"
                    />
                    <p className="text-gray-400 text-xs mt-1">Lower order numbers show up first on the FAQ page.</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-blue-700 hover:shadow-md transition-all cursor-pointer text-sm flex items-center gap-2"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white"></div>
                  )}
                  {editingId ? "Update FAQ" : "Create FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
