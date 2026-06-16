"use client";

import { useState, useEffect } from "react";

export default function RapidCreation() {
    const [activeTab, setActiveTab] = useState("user");
    const [users, setUsers] = useState([]);
    const [petitions, setPetitions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // User Form State
    const [userForm, setUserForm] = useState({
        name: "",
        email: "",
        mobileNumber: "",
        designation: "Citizen",
        bio: "Citizen supporter",
        verifyAadhaar: true,
    });

    // Petition Form State
    const [petitionForm, setPetitionForm] = useState({
        title: "",
        userId: "",
        problem: "",
        solution: "",
        category: "General",
        decisionMakers: [{ name: "", organization: "", email: "", phone: "" }],
        images: [],
        signingRequirements: {
            aadhar: { required: false },
            constituency: { required: false, allowedConstituency: "" }
        }
    });

    // Signature Form State
    const [signatureForm, setSignatureForm] = useState({
        petitionId: "",
        count: 50,
        useSameMobile: "9999990000",
    });

    // Reset KYC Form State
    const [resetKycForm, setResetKycForm] = useState({
        userId: "",
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Fetch initial data
    const fetchUsersAndPetitions = async () => {
        try {
            // Fetch users for starters list
            const userRes = await fetch(`${apiUrl}/api/admin/customers`, {
                credentials: "include",
            });
            const userData = await userRes.json();
            if (Array.isArray(userData)) {
                setUsers(userData);
            } else if (userData.success && Array.isArray(userData.users)) {
                setUsers(userData.users);
            } else {
                setUsers(userData.customers || []);
            }

            // Fetch petitions for signature list
            const petitionRes = await fetch(`${apiUrl}/api/admin/petitions`, {
                credentials: "include",
            });
            const petitionData = await petitionRes.json();
            // FIXED: Removed .success check since the endpoint returns the object directly without 'success: true'
            if (petitionData && Array.isArray(petitionData.petitions)) {
                setPetitions(petitionData.petitions);
            }

            // Fetch categories
            const categoryRes = await fetch(`${apiUrl}/api/admin/categories`, {
                credentials: "include",
            });
            const categoryData = await categoryRes.json();
            if (categoryData.success && Array.isArray(categoryData.categories)) {
                setCategories(categoryData.categories);
            }
        } catch (err) {
            console.error("Failed to load initial data", err);
        }
    };

    useEffect(() => {
        fetchUsersAndPetitions();
    }, [apiUrl]);

    // Random email domains for dummy users
    const randomDomains = [
        "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "protonmail.com",
        "rediffmail.com", "zoho.com", "icloud.com", "mail.com", "yandex.com",
        "aol.com", "fastmail.com", "tutanota.com", "inbox.com", "live.com"
    ];

    // Handle Quick Generate Email for Dummy User
    const handleGenerateEmail = () => {
        if (!userForm.name) {
            setMessage({ type: "error", text: "Please enter a name first to generate an email." });
            return;
        }
        const cleanName = userForm.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const uniqueNumber = Math.floor(1000 + Math.random() * 9000);
        const randomDomain = randomDomains[Math.floor(Math.random() * randomDomains.length)];
        setUserForm({
            ...userForm,
            email: `${cleanName}_${uniqueNumber}@${randomDomain}`,
            mobileNumber: userForm.mobileNumber || "9999990000",
        });
    };

    // Handle Image Upload for Petition
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        setMessage({ type: "", text: "" });

        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch(`${apiUrl}/api/admin/upload`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setPetitionForm(prev => ({
                    ...prev,
                    images: [...prev.images, data.url]
                }));
                setMessage({ type: "success", text: "Image uploaded successfully to Cloudinary!" });
            } else {
                setMessage({ type: "error", text: data.message || "Failed to upload image" });
            }
        } catch (err) {
            console.error("Error uploading image:", err);
            setMessage({ type: "error", text: "Error uploading image to server" });
        } finally {
            setUploadingImage(false);
        }
    };

    // Remove Image
    const handleRemoveImage = (indexToRemove) => {
        setPetitionForm(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    // Dynamic Decision Makers list
    const handleAddDecisionMaker = () => {
        setPetitionForm(prev => ({
            ...prev,
            decisionMakers: [...prev.decisionMakers, { name: "", organization: "", email: "", phone: "" }]
        }));
    };

    const handleRemoveDecisionMaker = (index) => {
        if (petitionForm.decisionMakers.length === 1) return;
        setPetitionForm(prev => ({
            ...prev,
            decisionMakers: prev.decisionMakers.filter((_, idx) => idx !== index)
        }));
    };

    const handleDecisionMakerChange = (index, field, value) => {
        setPetitionForm(prev => {
            const newDM = [...prev.decisionMakers];
            newDM[index] = { ...newDM[index], [field]: value };
            return { ...prev, decisionMakers: newDM };
        });
    };

    // Form Submissions
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch(`${apiUrl}/api/admin/dummy/user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userForm),
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: `User "${data.user.name}" created successfully!` });
                setUserForm({
                    name: "",
                    email: "",
                    mobileNumber: "",
                    designation: "Citizen",
                    bio: "Citizen supporter",
                    verifyAadhaar: true,
                });
                fetchUsersAndPetitions(); // Refresh list
            } else {
                setMessage({ type: "error", text: data.message || "Failed to create dummy user" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Connection error. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePetition = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch(`${apiUrl}/api/admin/dummy/petition`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(petitionForm),
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: `Petition "${data.petition.title}" launched successfully!` });
                setPetitionForm({
                    title: "",
                    userId: "",
                    problem: "",
                    solution: "",
                    category: "General",
                    decisionMakers: [{ name: "", organization: "", email: "", phone: "" }],
                    images: [],
                    signingRequirements: {
                        aadhar: { required: false },
                        constituency: { required: false, allowedConstituency: "" }
                    }
                });
                fetchUsersAndPetitions(); // Refresh list
            } else {
                setMessage({ type: "error", text: data.message || "Failed to create dummy petition" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Connection error. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handleAddSignatures = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch(`${apiUrl}/api/admin/dummy/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signatureForm),
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: data.message });
                setSignatureForm({
                    ...signatureForm,
                    count: 50,
                });
                fetchUsersAndPetitions(); // Refresh counters in lists
            } else {
                setMessage({ type: "error", text: data.message || "Failed to add dummy signatures" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Connection error. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handleResetKyc = async (type) => {
        if (!resetKycForm.userId) {
            setMessage({ type: "error", text: "Please select a user first." });
            return;
        }
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch(`${apiUrl}/api/admin/reset-kyc`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: resetKycForm.userId, type }),
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: data.message });
                fetchUsersAndPetitions(); // Refresh lists
            } else {
                setMessage({ type: "error", text: data.message || "Failed to reset user KYC" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Connection error. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rapid Creation Tools</h1>
                    <p className="text-gray-500 mt-1">Generate dummy users, petitions, and bulk signatures bypass-ready for launching campaigns</p>
                </div>
                <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-200">
                        <i className="fas fa-bolt text-white text-lg"></i>
                    </div>
                    <div>
                        <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Fast-Track Mode</p>
                        <p className="text-sm font-black text-amber-900 leading-none">Bypass KYC & OTP</p>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {message.text && (
                <div className={`p-4 rounded-2xl border ${message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"} shadow-md flex items-center gap-3 transition-all duration-300 animate-slide-in`}>
                    <i className={`fas ${message.type === "success" ? "fa-check-circle text-emerald-500" : "fa-exclamation-circle text-rose-500"} text-xl`}></i>
                    <p className="font-semibold">{message.text}</p>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl max-w-2xl">
                <button
                    onClick={() => { setActiveTab("user"); setMessage({ type: "", text: "" }); }}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "user" ? "bg-white text-amber-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <i className="fas fa-user-plus"></i>
                    Dummy User
                </button>
                <button
                    onClick={() => { setActiveTab("petition"); setMessage({ type: "", text: "" }); }}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "petition" ? "bg-white text-amber-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <i className="fas fa-file-alt"></i>
                    Dummy Petition
                </button>
                <button
                    onClick={() => { setActiveTab("signature"); setMessage({ type: "", text: "" }); }}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "signature" ? "bg-white text-amber-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <i className="fas fa-signature"></i>
                    Bulk Sign
                </button>
                <button
                    onClick={() => { setActiveTab("resetKyc"); setMessage({ type: "", text: "" }); }}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "resetKyc" ? "bg-white text-amber-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <i className="fas fa-trash-alt"></i>
                    Reset User KYC
                </button>
            </div>

            {/* Forms Area */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-8">
                {activeTab === "user" && (
                    <form onSubmit={handleCreateUser} className="space-y-6 max-w-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Create Dummy Supporters & Starter Accounts</h2>
                            <p className="text-gray-500 text-sm mt-1">This user can be used to start petitions or act as verified signers immediately.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter user's name"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                                    value={userForm.name}
                                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Mobile Number (Allow Duplicates)</label>
                                <input
                                    type="text"
                                    placeholder="Enter dummy mobile number (e.g. 9999990000)"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                                    value={userForm.mobileNumber}
                                    onChange={(e) => setUserForm({ ...userForm, mobileNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 flex justify-between items-center">
                                <span>Email Address (Must be Unique)</span>
                                <button
                                    type="button"
                                    onClick={handleGenerateEmail}
                                    className="text-xs text-amber-600 hover:text-amber-700 font-black uppercase tracking-wider flex items-center gap-1"
                                >
                                    <i className="fas fa-magic"></i> Auto-Generate
                                </button>
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="Enter or auto-generate email"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                                value={userForm.email}
                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Designation / Role</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Supporter, Organizer, Citizen"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                                    value={userForm.designation}
                                    onChange={(e) => setUserForm({ ...userForm, designation: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Bio Description</label>
                                <input
                                    type="text"
                                    placeholder="Short description of the user"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                                    value={userForm.bio}
                                    onChange={(e) => setUserForm({ ...userForm, bio: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                            <input
                                type="checkbox"
                                id="verifyAadhaar"
                                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                checked={userForm.verifyAadhaar}
                                onChange={(e) => setUserForm({ ...userForm, verifyAadhaar: e.target.checked })}
                            />
                            <label htmlFor="verifyAadhaar" className="text-sm font-bold text-amber-900 cursor-pointer selection:bg-transparent">
                                Pre-Verify Aadhaar KYC (Allows instant signing without undergoing OTP checks)
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-2xl shadow-xl shadow-amber-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <>
                                    <i className="fas fa-user-plus"></i>
                                    Create Dummy Supporter
                                </>
                            )}
                        </button>
                    </form>
                )}

                {activeTab === "petition" && (
                    <form onSubmit={handleCreatePetition} className="space-y-8 max-w-3xl">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Launch a Rapid Petition</h2>
                            <p className="text-gray-500 text-sm mt-1">Directly launch fully-approved petitions to populate categories instantly.</p>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-md font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                                <i className="fas fa-info-circle text-amber-500"></i> Basic Information
                            </h3>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Petition Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter petition title"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                                    value={petitionForm.title}
                                    onChange={(e) => setPetitionForm({ ...petitionForm, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Category</label>
                                    <select
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none bg-white font-medium"
                                        value={petitionForm.category}
                                        onChange={(e) => setPetitionForm({ ...petitionForm, category: e.target.value })}
                                    >
                                        <option value="General">General</option>
                                        {categories.length > 0 ? (
                                            categories.map(cat => (
                                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Human Rights">Human Rights</option>
                                                <option value="Environment">Environment</option>
                                                <option value="Health">Health</option>
                                                <option value="Education">Education</option>
                                                <option value="Justice">Justice</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 flex justify-between items-center">
                                        <span>Starter User</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (users.length > 0) {
                                                    const randomUser = users[Math.floor(Math.random() * users.length)];
                                                    setPetitionForm({ ...petitionForm, userId: randomUser._id });
                                                }
                                            }}
                                            className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                                        >
                                            <i className="fas fa-random"></i> Random Starter
                                        </button>
                                    </label>
                                    <select
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none bg-white font-medium"
                                        value={petitionForm.userId}
                                        onChange={(e) => setPetitionForm({ ...petitionForm, userId: e.target.value })}
                                    >
                                        <option value="">-- Select Starter User --</option>
                                        {users.map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Image Uploads */}
                        <div className="space-y-4">
                            <h3 className="text-md font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                                <i className="fas fa-image text-amber-500"></i> Petition Images
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <label className={`cursor-pointer px-5 py-3 border border-dashed border-amber-300 rounded-2xl flex items-center gap-3 font-bold text-sm bg-amber-50/20 text-amber-600 hover:bg-amber-50 transition-all duration-200 ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}>
                                        <i className={`fas ${uploadingImage ? "fa-circle-notch fa-spin" : "fa-cloud-upload-alt"}`}></i>
                                        {uploadingImage ? "Uploading to Cloudinary..." : "Upload Petition Image"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploadingImage}
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                </div>

                                {petitionForm.images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-2xl border">
                                        {petitionForm.images.map((url, idx) => (
                                            <div key={idx} className="relative group rounded-xl overflow-hidden shadow-md border aspect-[4/3] bg-white">
                                                <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200"
                                                >
                                                    <span className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white shadow shadow-rose-200">
                                                        <i className="fas fa-trash text-xs"></i>
                                                    </span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <h3 className="text-md font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                                <i className="fas fa-align-left text-amber-500"></i> Petition Content
                            </h3>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Problem Details</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Explain the problem this petition aims to solve..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none resize-none font-medium"
                                    value={petitionForm.problem}
                                    onChange={(e) => setPetitionForm({ ...petitionForm, problem: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Proposed Solution</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Explain the proposed solution..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none resize-none font-medium"
                                    value={petitionForm.solution}
                                    onChange={(e) => setPetitionForm({ ...petitionForm, solution: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Decision Makers */}
                        <div className="space-y-4">
                            <h3 className="text-md font-bold text-gray-800 border-b pb-2 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <i className="fas fa-bullhorn text-amber-500"></i> Decision Makers
                                </span>
                                <button
                                    type="button"
                                    onClick={handleAddDecisionMaker}
                                    className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                                >
                                    <i className="fas fa-plus"></i> Add Decision Maker
                                </button>
                            </h3>
                            
                            <div className="space-y-4">
                                {petitionForm.decisionMakers.map((dm, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 border rounded-2xl relative space-y-3">
                                        {petitionForm.decisionMakers.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDecisionMaker(idx)}
                                                className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 text-sm font-bold"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-500">Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Decision Maker Name"
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                                                    value={dm.name}
                                                    onChange={(e) => handleDecisionMakerChange(idx, "name", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-500">Organization</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Government, Court"
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                                                    value={dm.organization}
                                                    onChange={(e) => handleDecisionMakerChange(idx, "organization", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Signing Requirements */}
                        <div className="space-y-4">
                            <h3 className="text-md font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                                <i className="fas fa-shield-alt text-amber-500"></i> Verification & Requirements
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-amber-50/30 p-5 rounded-2xl border border-amber-100/50">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="requireAadhaar"
                                            className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                            checked={petitionForm.signingRequirements.aadhar.required}
                                            onChange={(e) => setPetitionForm(prev => ({
                                                ...prev,
                                                signingRequirements: {
                                                    ...prev.signingRequirements,
                                                    aadhar: { required: e.target.checked }
                                                }
                                            }))}
                                        />
                                        <label htmlFor="requireAadhaar" className="text-sm font-bold text-gray-800 cursor-pointer selection:bg-transparent">
                                            Require Aadhaar OTP Verification to sign
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="requireConstituency"
                                            className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                            checked={petitionForm.signingRequirements.constituency.required}
                                            onChange={(e) => setPetitionForm(prev => ({
                                                ...prev,
                                                signingRequirements: {
                                                    ...prev.signingRequirements,
                                                    constituency: {
                                                        ...prev.signingRequirements.constituency,
                                                        required: e.target.checked
                                                    }
                                                }
                                            }))}
                                        />
                                        <label htmlFor="requireConstituency" className="text-sm font-bold text-gray-800 cursor-pointer selection:bg-transparent">
                                            Restrict to specific Constituency
                                        </label>
                                    </div>
                                    
                                    {petitionForm.signingRequirements.constituency.required && (
                                        <div className="space-y-1 animate-fade-in pl-8">
                                            <label className="text-xs font-bold text-gray-500">Allowed Constituency Number</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 23"
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none"
                                                value={petitionForm.signingRequirements.constituency.allowedConstituency || ""}
                                                onChange={(e) => setPetitionForm(prev => ({
                                                    ...prev,
                                                    signingRequirements: {
                                                        ...prev.signingRequirements,
                                                        constituency: {
                                                            ...prev.signingRequirements.constituency,
                                                            allowedConstituency: e.target.value
                                                        }
                                                    }
                                                }))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-2xl shadow-xl shadow-amber-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <>
                                    <i className="fas fa-file-signature"></i>
                                    Launch Dummy Petition
                                </>
                            )}
                        </button>
                    </form>
                )}

                {activeTab === "signature" && (
                    <form onSubmit={handleAddSignatures} className="space-y-6 max-w-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Bulk Signatures Injector</h2>
                            <p className="text-gray-500 text-sm mt-1">Inject organic-looking signatures to boost petition metrics for launching hype.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Target Petition</label>
                            <select
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none bg-white font-medium text-gray-800"
                                value={signatureForm.petitionId}
                                onChange={(e) => setSignatureForm({ ...signatureForm, petitionId: e.target.value })}
                            >
                                <option value="">-- Select Petition --</option>
                                {petitions.map(p => (
                                    <option key={p._id} value={p._id} className="text-gray-800">
                                        {p.title} ({(p.numberOfSignatures || 0).toLocaleString()} signatures)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Number of Signatures to Add</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="500"
                                    placeholder="Enter count (e.g. 50)"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                                    value={signatureForm.count}
                                    onChange={(e) => setSignatureForm({ ...signatureForm, count: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">Use Same Mobile (For Bypass Signers)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter mobile number"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                                    value={signatureForm.useSameMobile}
                                    onChange={(e) => setSignatureForm({ ...signatureForm, useSameMobile: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                            <i className="fas fa-info-circle text-amber-500 text-lg mt-0.5"></i>
                            <div className="text-sm text-amber-900 space-y-1">
                                <p className="font-bold">How Bulk Signing Works:</p>
                                <p className="font-medium text-amber-800">
                                    This tool dynamically generates realistic Indian names, creates pre-verified supporting accounts with the duplicate mobile number you set, and inserts active signature logs. The total count on the frontend will update instantly.
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-2xl shadow-xl shadow-amber-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <>
                                    <i className="fas fa-magic"></i>
                                    Inject Dummy Signatures
                                </>
                            )}
                        </button>
                    </form>
                )}

                {activeTab === "resetKyc" && (
                    <div className="space-y-6 max-w-2xl">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Reset User Verification / KYC (Testing Tool)</h2>
                            <p className="text-gray-500 text-sm mt-1">Select a user and choose which verification to reset individually, or reset all at once.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Target User</label>
                            <select
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none bg-white font-medium text-gray-800"
                                value={resetKycForm.userId}
                                onChange={(e) => setResetKycForm({ userId: e.target.value })}
                            >
                                <option value="">-- Select User --</option>
                                {users.map(u => (
                                    <option key={u._id} value={u._id} className="text-gray-800 font-medium">
                                        {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                            <i className="fas fa-exclamation-triangle text-amber-600 text-lg mt-0.5 animate-pulse"></i>
                            <div className="text-sm text-amber-900 space-y-1">
                                <p className="font-bold">Important Notice:</p>
                                <p className="font-medium text-amber-800">
                                    Performing any reset operation will set the selected KYC status back to <strong>&ldquo;not_verified&rdquo;</strong> for the selected user account. All linked documents, address data, and dates for that verification type will be removed from their profile.
                                </p>
                            </div>
                        </div>

                        {/* Individual Reset Buttons */}
                        <div className="space-y-3">
                            <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Reset Individual Verification</p>

                            {/* Aadhaar Reset */}
                            <button
                                type="button"
                                disabled={loading || !resetKycForm.userId}
                                onClick={() => handleResetKyc("aadhaar")}
                                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-blue-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    <>
                                        <i className="fas fa-id-card"></i>
                                        Reset Aadhaar Verification
                                    </>
                                )}
                            </button>

                            {/* PAN Reset */}
                            <button
                                type="button"
                                disabled={loading || !resetKycForm.userId}
                                onClick={() => handleResetKyc("pan")}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    <>
                                        <i className="fas fa-credit-card"></i>
                                        Reset PAN Verification
                                    </>
                                )}
                            </button>

                            {/* Voter ID Reset */}
                            <button
                                type="button"
                                disabled={loading || !resetKycForm.userId}
                                onClick={() => handleResetKyc("voter")}
                                className="w-full py-4 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-black rounded-2xl shadow-xl shadow-purple-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    <>
                                        <i className="fas fa-address-card"></i>
                                        Reset Voter ID Verification
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4">
                            <hr className="flex-1 border-gray-200" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">or</span>
                            <hr className="flex-1 border-gray-200" />
                        </div>

                        {/* Reset All */}
                        <button
                            type="button"
                            disabled={loading || !resetKycForm.userId}
                            onClick={() => handleResetKyc(null)}
                            className="w-full py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black rounded-2xl shadow-xl shadow-rose-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <>
                                    <i className="fas fa-trash-alt"></i>
                                    Reset All Verifications
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
