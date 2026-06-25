"use client";

import { useState, useEffect, useMemo } from "react";

export default function PlanManagement() {
    const [activeTab, setActiveTab] = useState("users"); // "users" or "plans"
    
    // Users state
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

    // Plans state
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [error, setError] = useState(null);

    // User editing modal state
    const [editingUser, setEditingUser] = useState(null);
    const [planInput, setPlanInput] = useState("free");
    const [freeChecksInput, setFreeChecksInput] = useState(4);
    const [pointsInput, setPointsInput] = useState(0);
    const [savingUser, setSavingUser] = useState(false);

    // Plan config modal state
    const [editingPlan, setEditingPlan] = useState(null); // Plan object to edit, or null
    const [isAddingPlan, setIsAddingPlan] = useState(false);
    const [savingPlan, setSavingPlan] = useState(false);

    // Plan form fields
    const [formKey, setFormKey] = useState("");
    const [formName, setFormName] = useState("");
    const [formPrice, setFormPrice] = useState(0);
    const [formPoints, setFormPoints] = useState(0);
    const [formBestFor, setFormBestFor] = useState("");
    const [formIsActive, setFormIsActive] = useState(true);
    // Deductions form fields
    const [formAadhaar, setFormAadhaar] = useState(0);
    const [formPan, setFormPan] = useState(0);
    const [formVoter, setFormVoter] = useState(0);
    const [formAadhaarPan, setFormAadhaarPan] = useState(0);
    const [formAadhaarVoter, setFormAadhaarVoter] = useState(0);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await fetch(`${apiUrl}/api/admin/customers`, {
                credentials: "include",
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                console.error("Users data is not an array:", data);
                setUsers([]);
            }
        } catch (err) {
            console.error("Failed to fetch user list:", err);
            setError("Failed to load user plan data.");
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchPlans = async () => {
        try {
            setLoadingPlans(true);
            const response = await fetch(`${apiUrl}/api/admin/plans`, {
                credentials: "include",
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setPlans(data);
            } else {
                console.error("Plans data is not an array:", data);
                setPlans([]);
            }
        } catch (err) {
            console.error("Failed to fetch plans list:", err);
            setError("Failed to load plans config.");
        } finally {
            setLoadingPlans(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchPlans();
    }, [apiUrl]);

    const handleOpenEditUserModal = (user) => {
        setEditingUser(user);
        setPlanInput(user.plan || "free");
        setFreeChecksInput(user.freeChecksRemaining ?? 4);
        setPointsInput(user.points ?? 0);
    };

    const handleSaveUserPlan = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        setSavingUser(true);
        try {
            const response = await fetch(`${apiUrl}/api/admin/customers/${editingUser._id}/plan`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    plan: planInput,
                    freeChecksRemaining: parseInt(freeChecksInput),
                    points: parseFloat(pointsInput),
                }),
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                setUsers(
                    users.map((u) =>
                        u._id === editingUser._id
                            ? {
                                  ...u,
                                  plan: planInput,
                                  freeChecksRemaining: parseInt(freeChecksInput),
                                  points: parseFloat(pointsInput),
                              }
                            : u
                    )
                );
                alert(data.message || "User plan and wallet points adjusted successfully!");
                setEditingUser(null);
            } else {
                alert(data.message || "Failed to update user plan.");
            }
        } catch (err) {
            console.error("Failed to save plan changes:", err);
            alert("An error occurred while updating the user plan.");
        } finally {
            setSavingUser(false);
        }
    };

    // Plan Config Modal actions
    const handleOpenAddPlanModal = () => {
        setIsAddingPlan(true);
        setEditingPlan(null);
        
        setFormKey("");
        setFormName("");
        setFormPrice(0);
        setFormPoints(0);
        setFormBestFor("");
        setFormIsActive(true);
        setFormAadhaar(8);
        setFormPan(5);
        setFormVoter(5);
        setFormAadhaarPan(10);
        setFormAadhaarVoter(10);
    };

    const handleOpenEditPlanModal = (plan) => {
        setIsAddingPlan(false);
        setEditingPlan(plan);
        
        setFormKey(plan.key);
        setFormName(plan.name);
        setFormPrice(plan.price);
        setFormPoints(plan.points);
        setFormBestFor(plan.bestFor || "");
        setFormIsActive(plan.isActive ?? true);
        setFormAadhaar(plan.deductions?.aadhaar ?? 0);
        setFormPan(plan.deductions?.pan ?? 0);
        setFormVoter(plan.deductions?.voter ?? 0);
        setFormAadhaarPan(plan.deductions?.aadhaar_pan ?? 0);
        setFormAadhaarVoter(plan.deductions?.aadhaar_voter ?? 0);
    };

    const handleSavePlanConfig = async (e) => {
        e.preventDefault();
        setSavingPlan(true);

        const planPayload = {
            name: formName,
            price: parseFloat(formPrice),
            points: parseFloat(formPoints),
            bestFor: formBestFor,
            isActive: formIsActive,
            deductions: {
                aadhaar: parseFloat(formAadhaar),
                pan: parseFloat(formPan),
                voter: parseFloat(formVoter),
                aadhaar_pan: parseFloat(formAadhaarPan),
                aadhaar_voter: parseFloat(formAadhaarVoter),
            }
        };

        if (isAddingPlan) {
            planPayload.key = formKey.toLowerCase().trim();
        }

        try {
            const url = isAddingPlan 
                ? `${apiUrl}/api/admin/plans` 
                : `${apiUrl}/api/admin/plans/${editingPlan._id}`;
            const method = isAddingPlan ? "POST" : "PUT";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(planPayload),
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || "Plan configuration saved successfully!");
                setIsAddingPlan(false);
                setEditingPlan(null);
                fetchPlans(); // Reload list
            } else {
                alert(data.message || "Failed to save plan package.");
            }
        } catch (err) {
            console.error("Error saving plan:", err);
            alert("An error occurred while saving the plan configuration.");
        } finally {
            setSavingPlan(false);
        }
    };

    const handleDeletePlan = async (plan) => {
        if (plan.key === "free") {
            alert("Default free tier cannot be deleted.");
            return;
        }

        if (!confirm(`Are you sure you want to permanently delete '${plan.name}'?`)) {
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/admin/plans/${plan._id}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message || "Plan deleted successfully.");
                fetchPlans();
            } else {
                alert(data.message || "Failed to delete plan.");
            }
        } catch (err) {
            console.error("Error deleting plan:", err);
            alert("An error occurred while deleting the plan.");
        }
    };

    // Sorting logic for users
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredUsers = useMemo(() => {
        let result = [...users];

        if (searchTerm.trim() !== "") {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (u) =>
                    u.name?.toLowerCase().includes(term) ||
                    u.email?.toLowerCase().includes(term) ||
                    u.mobileNumber?.includes(term)
            );
        }

        result.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === "createdAt") {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            }

            if (valA < valB) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });

        return result;
    }, [users, searchTerm, sortConfig]);

    if (error) {
        return (
            <div className="p-6 text-center text-red-500 font-bold">
                <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
                <p>{error}</p>
                <button onClick={() => { setError(null); fetchUsers(); fetchPlans(); }} className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-money-check-alt text-[#F43676]"></i>
                        Pricing Plans & Credit Control
                    </h1>
                    <p className="text-sm text-gray-500">Configure user tiers, recharge point ratios, and point deduction rate tables dynamically</p>
                </div>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-gray-200 mb-6 font-semibold text-sm">
                <button
                    onClick={() => setActiveTab("users")}
                    className={`pb-3 px-6 text-sm transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === "users"
                            ? "border-[#F43676] text-[#F43676] font-bold"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <i className="fas fa-users-cog"></i>
                    User Plan Allocation
                </button>
                <button
                    onClick={() => setActiveTab("plans")}
                    className={`pb-3 px-6 text-sm transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === "plans"
                            ? "border-[#F43676] text-[#F43676] font-bold"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <i className="fas fa-sliders-h"></i>
                    Configure Plan Packages
                </button>
            </div>

            {/* Tab 1: Users table */}
            {activeTab === "users" && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-gray-400 font-bold">Total users: {sortedAndFilteredUsers.length}</span>
                        {/* Search box */}
                        <div className="relative w-full md:w-72">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                <i className="fas fa-search"></i>
                            </span>
                            <input
                                type="text"
                                placeholder="Search user..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all"
                            />
                        </div>
                    </div>

                    {loadingUsers ? (
                        <div className="py-12 text-center text-gray-400">
                            <i className="fas fa-spinner fa-spin mr-1"></i> Loading users...
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/40 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-500 font-semibold">
                                    <thead className="text-[10px] text-gray-700 uppercase bg-gray-50 tracking-wider font-bold">
                                        <tr>
                                            <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort("name")}>
                                                User Details <i className={`fas fa-sort text-[8px] ml-1 text-gray-400`}></i>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort("plan")}>
                                                Plan Tier <i className={`fas fa-sort text-[8px] ml-1 text-gray-400`}></i>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort("freeChecksRemaining")}>
                                                Free Checks Left <i className={`fas fa-sort text-[8px] ml-1 text-gray-400`}></i>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort("points")}>
                                                Wallet Balance <i className={`fas fa-sort text-[8px] ml-1 text-gray-400`}></i>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort("createdAt")}>
                                                Registered On <i className={`fas fa-sort text-[8px] ml-1 text-gray-400`}></i>
                                            </th>
                                            <th className="px-6 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-medium">
                                        {sortedAndFilteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-12 text-gray-400 italic">
                                                    No users found matching your search.
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedAndFilteredUsers.map((user) => (
                                                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="text-gray-900 font-bold">{user.name || "N/A"}</div>
                                                        <div className="text-xs text-gray-400 font-normal">{user.email}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{user.mobileNumber || "No mobile"}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                            user.plan === "bronze" ? "bg-amber-100 text-amber-800" :
                                                            user.plan === "silver" ? "bg-slate-100 text-slate-800" :
                                                            user.plan === "gold" ? "bg-yellow-100 text-yellow-800" :
                                                            user.plan === "platinum" ? "bg-purple-100 text-purple-800" :
                                                            "bg-gray-100 text-gray-600"
                                                        }`}>
                                                            {user.plan || "free"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700">
                                                        {user.freeChecksRemaining ?? 4}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-gray-900 font-bold">{(user.points ?? 0).toFixed(1)}</span>
                                                        <span className="text-gray-400 text-xs font-normal ml-1">Pts</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-400 font-normal">
                                                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleOpenEditUserModal(user)}
                                                            className="bg-pink-50 text-[#F43676] hover:bg-pink-100 font-bold px-4 py-1.5 rounded-xl text-xs transition-colors flex items-center gap-1 mx-auto"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                            Adjust
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Pricing configuration */}
            {activeTab === "plans" && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xs text-gray-400 font-bold">Total pricing tiers: {plans.length}</span>
                        <button
                            onClick={handleOpenAddPlanModal}
                            className="bg-[#F43676] text-white hover:bg-pink-600 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1 shadow-md shadow-pink-200"
                        >
                            <i className="fas fa-plus"></i> Add New Plan Tier
                        </button>
                    </div>

                    {loadingPlans ? (
                        <div className="py-12 text-center text-gray-400">
                            <i className="fas fa-spinner fa-spin mr-1"></i> Loading plans...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plans.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-gray-400 italic">
                                    No pricing plans defined. Click 'Add New Plan Tier' to create one.
                                </div>
                            ) : (
                                plans.map((plan) => (
                                    <div key={plan._id} className={`bg-white rounded-3xl p-6 border shadow-md flex flex-col justify-between transition-all ${
                                        plan.isActive ? "border-gray-100" : "border-gray-200 bg-gray-50/50 opacity-75"
                                    }`}>
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5">
                                                        {plan.name}
                                                        {!plan.isActive && (
                                                            <span className="text-[9px] bg-gray-200 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <span className="text-[10px] font-mono text-gray-400">Key: {plan.key}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-extrabold text-gray-900">₹{plan.price.toLocaleString()}</span>
                                                    <p className="text-[10px] text-[#F43676] font-bold">{plan.points.toLocaleString()} Points</p>
                                                </div>
                                            </div>

                                            <p className="text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100 italic">{plan.bestFor || "No description set"}</p>

                                            {/* Deductions rate display */}
                                            <div className="space-y-2 mb-6">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Point Deduction Rates</span>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="bg-gray-50 p-2 rounded-xl flex justify-between">
                                                        <span className="text-gray-500">Aadhaar</span>
                                                        <span className="font-bold text-gray-800">{plan.deductions?.aadhaar ?? 0} pts</span>
                                                    </div>
                                                    <div className="bg-gray-50 p-2 rounded-xl flex justify-between">
                                                        <span className="text-gray-500">PAN Card</span>
                                                        <span className="font-bold text-gray-800">{plan.deductions?.pan ?? 0} pts</span>
                                                    </div>
                                                    <div className="bg-gray-50 p-2 rounded-xl flex justify-between">
                                                        <span className="text-gray-500">Voter ID</span>
                                                        <span className="font-bold text-gray-800">{plan.deductions?.voter ?? 0} pts</span>
                                                    </div>
                                                    <div className="bg-gray-50 p-2 rounded-xl col-span-2 flex justify-between">
                                                        <span className="text-gray-500">Aadhaar + PAN (Combined)</span>
                                                        <span className="font-bold text-gray-800">{plan.deductions?.aadhaar_pan ?? 0} pts</span>
                                                    </div>
                                                    <div className="bg-gray-50 p-2 rounded-xl col-span-2 flex justify-between">
                                                        <span className="text-gray-500">Aadhaar + Voter (Combined)</span>
                                                        <span className="font-bold text-gray-800">{plan.deductions?.aadhaar_voter ?? 0} pts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                                            <button
                                                onClick={() => handleOpenEditPlanModal(plan)}
                                                className="flex-1 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                                            >
                                                <i className="fas fa-edit"></i> Edit Config
                                            </button>
                                            {plan.key !== "free" && (
                                                <button
                                                    onClick={() => handleDeletePlan(plan)}
                                                    className="bg-red-50 text-red-600 hover:bg-red-100 font-bold p-2 rounded-xl text-xs transition-colors flex items-center justify-center animate-all"
                                                    title="Delete Plan"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Adjust User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <i className="fas fa-user-edit text-[#F43676]"></i>
                                Adjust Plan: {editingUser.name}
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times text-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveUserPlan} className="space-y-4 font-semibold text-sm">
                            {/* Plan dropdown populated from database plans */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Plan Tier
                                </label>
                                <select
                                    value={planInput}
                                    onChange={(e) => {
                                        const newPlan = e.target.value;
                                        setPlanInput(newPlan);
                                        if (newPlan === "free") {
                                            setPointsInput(0);
                                        } else {
                                            const matchedPlan = plans.find(p => p.key === newPlan);
                                            if (matchedPlan) {
                                                setPointsInput(matchedPlan.points ?? 0);
                                            }
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all bg-white font-medium"
                                >
                                    <option value="free">Free</option>
                                    {plans.filter(p => p.key !== "free").map((p) => (
                                        <option key={p.key} value={p.key}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Free checks input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Free Checks Remaining
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={freeChecksInput}
                                    onChange={(e) => setFreeChecksInput(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium"
                                    required
                                />
                            </div>

                            {/* Wallet points input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Wallet Balance (Points)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={pointsInput}
                                    onChange={(e) => setPointsInput(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingUser}
                                    className="flex-1 py-2.5 bg-[#F43676] hover:bg-pink-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                                >
                                    {savingUser ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-1"></i> Saving...
                                        </>
                                    ) : (
                                        "Save Adjustments"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Plan Configuration Modal (Create/Edit) */}
            {(editingPlan || isAddingPlan) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <i className="fas fa-sliders-h text-[#F43676]"></i>
                                {isAddingPlan ? "Add Pricing Plan Tier" : `Edit Plan: ${editingPlan.name}`}
                            </h3>
                            <button onClick={() => { setIsAddingPlan(false); setEditingPlan(null); }} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times text-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSavePlanConfig} className="space-y-4 font-semibold text-sm">
                            {/* Basic Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Plan Unique Key
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. gold"
                                        value={formKey}
                                        onChange={(e) => setFormKey(e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium disabled:bg-gray-100 disabled:text-gray-400"
                                        required
                                        disabled={!isAddingPlan}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Gold Plan"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Package Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formPrice}
                                        onChange={(e) => setFormPrice(e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Points Credited
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formPoints}
                                        onChange={(e) => setFormPoints(e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Best For (Subtitle Description)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Growing Businesses"
                                    value={formBestFor}
                                    onChange={(e) => setFormBestFor(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium"
                                />
                            </div>

                            {/* Point Deductions Config */}
                            <div className="pt-2 border-t border-gray-100">
                                <span className="block text-xs font-bold text-[#F43676] uppercase tracking-wider mb-3">
                                    Point Deductions Setup (1 point = ₹5)
                                </span>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                            Aadhaar Verification
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={formAadhaar}
                                            onChange={(e) => setFormAadhaar(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                            PAN Card Verification
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={formPan}
                                            onChange={(e) => setFormPan(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                            Voter ID Verification
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={formVoter}
                                            onChange={(e) => setFormVoter(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2 grid grid-cols-2 gap-4 bg-pink-50/20 p-3 rounded-2xl border border-pink-100/50">
                                        <div className="col-span-2 text-[10px] text-pink-600 font-bold uppercase tracking-wider">
                                            Combined verification rates
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                                Aadhaar + PAN
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={formAadhaarPan}
                                                onChange={(e) => setFormAadhaarPan(e.target.value)}
                                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium bg-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                                Aadhaar + Voter
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={formAadhaarVoter}
                                                onChange={(e) => setFormAadhaarVoter(e.target.value)}
                                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#F43676] focus:outline-none text-sm transition-all font-medium bg-white"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Active checkbox */}
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="planActive"
                                    checked={formIsActive}
                                    onChange={(e) => setFormIsActive(e.target.checked)}
                                    className="w-4 h-4 rounded text-[#F43676] focus:ring-[#F43676] border-gray-300"
                                />
                                <label htmlFor="planActive" className="text-xs text-gray-600 font-bold">
                                    Display Plan as Active for Users
                                </label>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => { setIsAddingPlan(false); setEditingPlan(null); }}
                                    className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPlan}
                                    className="flex-1 py-2.5 bg-[#F43676] hover:bg-pink-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                                >
                                    {savingPlan ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-1"></i> Saving...
                                        </>
                                    ) : (
                                        "Save Plan Config"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
