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

    // Auto-Sign Schedule Form State
    const [autoSignForm, setAutoSignForm] = useState({
        petitionId: "",
        totalSignaturesTarget: 50,
        batchSize: 5,
        intervalPreset: "300", // in seconds: "30", "60", "300", "900", "1800", "3600", "custom"
        customIntervalValue: 5,
        customIntervalUnit: "minutes", // "seconds" | "minutes" | "hours"
        useSameMobile: "9999990000",
        randomJitter: true,
        startImmediately: true,
    });
    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [expandedLogsId, setExpandedLogsId] = useState(null);
    const [bulkPetitionSearch, setBulkPetitionSearch] = useState("");
    const [autoSignPetitionSearch, setAutoSignPetitionSearch] = useState("");

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

            // Fetch all petitions for signature list (bypass pagination)
            const petitionRes = await fetch(`${apiUrl}/api/admin/petitions?all=true`, {
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

    const fetchSchedules = async () => {
        try {
            setLoadingSchedules(true);
            const res = await fetch(`${apiUrl}/api/admin/auto-sign/schedules`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.schedules)) {
                setSchedules(data.schedules);
            }
        } catch (err) {
            console.error("Failed to load auto-sign schedules", err);
        } finally {
            setLoadingSchedules(false);
        }
    };

    useEffect(() => {
        fetchUsersAndPetitions();
        fetchSchedules();
    }, [apiUrl]);

    // Live polling for auto-sign schedule progress
    useEffect(() => {
        let interval;
        const hasRunning = schedules.some((s) => s.status === "running");
        if (activeTab === "scheduledSign" || hasRunning) {
            interval = setInterval(() => {
                fetchSchedules();
            }, 4000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTab, apiUrl, schedules.length]);

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
            email: `${cleanName}${uniqueNumber}@${randomDomain}`,
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
                body: JSON.stringify({
                    ...signatureForm,
                    count: parseInt(signatureForm.count, 10) || 50,
                }),
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: data.message });
                setSignatureForm({
                    petitionId: "",
                    count: "",
                    useSameMobile: "9999990000",
                });
                setBulkPetitionSearch("");
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

    // Helper to get active interval in seconds from state
    const getActiveIntervalSeconds = () => {
        if (autoSignForm.intervalPreset === "custom") {
            const val = parseFloat(autoSignForm.customIntervalValue) || 5;
            if (autoSignForm.customIntervalUnit === "seconds") return Math.max(5, Math.round(val));
            if (autoSignForm.customIntervalUnit === "hours") return Math.round(val * 3600);
            return Math.round(val * 60);
        }
        return parseInt(autoSignForm.intervalPreset, 10) || 300;
    };

    const formatIntervalText = (sec) => {
        if (!sec) return "0s";
        if (sec < 60) return `${sec} seconds`;
        if (sec < 3600) {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return s ? `${m}m ${s}s` : `${m} minute${m > 1 ? "s" : ""}`;
        }
        const h = (sec / 3600).toFixed(1);
        return `${h.replace(/\.0$/, "")} hour${parseFloat(h) > 1 ? "s" : ""}`;
    };

    const formatEstimatedDuration = (total, batch, intervalSec) => {
        if (!total || !batch || !intervalSec) return "0s";
        const batches = Math.ceil(total / batch);
        const totalSec = batches * intervalSec;
        return formatIntervalText(totalSec);
    };

    const handleCreateAutoSignSchedule = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const intervalSec = getActiveIntervalSeconds();
            const payload = {
                petitionId: autoSignForm.petitionId,
                totalSignaturesTarget: parseInt(autoSignForm.totalSignaturesTarget, 10),
                batchSize: parseInt(autoSignForm.batchSize, 10),
                intervalSeconds: intervalSec,
                useSameMobile: autoSignForm.useSameMobile || "9999990000",
                randomJitter: autoSignForm.randomJitter,
                startImmediately: autoSignForm.startImmediately,
            };

            const res = await fetch(`${apiUrl}/api/admin/auto-sign/schedules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: data.message || "Auto-sign schedule started successfully!" });
                setAutoSignForm({
                    petitionId: "",
                    totalSignaturesTarget: "",
                    batchSize: "",
                    intervalPreset: "300",
                    customIntervalValue: "",
                    customIntervalUnit: "minutes",
                    useSameMobile: "9999990000",
                    randomJitter: true,
                    startImmediately: true,
                });
                setAutoSignPetitionSearch("");
                fetchSchedules();
                fetchUsersAndPetitions();
            } else {
                setMessage({ type: "error", text: data.message || "Failed to create auto-sign schedule" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Connection error. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handlePauseSchedule = async (id) => {
        setActionLoadingId(id);
        try {
            const res = await fetch(`${apiUrl}/api/admin/auto-sign/schedules/${id}/pause`, {
                method: "PATCH",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: "success", text: "Schedule paused" });
                fetchSchedules();
            } else {
                setMessage({ type: "error", text: data.message || "Failed to pause schedule" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Connection error" });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleResumeSchedule = async (id) => {
        setActionLoadingId(id);
        try {
            const res = await fetch(`${apiUrl}/api/admin/auto-sign/schedules/${id}/resume`, {
                method: "PATCH",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: "success", text: "Schedule resumed! Next batch will inject shortly." });
                fetchSchedules();
            } else {
                setMessage({ type: "error", text: data.message || "Failed to resume schedule" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Connection error" });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleCancelSchedule = async (id) => {
        if (!confirm("Are you sure you want to cancel this auto-sign schedule?")) return;
        setActionLoadingId(id);
        try {
            const res = await fetch(`${apiUrl}/api/admin/auto-sign/schedules/${id}/cancel`, {
                method: "PATCH",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: "success", text: "Schedule cancelled" });
                fetchSchedules();
            } else {
                setMessage({ type: "error", text: data.message || "Failed to cancel schedule" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Connection error" });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDeleteSchedule = async (id) => {
        if (!confirm("Are you sure you want to delete this schedule from history?")) return;
        setActionLoadingId(id);
        try {
            const res = await fetch(`${apiUrl}/api/admin/auto-sign/schedules/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                fetchSchedules();
            } else {
                setMessage({ type: "error", text: data.message || "Failed to delete schedule" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Connection error" });
        } finally {
            setActionLoadingId(null);
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
                setResetKycForm({ userId: "" });
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
            <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl max-w-4xl overflow-x-auto">
                <button
                    onClick={() => { setActiveTab("user"); setMessage({ type: "", text: "" }); }}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === "user" ? "bg-white text-amber-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <i className="fas fa-user-plus"></i>
                    Dummy User
                </button>
                <button
                    onClick={() => { setActiveTab("petition"); setMessage({ type: "", text: "" }); }}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === "petition" ? "bg-white text-amber-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <i className="fas fa-file-alt"></i>
                    Dummy Petition
                </button>
                <button
                    onClick={() => { setActiveTab("signature"); setMessage({ type: "", text: "" }); }}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === "signature" ? "bg-white text-amber-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <i className="fas fa-bolt"></i>
                    Instant Bulk Sign
                </button>
                <button
                    onClick={() => { setActiveTab("scheduledSign"); setMessage({ type: "", text: "" }); fetchSchedules(); }}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap relative ${activeTab === "scheduledSign" ? "bg-white text-amber-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <i className="fas fa-clock text-amber-500"></i>
                    <span>Auto-Sign (Interval)</span>
                    {schedules.some((s) => s.status === "running") && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    )}
                </button>
                <button
                    onClick={() => { setActiveTab("resetKyc"); setMessage({ type: "", text: "" }); }}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === "resetKyc" ? "bg-white text-amber-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
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
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-bold text-gray-700">
                                    Target Petition <span className="text-xs text-gray-400 font-normal">({petitions.length} total)</span>
                                </label>
                                {bulkPetitionSearch && (
                                    <span className="text-xs text-amber-600 font-semibold">
                                        Found {petitions.filter(p => p.title?.toLowerCase().includes(bulkPetitionSearch.toLowerCase())).length}
                                    </span>
                                )}
                            </div>

                            {/* Quick search filter */}
                            <div className="relative">
                                <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                <input
                                    type="text"
                                    placeholder="Type to filter petitions by title..."
                                    value={bulkPetitionSearch}
                                    onChange={(e) => setBulkPetitionSearch(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-amber-500 bg-gray-50/60"
                                />
                                {bulkPetitionSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setBulkPetitionSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>

                            <select
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none bg-white font-medium text-gray-800"
                                value={signatureForm.petitionId}
                                onChange={(e) => setSignatureForm({ ...signatureForm, petitionId: e.target.value })}
                            >
                                <option value="">-- Select Petition ({petitions.filter(p => !bulkPetitionSearch || p.title?.toLowerCase().includes(bulkPetitionSearch.toLowerCase())).length}) --</option>
                                {petitions
                                    .filter(p => !bulkPetitionSearch || p.title?.toLowerCase().includes(bulkPetitionSearch.toLowerCase()))
                                    .map(p => (
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
                                    onChange={(e) => setSignatureForm({ ...signatureForm, count: e.target.value })}
                                />
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {[25, 50, 100, 250, 500].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setSignatureForm({ ...signatureForm, count: num })}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                                parseInt(signatureForm.count) === num
                                                    ? "bg-amber-500 text-white shadow-xs"
                                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-amber-50"
                                            }`}
                                        >
                                            +{num}
                                        </button>
                                    ))}
                                </div>
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

                {activeTab === "scheduledSign" && (
                    <div className="space-y-10 max-w-4xl">
                        {/* Top description */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
                                <i className="fas fa-clock"></i>
                                <span>Automated Interval Engine</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Scheduled Automatic Signature Injector</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Set how many signatures to add and the time interval. The backend will automatically inject signatures at your specified pace even if you close this page.
                            </p>
                        </div>

                        {/* Creation Form */}
                        <form onSubmit={handleCreateAutoSignSchedule} className="space-y-6 bg-amber-50/40 p-6 sm:p-7 rounded-3xl border border-amber-100 shadow-sm">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-amber-200/60 pb-3">
                                <i className="fas fa-plus-circle text-amber-500"></i>
                                <span>Create New Auto-Sign Schedule</span>
                            </h3>

                            {/* Target Petition */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-bold text-gray-700">
                                        Target Petition <span className="text-xs text-gray-400 font-normal">({petitions.length} total)</span>
                                    </label>
                                    {autoSignPetitionSearch && (
                                        <span className="text-xs text-amber-600 font-semibold">
                                            Found {petitions.filter(p => p.title?.toLowerCase().includes(autoSignPetitionSearch.toLowerCase())).length}
                                        </span>
                                    )}
                                </div>

                                {/* Quick search filter */}
                                <div className="relative">
                                    <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                    <input
                                        type="text"
                                        placeholder="Type to filter petitions by title..."
                                        value={autoSignPetitionSearch}
                                        onChange={(e) => setAutoSignPetitionSearch(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-amber-500 bg-white"
                                    />
                                    {autoSignPetitionSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setAutoSignPetitionSearch("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    )}
                                </div>

                                <select
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none bg-white font-medium text-gray-800"
                                    value={autoSignForm.petitionId}
                                    onChange={(e) => setAutoSignForm({ ...autoSignForm, petitionId: e.target.value })}
                                >
                                    <option value="">-- Select Target Petition ({petitions.filter(p => !autoSignPetitionSearch || p.title?.toLowerCase().includes(autoSignPetitionSearch.toLowerCase())).length}) --</option>
                                    {petitions
                                        .filter(p => !autoSignPetitionSearch || p.title?.toLowerCase().includes(autoSignPetitionSearch.toLowerCase()))
                                        .map((p) => (
                                            <option key={p._id} value={p._id} className="text-gray-800">
                                                {p.title} ({(p.numberOfSignatures || 0).toLocaleString()} signatures currently)
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Total Signatures Target & Batch Size */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 flex justify-between items-center">
                                        <span>Total Signatures to Add</span>
                                        <span className="text-xs text-amber-600 font-bold">Target Goal</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="5000"
                                        placeholder="e.g. 50"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-bold text-gray-900"
                                        value={autoSignForm.totalSignaturesTarget}
                                        onChange={(e) => setAutoSignForm({ ...autoSignForm, totalSignaturesTarget: e.target.value })}
                                    />
                                    {/* Quick chips */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {[25, 50, 100, 250, 500].map((count) => (
                                            <button
                                                key={count}
                                                type="button"
                                                onClick={() => setAutoSignForm({ ...autoSignForm, totalSignaturesTarget: count })}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                                    parseInt(autoSignForm.totalSignaturesTarget) === count
                                                        ? "bg-amber-500 text-white shadow-xs"
                                                        : "bg-white border border-gray-200 text-gray-600 hover:bg-amber-50"
                                                }`}
                                            >
                                                +{count}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 flex justify-between items-center">
                                        <span>Signatures per Interval</span>
                                        <span className="text-xs text-gray-500">Batch Size</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="100"
                                        placeholder="e.g. 5"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-bold text-gray-900"
                                        value={autoSignForm.batchSize}
                                        onChange={(e) => setAutoSignForm({ ...autoSignForm, batchSize: e.target.value })}
                                    />
                                    {/* Quick chips */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {[1, 2, 5, 10, 20].map((batch) => (
                                            <button
                                                key={batch}
                                                type="button"
                                                onClick={() => setAutoSignForm({ ...autoSignForm, batchSize: batch })}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                                    parseInt(autoSignForm.batchSize) === batch
                                                        ? "bg-amber-500 text-white shadow-xs"
                                                        : "bg-white border border-gray-200 text-gray-600 hover:bg-amber-50"
                                                }`}
                                            >
                                                {batch} per time
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Time Interval Selection */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-700">
                                    Time Interval (How often to add signatures)
                                </label>
                                
                                {/* Interval Presets */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                                    {[
                                        { id: "30", label: "30 Sec", sub: "Fast Test" },
                                        { id: "60", label: "1 Min", sub: "Quick" },
                                        { id: "300", label: "5 Min", sub: "Natural" },
                                        { id: "900", label: "15 Min", sub: "Steady" },
                                        { id: "1800", label: "30 Min", sub: "Spaced" },
                                        { id: "3600", label: "1 Hour", sub: "Long term" },
                                        { id: "custom", label: "Custom", sub: "Set Time" },
                                    ].map((preset) => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => setAutoSignForm({ ...autoSignForm, intervalPreset: preset.id })}
                                            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                                                autoSignForm.intervalPreset === preset.id
                                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                                                    : "bg-white border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50/50"
                                            }`}
                                        >
                                            <span className="block font-extrabold text-xs sm:text-sm">{preset.label}</span>
                                            <span className={`block text-[10px] mt-0.5 ${autoSignForm.intervalPreset === preset.id ? "text-amber-100" : "text-gray-400"}`}>
                                                {preset.sub}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Interval Inputs */}
                                {autoSignForm.intervalPreset === "custom" && (
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-amber-200 mt-2">
                                        <span className="text-xs font-bold text-gray-600 shrink-0">Every:</span>
                                        <input
                                            type="number"
                                            min="5"
                                            required
                                            value={autoSignForm.customIntervalValue}
                                            onChange={(e) => setAutoSignForm({ ...autoSignForm, customIntervalValue: e.target.value })}
                                            className="w-24 px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl outline-none focus:border-amber-500"
                                        />
                                        <select
                                            value={autoSignForm.customIntervalUnit}
                                            onChange={(e) => setAutoSignForm({ ...autoSignForm, customIntervalUnit: e.target.value })}
                                            className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl outline-none bg-white"
                                        >
                                            <option value="seconds">Seconds (min 5s)</option>
                                            <option value="minutes">Minutes</option>
                                            <option value="hours">Hours</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Pace Calculator Card */}
                            <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                        <i className="fas fa-calculator text-amber-500"></i>
                                        <span>Schedule Pace Calculation</span>
                                    </div>
                                    <p className="text-gray-600">
                                        Adding <strong className="text-amber-700">{autoSignForm.batchSize || "—"} signatures</strong> every{" "}
                                        <strong className="text-amber-700">{formatIntervalText(getActiveIntervalSeconds())}</strong> until reaching{" "}
                                        <strong className="text-amber-700">{autoSignForm.totalSignaturesTarget || "—"} total</strong>.
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                                    <div>
                                        <span className="block text-[10px] uppercase font-bold text-gray-400">Total Batches</span>
                                        <span className="text-sm font-black text-gray-800">
                                            {parseInt(autoSignForm.batchSize) > 0 && parseInt(autoSignForm.totalSignaturesTarget) > 0
                                                ? Math.ceil(parseInt(autoSignForm.totalSignaturesTarget) / parseInt(autoSignForm.batchSize))
                                                : 0}
                                        </span>
                                    </div>
                                    <div className="w-px h-6 bg-amber-200" />
                                    <div>
                                        <span className="block text-[10px] uppercase font-bold text-gray-400">Est. Duration</span>
                                        <span className="text-sm font-black text-amber-700">
                                            {formatEstimatedDuration(
                                                parseInt(autoSignForm.totalSignaturesTarget),
                                                parseInt(autoSignForm.batchSize),
                                                getActiveIntervalSeconds()
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-gray-200 bg-white hover:border-amber-300 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={autoSignForm.randomJitter}
                                        onChange={(e) => setAutoSignForm({ ...autoSignForm, randomJitter: e.target.checked })}
                                        className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                                    />
                                    <span className="text-xs font-semibold text-gray-700">
                                        <strong>Natural Variance:</strong> Slightly vary batch sizes (+/- 1 sign) so traffic looks organic
                                    </span>
                                </label>

                                <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-gray-200 bg-white hover:border-amber-300 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={autoSignForm.startImmediately}
                                        onChange={(e) => setAutoSignForm({ ...autoSignForm, startImmediately: e.target.checked })}
                                        className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                                    />
                                    <span className="text-xs font-semibold text-gray-700">
                                        <strong>Immediate Start:</strong> First batch injects 2 seconds after creation
                                    </span>
                                </label>
                            </div>

                            {/* Duplicate Mobile Number */}
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-600">Mobile Number for Dummy Signers (Shared Bypass Number)</label>
                                <input
                                    type="text"
                                    required
                                    value={autoSignForm.useSameMobile}
                                    onChange={(e) => setAutoSignForm({ ...autoSignForm, useSameMobile: e.target.value })}
                                    className="w-full sm:w-80 px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-amber-500 bg-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-2xl shadow-xl shadow-amber-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                ) : (
                                    <>
                                        <i className="fas fa-play-circle text-lg"></i>
                                        <span>Launch Auto-Sign Schedule</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Active & Past Schedules Monitor */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <i className="fas fa-tasks text-amber-500"></i>
                                        <span>Active & Past Auto-Sign Schedules</span>
                                    </h3>
                                    <p className="text-xs text-gray-500">Live progress monitor &bull; auto-refreshes every 4s</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={fetchSchedules}
                                    disabled={loadingSchedules}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <i className={`fas fa-sync-alt text-[10px] ${loadingSchedules ? "animate-spin" : ""}`}></i>
                                    <span>Refresh</span>
                                </button>
                            </div>

                            {schedules.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 space-y-2">
                                    <i className="fas fa-clock text-3xl text-gray-300"></i>
                                    <p className="text-sm font-bold text-gray-700">No Auto-Sign Schedules Running</p>
                                    <p className="text-xs text-gray-400">Configure and launch your first schedule above.</p>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {schedules.map((schedule) => {
                                        const percent = Math.min(
                                            100,
                                            Math.round((schedule.signaturesAdded / schedule.totalSignaturesTarget) * 100)
                                        );
                                        const isRunning = schedule.status === "running";
                                        const isPaused = schedule.status === "paused";
                                        const isCompleted = schedule.status === "completed";
                                        const isCancelled = schedule.status === "cancelled";
                                        const petitionTitle = schedule.petition?.title || "Target Petition";
                                        const isActionLoading = actionLoadingId === schedule._id;

                                        return (
                                            <div
                                                key={schedule._id}
                                                className={`p-5 rounded-2xl border transition-all space-y-3.5 bg-white ${
                                                    isRunning
                                                        ? "border-emerald-300 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-400/20"
                                                        : isPaused
                                                        ? "border-amber-200 bg-amber-50/10"
                                                        : "border-gray-200 opacity-90"
                                                }`}
                                            >
                                                {/* Header Row */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="space-y-0.5 min-w-0">
                                                        <h4 className="font-bold text-sm sm:text-base text-gray-900 truncate">
                                                            {petitionTitle}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                                                            <span>Current Petition Total: <strong>{(schedule.petition?.numberOfSignatures || 0).toLocaleString()}</strong></span>
                                                            <span>&bull;</span>
                                                            <span>Rate: <strong>{schedule.batchSize} signs every {formatIntervalText(schedule.intervalSeconds)}</strong></span>
                                                        </p>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {isRunning && (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                <span>Running</span>
                                                            </span>
                                                        )}
                                                        {isPaused && (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                                                                <i className="fas fa-pause text-[10px]" />
                                                                <span>Paused</span>
                                                            </span>
                                                        )}
                                                        {isCompleted && (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                                                                <i className="fas fa-check text-[10px]" />
                                                                <span>Completed</span>
                                                            </span>
                                                        )}
                                                        {isCancelled && (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-600 border border-gray-200">
                                                                <i className="fas fa-ban text-[10px]" />
                                                                <span>Cancelled</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className="text-gray-700">
                                                            Progress: {schedule.signaturesAdded} / {schedule.totalSignaturesTarget} signatures added
                                                        </span>
                                                        <span className={isRunning ? "text-emerald-600" : "text-gray-600"}>
                                                            {percent}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                isCompleted
                                                                    ? "bg-blue-500"
                                                                    : isPaused
                                                                    ? "bg-amber-400"
                                                                    : isCancelled
                                                                    ? "bg-gray-400"
                                                                    : "bg-gradient-to-r from-emerald-500 to-teal-500"
                                                            }`}
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Execution Details & Actions */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
                                                    <div className="text-gray-500 flex items-center gap-3 flex-wrap">
                                                        {isRunning && schedule.nextRunAt && (
                                                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                                <i className="fas fa-hourglass-half mr-1 text-[10px]" />
                                                                Next batch: {new Date(schedule.nextRunAt).toLocaleTimeString()}
                                                            </span>
                                                        )}
                                                        {schedule.lastRunAt && (
                                                            <span>Last batch: {new Date(schedule.lastRunAt).toLocaleTimeString()}</span>
                                                        )}
                                                        <span>Created: {new Date(schedule.createdAt).toLocaleDateString()}</span>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {isRunning && (
                                                            <button
                                                                type="button"
                                                                disabled={isActionLoading}
                                                                onClick={() => handlePauseSchedule(schedule._id)}
                                                                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold border border-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
                                                            >
                                                                <i className="fas fa-pause text-[10px]" />
                                                                <span>Pause</span>
                                                            </button>
                                                        )}

                                                        {isPaused && (
                                                            <button
                                                                type="button"
                                                                disabled={isActionLoading}
                                                                onClick={() => handleResumeSchedule(schedule._id)}
                                                                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                                                            >
                                                                <i className="fas fa-play text-[10px]" />
                                                                <span>Resume</span>
                                                            </button>
                                                        )}

                                                        {(isRunning || isPaused) && (
                                                            <button
                                                                type="button"
                                                                disabled={isActionLoading}
                                                                onClick={() => handleCancelSchedule(schedule._id)}
                                                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 flex items-center gap-1 cursor-pointer transition-colors"
                                                            >
                                                                <i className="fas fa-stop text-[10px]" />
                                                                <span>Stop</span>
                                                            </button>
                                                        )}

                                                        {(isCompleted || isCancelled) && (
                                                            <button
                                                                type="button"
                                                                disabled={isActionLoading}
                                                                onClick={() => handleDeleteSchedule(schedule._id)}
                                                                className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                                title="Delete from list"
                                                            >
                                                                <i className="fas fa-trash-alt text-xs" />
                                                            </button>
                                                        )}

                                                        {schedule.logs && schedule.logs.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedLogsId(expandedLogsId === schedule._id ? null : schedule._id)}
                                                                className="px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold border border-gray-200 flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <span>Logs ({schedule.logs.length})</span>
                                                                <i className={`fas fa-chevron-${expandedLogsId === schedule._id ? "up" : "down"} text-[9px]`} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Collapsible Execution Log Table */}
                                                {expandedLogsId === schedule._id && schedule.logs && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2 max-h-48 overflow-y-auto">
                                                        <div className="font-bold text-gray-700 border-b border-gray-200 pb-1 flex justify-between">
                                                            <span>Execution History (Most recent first)</span>
                                                            <span>Total batches: {schedule.logs.length}</span>
                                                        </div>
                                                        <div className="space-y-1 font-mono text-[11px]">
                                                            {schedule.logs.map((log, idx) => (
                                                                <div key={idx} className="flex items-center justify-between text-gray-600 py-0.5 border-b border-gray-100">
                                                                    <span>{new Date(log.timestamp).toLocaleTimeString()}: {log.note || `+${log.addedCount} signatures`}</span>
                                                                    <span className="font-bold text-gray-800">Count: {log.currentTotal}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
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
