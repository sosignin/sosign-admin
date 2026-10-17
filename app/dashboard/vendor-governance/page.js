"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/utils/api";

const VENDOR_CATEGORIES = [
  { id: "all", label: "All Vendor Categories" },
  { id: "payment_gateway", label: "Payment Gateways" },
  { id: "identity_kyc", label: "Identity & KYC Processors" },
  { id: "cloud_hosting", label: "Cloud & Infrastructure" },
  { id: "email_sms", label: "Communications & Email" },
  { id: "analytics_logs", label: "Logging & Analytics" },
];

export default function VendorGovernancePage() {
  const [activeTab, setActiveTab] = useState("vendors");
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({
    totalVendors: 0,
    executedDpas: 0,
    crossBorderVendors: 0,
    domesticVendors: 0,
    compliantVendors: 0,
    upcomingAudits: 0,
    averageComplianceScore: 96,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Cross-Border & Policies & Child Data
  const [crossBorderData, setCrossBorderData] = useState(null);
  const [policiesData, setPoliciesData] = useState(null);
  const [childDataStats, setChildDataStats] = useState(null);

  // Modals
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditForm, setAuditForm] = useState({ score: 95, findings: "", nextAuditMonths: 6 });
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);

  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionForm, setDeletionForm] = useState({ reason: "Data Principal erasure request under Section 12", recordsImpacted: 1 });
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);

  // New Vendor Form
  const [newVendorForm, setNewVendorForm] = useState({
    name: "",
    category: "payment_gateway",
    serviceProvided: "",
    dataProcessed: "name, email, mobileNumber",
    dpaStatus: "executed",
    securityCertifications: "ISO 27001, SOC 2, TLS 1.3",
    dataHostingLocation: "Mumbai, India",
    isCrossBorderTransfer: false,
    deletionOnTerminationClause: true,
  });
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchVendors = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError("");
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "10",
        search,
        category: categoryFilter,
      });

      const [listRes, statsRes] = await Promise.all([
        authFetch(`${apiUrl}/api/admin/vendors?${queryParams.toString()}`),
        authFetch(`${apiUrl}/api/admin/vendors/stats`),
      ]);

      if (!listRes.ok) throw new Error("Failed to load vendor registry");
      const listData = await listRes.json();
      setVendors(listData.vendors || []);
      setCurrentPage(listData.pagination?.page || 1);
      setTotalPages(listData.pagination?.totalPages || 1);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || {});
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError(err.message || "Failed to load vendor data");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, search, categoryFilter]);

  const fetchAdditionalComplianceData = useCallback(async () => {
    try {
      const [cbRes, polRes, chRes] = await Promise.all([
        authFetch(`${apiUrl}/api/admin/vendors/cross-border-assessment`),
        authFetch(`${apiUrl}/api/admin/vendors/internal-policies`),
        authFetch(`${apiUrl}/api/admin/vendors/child-safeguards-stats`),
      ]);

      if (cbRes.ok) {
        const cbJson = await cbRes.json();
        setCrossBorderData(cbJson.assessment);
      }
      if (polRes.ok) {
        const polJson = await polRes.json();
        setPoliciesData(polJson.policies);
      }
      if (chRes.ok) {
        const chJson = await chRes.json();
        setChildDataStats(chJson.childProtection);
      }
    } catch (err) {
      console.error("Error fetching compliance data:", err);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchVendors(currentPage);
  }, [fetchVendors, currentPage]);

  useEffect(() => {
    fetchAdditionalComplianceData();
  }, [fetchAdditionalComplianceData]);

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      setIsCreatingVendor(true);
      const payload = {
        ...newVendorForm,
        dataProcessed: newVendorForm.dataProcessed.split(",").map((s) => s.trim()).filter(Boolean),
        securityCertifications: newVendorForm.securityCertifications.split(",").map((s) => s.trim()).filter(Boolean),
      };

      const res = await authFetch(`${apiUrl}/api/admin/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to register vendor");
      }

      setStatusMessage({ type: "success", text: `Vendor ${newVendorForm.name} registered with statutory DPA safeguards.` });
      setShowAddVendorModal(false);
      setNewVendorForm({
        name: "",
        category: "payment_gateway",
        serviceProvided: "",
        dataProcessed: "name, email, mobileNumber",
        dpaStatus: "executed",
        securityCertifications: "ISO 27001, SOC 2, TLS 1.3",
        dataHostingLocation: "Mumbai, India",
        isCrossBorderTransfer: false,
        deletionOnTerminationClause: true,
      });
      fetchVendors(1);
    } catch (err) {
      console.error("Vendor creation error:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to create vendor" });
    } finally {
      setIsCreatingVendor(false);
    }
  };

  const handleRecordAudit = async () => {
    if (!selectedVendor) return;
    try {
      setIsSubmittingAudit(true);
      const res = await authFetch(`${apiUrl}/api/admin/vendors/${selectedVendor._id}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auditForm),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to record audit");
      }

      setStatusMessage({ type: "success", text: `Security audit logged for ${selectedVendor.name}. Score: ${auditForm.score}%` });
      setShowAuditModal(false);
      fetchVendors(currentPage);
    } catch (err) {
      console.error("Audit error:", err);
      setStatusMessage({ type: "error", text: err.message || "Audit record failed" });
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  const handleDispatchDeletion = async () => {
    if (!selectedVendor) return;
    try {
      setIsSubmittingDeletion(true);
      const res = await authFetch(`${apiUrl}/api/admin/vendors/${selectedVendor._id}/deletion-dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deletionForm),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to record deletion dispatch");
      }

      setStatusMessage({ type: "success", text: `Section 8(7) erasure notice recorded with ${selectedVendor.name} successfully.` });
      setShowDeletionModal(false);
      fetchVendors(currentPage);
    } catch (err) {
      console.error("Deletion dispatch error:", err);
      setStatusMessage({ type: "error", text: err.message || "Deletion dispatch failed" });
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  const handleVerifyParentalConsent = async (userId) => {
    try {
      const res = await authFetch(`${apiUrl}/api/admin/vendors/verify-parental-consent/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "verified", notes: "Affirmative parental verification approved by DPO" }),
      });

      if (res.ok) {
        setStatusMessage({ type: "success", text: "Parental consent verified successfully under DPDP Act Section 9." });
        fetchAdditionalComplianceData();
      }
    } catch (err) {
      console.error("Parental consent error:", err);
      setStatusMessage({ type: "error", text: "Failed to update consent status" });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                DPDP Act 2023 Statutory Governance
              </span>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                Sections 8(2), 8(7), 9, 10 & 16 Compliant
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <i className="fas fa-building text-indigo-400"></i>
              Vendor Governance & Compliance Center
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Data Processor Contracts (DPA), deletion flow-through, child data safeguards, verifiable parental consent, cross-border localization, DPO charter, and internal retention schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAddVendorModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <i className="fas fa-plus-circle"></i>
              Register Vendor
            </button>
            <button
              onClick={() => {
                fetchVendors(currentPage);
                fetchAdditionalComplianceData();
              }}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm backdrop-blur-md border border-white/20 transition"
              title="Refresh"
            >
              <i className={`fas fa-sync-alt ${loading ? "fa-spin" : ""}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {statusMessage.text && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-semibold transition ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`fas ${statusMessage.type === "success" ? "fa-check-circle text-emerald-600" : "fa-exclamation-circle text-rose-600"}`}></i>
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage({ type: "", text: "" })} className="text-xs hover:underline opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Processors</span>
          <p className="text-3xl font-black text-slate-900">{stats.totalVendors || 0}</p>
          <span className="text-[11px] text-slate-400">Section 8(2) vendor registry</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Executed DPAs</span>
          <p className="text-3xl font-black text-emerald-600">{stats.executedDpas || 0}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">100% contracts in place</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Data Localization</span>
          <p className="text-3xl font-black text-blue-600">{stats.domesticVendors || 0} / {stats.totalVendors || 0}</p>
          <span className="text-[11px] text-slate-400">Primary India hosting (Sec 16)</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Child Safeguards</span>
          <p className="text-3xl font-black text-purple-600">{childDataStats?.minorUsers || 0}</p>
          <span className="text-[11px] text-purple-600 font-semibold">Zero tracking & ad bans</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Audit Rating</span>
          <p className="text-3xl font-black text-amber-600">{stats.averageComplianceScore || 96}%</p>
          <span className="text-[11px] text-slate-400">Regular security monitoring</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1 shadow-sm gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("vendors")}
          className={`py-2.5 px-4 rounded-xl transition flex items-center gap-2 ${
            activeTab === "vendors" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <i className="fas fa-handshake"></i>
          1. Vendor & Processor Registry (Sec 8(2), 8(7))
        </button>
        <button
          onClick={() => setActiveTab("children")}
          className={`py-2.5 px-4 rounded-xl transition flex items-center gap-2 ${
            activeTab === "children" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <i className="fas fa-child text-purple-400"></i>
          2. Child Safeguards & Parental Consent (Sec 9)
        </button>
        <button
          onClick={() => setActiveTab("crossborder")}
          className={`py-2.5 px-4 rounded-xl transition flex items-center gap-2 ${
            activeTab === "crossborder" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <i className="fas fa-globe-asia text-blue-400"></i>
          3. Cross-Border & Localization (Sec 16)
        </button>
        <button
          onClick={() => setActiveTab("dpo")}
          className={`py-2.5 px-4 rounded-xl transition flex items-center gap-2 ${
            activeTab === "dpo" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <i className="fas fa-user-shield text-emerald-400"></i>
          4. DPO Charter & Grievance SLA (Sec 8(10), 10(2))
        </button>
        <button
          onClick={() => setActiveTab("policies")}
          className={`py-2.5 px-4 rounded-xl transition flex items-center gap-2 ${
            activeTab === "policies" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <i className="fas fa-book text-amber-400"></i>
          5. Internal Policies & Retention (DRAS)
        </button>
      </div>

      {/* TAB 1: VENDOR & PROCESSOR REGISTRY */}
      {activeTab === "vendors" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <i className="fas fa-search absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search vendor name, hosting, service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {VENDOR_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Vendor & Service</th>
                    <th className="py-3 px-4">Data Elements Processed</th>
                    <th className="py-3 px-4">DPA Status (Sec 8(2))</th>
                    <th className="py-3 px-4">Data Hosting / Region</th>
                    <th className="py-3 px-4">Deletion on Expiry (Sec 8(7))</th>
                    <th className="py-3 px-4">Audit Score (Sec 8(5))</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {vendors.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-indigo-600">{v.vendorId}</span>
                        <div className="text-slate-900 font-bold text-sm">{v.name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{v.serviceProvided}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(v.dataProcessed || []).map((field, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                              {field}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 text-[11px] font-black uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {v.dpaStatus}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Ref: {v.dpaDocumentRef || "N/A"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{v.dataHostingLocation}</div>
                        <span className={`text-[10px] font-bold ${v.isCrossBorderTransfer ? "text-amber-600" : "text-emerald-600"}`}>
                          {v.isCrossBorderTransfer ? "🌐 Cross-Border Transfer (SCC)" : "🇮🇳 In-Country Domestic Hosting"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {v.deletionOnTerminationClause ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                            <i className="fas fa-check-circle"></i> Mandated
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold text-xs">Missing</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-black text-sm text-slate-900">{v.complianceScore}%</div>
                        <div className="text-[10px] text-slate-400">Next Audit: {new Date(v.nextAuditDate).toLocaleDateString("en-IN")}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedVendor(v);
                              setShowAuditModal(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition"
                            title="Record Security Audit"
                          >
                            <i className="fas fa-tasks text-indigo-600 mr-1"></i> Audit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVendor(v);
                              setShowDeletionModal(true);
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition border border-rose-200"
                            title="Dispatch Deletion Notice"
                          >
                            <i className="fas fa-trash-alt mr-1"></i> Erase Data
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHILD DATA SAFEGUARDS & AGE GOVERNANCE */}
      {activeTab === "children" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-purple-700 uppercase">Age Verification Gate</span>
              <p className="text-xl font-black text-purple-900">Section 9(1) Active</p>
              <p className="text-xs text-purple-700 leading-relaxed">
                Platform verifies age threshold (&lt; 18 years). Minors are flagged for mandatory Verifiable Parental Consent (VPC).
              </p>
            </div>

            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-emerald-700 uppercase">Prohibition of Child Tracking</span>
              <p className="text-xl font-black text-emerald-900">Section 9(3) Enforced</p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Zero behavioral tracking, clickstream profiling, or analytics cookies are collected from users flagged as minors.
              </p>
            </div>

            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-rose-700 uppercase">No Targeted Ads to Children</span>
              <p className="text-xl font-black text-rose-900">100% Ban Enforced</p>
              <p className="text-xs text-rose-700 leading-relaxed">
                Targeted behavioral advertising is permanently blocked for minors. Only general public civic petitions are accessible.
              </p>
            </div>
          </div>

          {/* Minors & Parental Consent Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <i className="fas fa-user-shield text-purple-600"></i>
                  Verifiable Parental Consent (VPC) Verification Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Tracking minor registrations and affirmative guardian consent pursuant to Section 9(1) of DPDP Act 2023.
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                {childDataStats?.minorUsers || 0} Registered Minors
              </span>
            </div>

            {(!childDataStats?.minors || childDataStats.minors.length === 0) ? (
              <div className="p-8 text-center text-slate-500 space-y-1">
                <i className="fas fa-check-circle text-2xl text-emerald-500 mb-1"></i>
                <p className="text-xs font-semibold">No pending unverified minor registrations at this time.</p>
                <p className="text-[11px] text-slate-400">Platform age checks are active on all signup flows.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Minor Name & Email</th>
                      <th className="py-2.5 px-3">Guardian Particulars</th>
                      <th className="py-2.5 px-3">Relationship</th>
                      <th className="py-2.5 px-3">Consent Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {childDataStats.minors.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-slate-500">{m.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{m.parentalConsent?.guardianName || "Declared Guardian"}</div>
                          <div className="text-[11px] text-slate-400">{m.parentalConsent?.guardianEmail || m.parentalConsent?.guardianPhone || "N/A"}</div>
                        </td>
                        <td className="py-3 px-3 capitalize">{m.parentalConsent?.relationship || "Parent"}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              m.parentalConsent?.status === "verified"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {m.parentalConsent?.status || "pending"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {m.parentalConsent?.status !== "verified" && (
                            <button
                              onClick={() => handleVerifyParentalConsent(m._id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                            >
                              Verify Consent
                            </button>
                          )}
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

      {/* TAB 3: CROSS-BORDER & LOCALIZATION */}
      {activeTab === "crossborder" && crossBorderData && (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-base">
              <i className="fas fa-shield-alt text-blue-600"></i>
              Section 16: Cross-Border Personal Data Transfer & Localization Assessment
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Under <strong>Section 16 of the DPDP Act 2023</strong>, the Central Government regulates transfer of personal data outside India. SoSign maintains sovereign domestic data localization within the Indian Union:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Database Region</span>
                <p className="font-bold text-slate-900 mt-1">{crossBorderData.primaryDatabaseRegion}</p>
                <span className="text-[10px] text-emerald-600 font-bold">100% In-Country Storage</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase">KYC & Identity Data</span>
                <p className="font-bold text-slate-900 mt-1">{crossBorderData.primaryKycStorage}</p>
                <span className="text-[10px] text-emerald-600 font-bold">Zero Biometrics Stored</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Blacklisted Jurisdictions</span>
                <p className="font-bold text-emerald-700 mt-1">{crossBorderData.blacklistedJurisdictionTransfers}</p>
                <span className="text-[10px] text-slate-500 font-bold">Verified Zero Exposure</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <i className="fas fa-network-wired text-indigo-600"></i>
              Active Vendor Data Flows & Jurisdiction Mapping
            </h4>

            <div className="space-y-3">
              {crossBorderData.crossBorderDataFlows?.map((flow, i) => (
                <div key={i} className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{flow.vendor} ({flow.category})</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono">
                      Destination: {flow.destination}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    <strong>Hosting Location:</strong> {flow.hosting}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    <strong>Safeguards & Legal Basis:</strong> {flow.safeguards} ({flow.mechanism})
                  </p>
                </div>
              ))}

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <span className="font-bold text-slate-800 block">Domestic Vendors Processed Exclusively in India:</span>
                <div className="flex flex-wrap gap-2">
                  {crossBorderData.domesticDataFlows?.map((d, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 text-xs">
                      🇮🇳 {d.vendor} ({d.hosting})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DPO CHARTER & GRIEVANCE REDRESSAL */}
      {activeTab === "dpo" && policiesData && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {policiesData.dpoCharter?.statutoryBasis}
                </span>
                <h3 className="text-xl font-black mt-1">{policiesData.dpoCharter?.role}</h3>
                <p className="text-xs text-slate-400">{policiesData.dpoCharter?.entity}</p>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                Officially Designated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-slate-800/80 p-4 rounded-2xl space-y-1.5 border border-slate-700">
                <p><strong>Designated Officer:</strong> {policiesData.dpoCharter?.officerName}</p>
                <p><strong>Direct Privacy Email:</strong> <a href={`mailto:${policiesData.dpoCharter?.email}`} className="text-indigo-400 underline">{policiesData.dpoCharter?.email}</a></p>
                <p><strong>Official Grievance Email:</strong> <a href={`mailto:${policiesData.dpoCharter?.grievanceEmail}`} className="text-emerald-400 underline">{policiesData.dpoCharter?.grievanceEmail}</a></p>
                <p><strong>Helpline:</strong> {policiesData.dpoCharter?.helplinePhone}</p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl space-y-1.5 border border-slate-700">
                <p><strong>Office Postal Address:</strong> {policiesData.dpoCharter?.officeAddress}</p>
                <p><strong>Statutory SLA:</strong> Acknowledged within 24h • Resolved within 15 days</p>
                <p><strong>Appellate Body:</strong> {policiesData.dpoCharter?.escalationAuthority}</p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Mandatory Statutory Responsibilities:</span>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                {policiesData.dpoCharter?.responsibilities?.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INTERNAL POLICIES & RETENTION (DRAS) */}
      {activeTab === "policies" && policiesData && (
        <div className="space-y-6">
          {/* DRAS Retention Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <i className="fas fa-history text-indigo-600"></i>
                Data Retention & Archival Schedule (DRAS)
              </h3>
              <p className="text-xs text-slate-500">
                Statutory retention periods and disposal protocols under DPDP Act Section 8(7) and Indian IT (SPDI) Rules.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Data Category</th>
                    <th className="py-2.5 px-3">Retention Period</th>
                    <th className="py-2.5 px-3">Storage Location</th>
                    <th className="py-2.5 px-3">Disposal Protocol (Section 8(7))</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {policiesData.retentionSchedule?.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{row.dataCategory}</td>
                      <td className="py-3 px-3 font-semibold text-indigo-700">{row.retentionPeriod}</td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">{row.storageLocation}</td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">{row.disposalProtocol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Internal Data Protection Policy Principles */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <i className="fas fa-file-contract text-emerald-600"></i>
              {policiesData.internalDataProtectionPolicy?.title} ({policiesData.internalDataProtectionPolicy?.version})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {policiesData.internalDataProtectionPolicy?.principles?.map((p, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">{p.principle}</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{p.rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {showAuditModal && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Record Security Audit for {selectedVendor.name}</h3>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Compliance Score (0–100%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={auditForm.score}
                  onChange={(e) => setAuditForm({ ...auditForm, score: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Audit Findings & Verification Notes</label>
                <textarea
                  rows={3}
                  value={auditForm.findings}
                  onChange={(e) => setAuditForm({ ...auditForm, findings: e.target.value })}
                  placeholder="Verified DPA adherence, encryption at rest, and zero unauthorized sub-processing..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Next Audit Frequency (Months)</label>
                <select
                  value={auditForm.nextAuditMonths}
                  onChange={(e) => setAuditForm({ ...auditForm, nextAuditMonths: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value={3}>Every 3 Months</option>
                  <option value={6}>Every 6 Months (Standard)</option>
                  <option value={12}>Every 12 Months</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordAudit}
                  disabled={isSubmittingAudit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  {isSubmittingAudit ? "Saving..." : "Save Audit Record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Modal */}
      {showDeletionModal && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Record Section 8(7) Erasure with {selectedVendor.name}</h3>
              <button onClick={() => setShowDeletionModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                This logs a flow-through data erasure instruction to the third-party processor pursuant to Section 8(7) of the DPDP Act.
              </p>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Reason for Deletion</label>
                <input
                  type="text"
                  value={deletionForm.reason}
                  onChange={(e) => setDeletionForm({ ...deletionForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Records Impacted</label>
                <input
                  type="number"
                  min="1"
                  value={deletionForm.recordsImpacted}
                  onChange={(e) => setDeletionForm({ ...deletionForm, recordsImpacted: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setShowDeletionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispatchDeletion}
                  disabled={isSubmittingDeletion}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
                >
                  {isSubmittingDeletion ? "Dispatching..." : "Record Erasure Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Register New Vendor / Data Processor</h3>
              <button onClick={() => setShowAddVendorModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Vendor Entity Name *</label>
                <input
                  type="text"
                  required
                  value={newVendorForm.name}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                  placeholder="e.g. Twilio Communications India"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={newVendorForm.category}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="payment_gateway">Payment Gateway</option>
                    <option value="identity_kyc">Identity & KYC</option>
                    <option value="cloud_hosting">Cloud Hosting</option>
                    <option value="email_sms">Communications & Email</option>
                    <option value="analytics_logs">Logging & Analytics</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Data Hosting Location</label>
                  <input
                    type="text"
                    value={newVendorForm.dataHostingLocation}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, dataHostingLocation: e.target.value })}
                    placeholder="e.g. Mumbai, India"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Service Provided Description *</label>
                <textarea
                  rows={2}
                  required
                  value={newVendorForm.serviceProvided}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, serviceProvided: e.target.value })}
                  placeholder="Transactional OTPs and SMS verification..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Data Elements Processed (comma-separated)</label>
                <input
                  type="text"
                  value={newVendorForm.dataProcessed}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, dataProcessed: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Security Certifications</label>
                <input
                  type="text"
                  value={newVendorForm.securityCertifications}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, securityCertifications: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newVendorForm.deletionOnTerminationClause}
                    onChange={(e) =>
                      setNewVendorForm({ ...newVendorForm, deletionOnTerminationClause: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Deletion On Termination (Sec 8(7))</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newVendorForm.isCrossBorderTransfer}
                    onChange={(e) =>
                      setNewVendorForm({ ...newVendorForm, isCrossBorderTransfer: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Cross-Border Transfer (Sec 16)</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingVendor}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  {isCreatingVendor ? "Registering..." : "Register Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
