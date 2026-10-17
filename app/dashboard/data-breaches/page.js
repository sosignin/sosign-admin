"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/utils/api";

const DPDP_CATEGORIES = [
  { id: "all", label: "All DPDP Categories" },
  { id: "unauthorised_processing", label: "Unauthorised Processing" },
  { id: "accidental_disclosure", label: "Accidental Disclosure" },
  { id: "unauthorised_acquisition", label: "Unauthorised Acquisition" },
  { id: "unauthorised_sharing", label: "Unauthorised Sharing" },
  { id: "unauthorised_use", label: "Unauthorised Use" },
  { id: "unauthorised_alteration", label: "Unauthorised Alteration" },
  { id: "unauthorised_destruction", label: "Unauthorised Destruction" },
  { id: "loss_of_access", label: "Loss of Access" },
];

export default function DataBreachesPage() {
  const [breaches, setBreaches] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    detected: 0,
    contained: 0,
    notified: 0,
    resolved: 0,
    closed: 0,
    dpbiSubmittedCount: 0,
    totalAffectedCitizens: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showSopModal, setShowSopModal] = useState(false);
  const [sopData, setSopData] = useState(null);
  const [activeBreach, setActiveBreach] = useState(null);
  const [controlRoomTab, setControlRoomTab] = useState("overview");

  // Control Room Action States
  const [isExecutingContainment, setIsExecutingContainment] = useState(false);
  const [containmentOptions, setContainmentOptions] = useState({
    invalidateSessions: true,
    forcePasswordReset: true,
    allUsers: false,
    details: "Proactive session termination and credential rotation under DPDP Act Section 8(5).",
  });

  const [dpbiSubmissionForm, setDpbiSubmissionForm] = useState({
    referenceNumber: "",
    acknowledgedByBoard: false,
    notes: "",
    officerInCharge: "Data Protection & Grievance Redressal Officer (LEO MEO IT Solution Pvt Ltd)",
  });
  const [isSubmittingDpbi, setIsSubmittingDpbi] = useState(false);

  const [citizenNotifyForm, setCitizenNotifyForm] = useState({
    subject: "",
    message: "",
    advice: "",
    sendInApp: true,
    sendEmail: true,
  });
  const [isSendingCitizenNotice, setIsSendingCitizenNotice] = useState(false);

  // Intake Form State
  const [intakeForm, setIntakeForm] = useState({
    title: "",
    severity: "high",
    category: "accidental_disclosure",
    affectedCollections: "User",
    affectedDataFields: "email, name, mobileNumber",
    estimatedAffectedCount: 0,
    description: "",
    rootCause: "Under active investigation",
    confidentialityImpact: "medium",
    integrityImpact: "low",
    availabilityImpact: "low",
    harmMitigationPlan: "Instant token invalidation, forced credential update, endpoint isolation, and statutory communications.",
    remedialAdviceForUsers: "1. Update your password immediately.\n2. Review account activity.\n3. Beware of suspicious inquiries.",
  });
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchBreaches = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError("");
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "10",
        search,
        status: statusFilter,
        severity: severityFilter,
        category: categoryFilter,
      });

      const [listRes, statsRes] = await Promise.all([
        authFetch(`${apiUrl}/api/admin/data-breaches?${queryParams.toString()}`),
        authFetch(`${apiUrl}/api/admin/data-breaches/stats`),
      ]);

      if (!listRes.ok) throw new Error("Failed to load breach incidents");
      const listData = await listRes.json();
      setBreaches(listData.breaches || []);
      setCurrentPage(listData.pagination?.page || 1);
      setTotalPages(listData.pagination?.totalPages || 1);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || {});
      }
    } catch (err) {
      console.error("Error fetching breaches:", err);
      setError(err.message || "Failed to load breach data");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, search, statusFilter, severityFilter, categoryFilter]);

  useEffect(() => {
    fetchBreaches(currentPage);
  }, [fetchBreaches, currentPage]);

  const loadSopPlan = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/admin/data-breaches/sop-plan`);
      if (res.ok) {
        const data = await res.json();
        setSopData(data.sop);
        setShowSopModal(true);
      }
    } catch (err) {
      console.error("Failed to load SOP plan:", err);
    }
  };

  const openControlRoom = async (breach) => {
    try {
      const res = await authFetch(`${apiUrl}/api/admin/data-breaches/${breach._id}`);
      if (res.ok) {
        const data = await res.json();
        const loaded = data.breach;
        setActiveBreach(loaded);
        setControlRoomTab("overview");
        setDpbiSubmissionForm({
          referenceNumber: loaded.dpbiNotification?.referenceNumber || `DPBI-ACK-${Date.now()}`,
          acknowledgedByBoard: loaded.dpbiNotification?.acknowledgedByBoard || false,
          notes: loaded.dpbiNotification?.notes || "",
          officerInCharge: loaded.dpbiNotification?.officerInCharge || "Data Protection & Grievance Redressal Officer",
        });
        setCitizenNotifyForm({
          subject: loaded.usersNotification?.subject || `Urgent Security Advisory Regarding Your SoSign Account [Ref: ${loaded.breachId}]`,
          message: loaded.usersNotification?.message || `We are intimating you in accordance with Section 8(6) of the DPDP Act, 2023. Our team identified and contained an incident involving ${loaded.title}. Immediate containment protocols have been deployed.`,
          advice: loaded.remedialAdviceForUsers || "Please update your password immediately and verify your recent account activity.",
          sendInApp: true,
          sendEmail: true,
        });
      }
    } catch (err) {
      console.error("Error opening control room:", err);
    }
  };

  const handleCreateBreach = async (e) => {
    e.preventDefault();
    if (!intakeForm.title || !intakeForm.description) {
      setStatusMessage({ type: "error", text: "Title and description are required" });
      return;
    }

    try {
      setIsSubmittingIntake(true);
      const payload = {
        ...intakeForm,
        affectedCollections: intakeForm.affectedCollections.split(",").map((s) => s.trim()).filter(Boolean),
        affectedDataFields: intakeForm.affectedDataFields.split(",").map((s) => s.trim()).filter(Boolean),
        estimatedAffectedCount: Number(intakeForm.estimatedAffectedCount) || 0,
        harmAssessment: {
          confidentialityImpact: intakeForm.confidentialityImpact,
          integrityImpact: intakeForm.integrityImpact,
          availabilityImpact: intakeForm.availabilityImpact,
          riskToCitizens: "Risk of unauthorized exposure or spam/phishing attempts.",
        },
      };

      const res = await authFetch(`${apiUrl}/api/admin/data-breaches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to record breach");
      }

      const data = await res.json();
      setStatusMessage({ type: "success", text: `Incident ${data.breach.breachId} logged under DPDP Act framework!` });
      setShowIntakeModal(false);
      setIntakeForm({
        title: "",
        severity: "high",
        category: "accidental_disclosure",
        affectedCollections: "User",
        affectedDataFields: "email, name, mobileNumber",
        estimatedAffectedCount: 0,
        description: "",
        rootCause: "Under active investigation",
        confidentialityImpact: "medium",
        integrityImpact: "low",
        availabilityImpact: "low",
        harmMitigationPlan: "Instant token invalidation, forced credential update, endpoint isolation, and statutory communications.",
        remedialAdviceForUsers: "1. Update your password immediately.\n2. Review account activity.\n3. Beware of suspicious inquiries.",
      });
      fetchBreaches(1);
    } catch (err) {
      console.error("Intake error:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to log incident" });
    } finally {
      setIsSubmittingIntake(false);
    }
  };

  const handleExecuteContainment = async () => {
    if (!activeBreach) return;
    try {
      setIsExecutingContainment(true);
      const res = await authFetch(`${apiUrl}/api/admin/data-breaches/${activeBreach._id}/contain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(containmentOptions),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to execute containment");
      }

      const data = await res.json();
      setStatusMessage({
        type: "success",
        text: `Rapid harm reduction executed! Shielded ${data.affectedCount} Data Principal sessions.`,
      });
      // Refresh active breach details
      openControlRoom(activeBreach);
      fetchBreaches(currentPage);
    } catch (err) {
      console.error("Containment execution error:", err);
      setStatusMessage({ type: "error", text: err.message || "Containment execution failed" });
    } finally {
      setIsExecutingContainment(false);
    }
  };

  const handleRecordDpbiSubmission = async () => {
    if (!activeBreach) return;
    try {
      setIsSubmittingDpbi(true);
      const res = await authFetch(`${apiUrl}/api/admin/data-breaches/${activeBreach._id}/record-dpbi-submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dpbiSubmissionForm),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to record DPBI submission");
      }

      setStatusMessage({
        type: "success",
        text: "Statutory Section 8(6) intimation recorded to the Data Protection Board of India!",
      });
      openControlRoom(activeBreach);
      fetchBreaches(currentPage);
    } catch (err) {
      console.error("DPBI submission error:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to record submission" });
    } finally {
      setIsSubmittingDpbi(false);
    }
  };

  const handleDispatchCitizenNotification = async () => {
    if (!activeBreach) return;
    try {
      setIsSendingCitizenNotice(true);
      const channels = [];
      if (citizenNotifyForm.sendInApp) channels.push("in_app");
      if (citizenNotifyForm.sendEmail) channels.push("email");

      if (channels.length === 0) {
        setStatusMessage({ type: "error", text: "Please select at least one dispatch channel (In-App or Email)" });
        setIsSendingCitizenNotice(false);
        return;
      }

      const res = await authFetch(`${apiUrl}/api/admin/data-breaches/${activeBreach._id}/notify-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels,
          subject: citizenNotifyForm.subject,
          message: citizenNotifyForm.message,
          advice: citizenNotifyForm.advice,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to dispatch citizen notices");
      }

      const data = await res.json();
      setStatusMessage({
        type: "success",
        text: `Statutory notices successfully dispatched to ${data.totalNotified} affected Data Principals!`,
      });
      openControlRoom(activeBreach);
      fetchBreaches(currentPage);
    } catch (err) {
      console.error("Citizen notice dispatch error:", err);
      setStatusMessage({ type: "error", text: err.message || "Notice dispatch failed" });
    } finally {
      setIsSendingCitizenNotice(false);
    }
  };

  const copyToClipboard = (text) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setStatusMessage({ type: "success", text: "Notice copied to clipboard!" });
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "critical":
        return <span className="px-2.5 py-1 text-xs font-black uppercase rounded-full bg-red-100 text-red-800 border border-red-200">Critical</span>;
      case "high":
        return <span className="px-2.5 py-1 text-xs font-black uppercase rounded-full bg-orange-100 text-orange-800 border border-orange-200">High</span>;
      case "medium":
        return <span className="px-2.5 py-1 text-xs font-black uppercase rounded-full bg-amber-100 text-amber-800 border border-amber-200">Medium</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-black uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "detected":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black uppercase rounded-full bg-red-600 text-white animate-pulse">Detected / Active</span>;
      case "contained":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black uppercase rounded-full bg-amber-500 text-white">Contained</span>;
      case "notified":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black uppercase rounded-full bg-blue-600 text-white">Notified</span>;
      case "resolved":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black uppercase rounded-full bg-emerald-600 text-white">Resolved</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black uppercase rounded-full bg-slate-500 text-white">Closed</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-rose-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
                DPDP Act 2023 Sec 2(u) & Sec 8(5)(6)
              </span>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                CERT-In Directions Aligned
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-rose-500"></i>
              Data Breach Response Center
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Automated Personal Data Breach handling, rapid harm reduction protocols, statutory intimations to the Data Protection Board of India (DPBI), and multi-channel citizen notifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowIntakeModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
            >
              <i className="fas fa-plus-circle"></i>
              Log Incident / Intake
            </button>
            <button
              onClick={loadSopPlan}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold backdrop-blur-md border border-white/20 transition flex items-center gap-2"
            >
              <i className="fas fa-clipboard-list text-rose-400"></i>
              Breach Response SOP
            </button>
            <button
              onClick={() => fetchBreaches(currentPage)}
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
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Incidents</span>
          <p className="text-3xl font-black text-slate-900">{stats.total || 0}</p>
          <span className="text-[11px] text-slate-400">All recorded security events</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
            Active / Detected
          </span>
          <p className="text-3xl font-black text-rose-600">{stats.detected || 0}</p>
          <span className="text-[11px] text-rose-400 font-semibold">Immediate harm reduction required</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Contained</span>
          <p className="text-3xl font-black text-amber-600">{stats.contained || 0}</p>
          <span className="text-[11px] text-slate-400">Tokens revoked / Hardened</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">DPBI Intimated</span>
          <p className="text-3xl font-black text-blue-600">{stats.dpbiSubmittedCount || 0}</p>
          <span className="text-[11px] text-slate-400">Section 8(6) statutory filings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Citizens Shielded</span>
          <p className="text-3xl font-black text-emerald-600">{stats.totalAffectedCitizens || 0}</p>
          <span className="text-[11px] text-slate-400">Protected Data Principals</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <i className="fas fa-search absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search breach ref, title, RCA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">All Statuses</option>
            <option value="detected">Detected</option>
            <option value="contained">Contained</option>
            <option value="notified">Notified</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            {DPDP_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Breaches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-spinner fa-spin text-2xl text-rose-500 mb-2"></i>
            <p className="text-sm font-semibold">Loading data breach records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 space-y-2">
            <i className="fas fa-exclamation-circle text-2xl"></i>
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : breaches.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 text-2xl">
              <i className="fas fa-shield-virus"></i>
            </div>
            <h3 className="text-base font-bold text-slate-800">No Data Breach Incidents Recorded</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No security breach incidents match your current filter. Your platform is operating under DPDP Act Section 8(5) safeguards.
            </p>
            <button
              onClick={() => setShowIntakeModal(true)}
              className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Record Incident / Simulation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ref & Title</th>
                  <th className="py-3 px-4">DPDP Sec 2(u) Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detected On</th>
                  <th className="py-3 px-4">Citizens Affected</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {breaches.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-bold text-rose-600">{item.breachId}</div>
                      <div className="text-slate-900 font-bold text-sm max-w-xs truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.description}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200">
                        {item.category?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getSeverityBadge(item.severity)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(item.detectedDate || item.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {item.estimatedAffectedCount || item.affectedUserIds?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openControlRoom(item)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5"
                      >
                        <i className="fas fa-sliders-h text-rose-400"></i>
                        Control Room
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-100"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Room Modal */}
      {activeBreach && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 md:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                    {activeBreach.breachId}
                  </span>
                  {getSeverityBadge(activeBreach.severity)}
                  {getStatusBadge(activeBreach.status)}
                </div>
                <h2 className="text-xl font-black text-white">{activeBreach.title}</h2>
              </div>
              <button
                onClick={() => setActiveBreach(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setControlRoomTab("overview")}
                className={`py-3 px-3 border-b-2 transition flex items-center gap-2 ${
                  controlRoomTab === "overview"
                    ? "border-rose-600 text-rose-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <i className="fas fa-file-alt"></i>
                1. Incident Dossier
              </button>
              <button
                onClick={() => setControlRoomTab("containment")}
                className={`py-3 px-3 border-b-2 transition flex items-center gap-2 ${
                  controlRoomTab === "containment"
                    ? "border-rose-600 text-rose-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <i className="fas fa-bolt text-amber-500"></i>
                2. Rapid Harm Reduction ⚡
              </button>
              <button
                onClick={() => setControlRoomTab("dpbi")}
                className={`py-3 px-3 border-b-2 transition flex items-center gap-2 ${
                  controlRoomTab === "dpbi"
                    ? "border-rose-600 text-rose-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <i className="fas fa-university text-blue-500"></i>
                3. DPBI Statutory Notice (Sec 8(6))
              </button>
              <button
                onClick={() => setControlRoomTab("citizens")}
                className={`py-3 px-3 border-b-2 transition flex items-center gap-2 ${
                  controlRoomTab === "citizens"
                    ? "border-rose-600 text-rose-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <i className="fas fa-bullhorn text-purple-500"></i>
                4. Citizen Notifications 📢
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm flex-1">
              {/* TAB 1: OVERVIEW */}
              {controlRoomTab === "overview" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-400 uppercase">DPDP Category</span>
                      <p className="font-bold text-slate-900 mt-1 capitalize">{activeBreach.category?.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-slate-500 mt-1">Classified per DPDP Act Section 2(u)</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-400 uppercase">Impact Footprint</span>
                      <p className="font-bold text-slate-900 mt-1">{activeBreach.estimatedAffectedCount || 0} Citizens</p>
                      <p className="text-[11px] text-slate-500 mt-1">Affected Collections: {(activeBreach.affectedCollections || []).join(", ")}</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-400 uppercase">Detection Date</span>
                      <p className="font-bold text-slate-900 mt-1">
                        {new Date(activeBreach.detectedDate || activeBreach.createdAt).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">Logged by: {activeBreach.createdBy || "Admin"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Description of Incident</h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                      {activeBreach.description}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Root Cause Analysis (RCA)</h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                      {activeBreach.rootCause || "Forensic analysis is actively ongoing."}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 text-xs text-blue-900">
                    <h5 className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fas fa-shield-alt text-blue-600"></i>
                      Statutory Harm Assessment
                    </h5>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Confidentiality</span>
                        <span className="font-bold uppercase text-blue-700">{activeBreach.harmAssessment?.confidentialityImpact}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Integrity</span>
                        <span className="font-bold uppercase text-blue-700">{activeBreach.harmAssessment?.integrityImpact}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-blue-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Availability</span>
                        <span className="font-bold uppercase text-blue-700">{activeBreach.harmAssessment?.availabilityImpact}</span>
                      </div>
                    </div>
                    <p className="text-[11px] pt-1 text-blue-800">{activeBreach.harmAssessment?.riskToCitizens}</p>
                  </div>
                </div>
              )}

              {/* TAB 2: RAPID HARM REDUCTION */}
              {controlRoomTab === "containment" && (
                <div className="space-y-6">
                  <div className="p-5 bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <i className="fas fa-bolt text-amber-600"></i>
                      Point 4: Act Quickly to Reduce Harm After a Breach (Section 8(5))
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Executing Rapid Harm Containment immediately revokes active authentication JWT sessions, forces affected citizens to re-authenticate, and triggers credential update alerts.
                    </p>

                    <div className="space-y-2 pt-2 text-xs text-slate-800">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={containmentOptions.invalidateSessions}
                          onChange={(e) =>
                            setContainmentOptions({ ...containmentOptions, invalidateSessions: e.target.checked })
                          }
                          className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                        />
                        <span className="font-bold">Terminate & Invalidate Active JWT Sessions</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={containmentOptions.forcePasswordReset}
                          onChange={(e) =>
                            setContainmentOptions({ ...containmentOptions, forcePasswordReset: e.target.checked })
                          }
                          className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                        />
                        <span className="font-bold">Enforce Mandatory Password Reset on Next Login</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={containmentOptions.allUsers}
                          onChange={(e) =>
                            setContainmentOptions({ ...containmentOptions, allUsers: e.target.checked })
                          }
                          className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                        />
                        <span className="font-semibold text-rose-700">Apply to All Platform Citizens (Broad containment sweep)</span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <input
                        type="text"
                        value={containmentOptions.details}
                        onChange={(e) => setContainmentOptions({ ...containmentOptions, details: e.target.value })}
                        placeholder="Containment audit log details..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <button
                      onClick={handleExecuteContainment}
                      disabled={isExecutingContainment}
                      className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
                    >
                      <i className={`fas ${isExecutingContainment ? "fa-spinner fa-spin" : "fa-shield-alt"}`}></i>
                      {isExecutingContainment ? "Executing Rapid Harm Reduction..." : "⚡ Execute Rapid Harm Containment Protocol"}
                    </button>
                  </div>

                  {/* Containment Audit Ledger */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <i className="fas fa-history text-slate-400"></i>
                      Containment Audit Trail Ledger
                    </h4>

                    {(!activeBreach.containmentActions || activeBreach.containmentActions.length === 0) ? (
                      <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl border border-slate-200">
                        No containment actions recorded yet. Click execute above to isolate this vector.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activeBreach.containmentActions.map((act, idx) => (
                          <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span className="flex items-center gap-2">
                                <i className="fas fa-check-circle text-emerald-600"></i>
                                {act.action}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {new Date(act.timestamp).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px]">{act.details}</p>
                            <div className="text-[10px] text-slate-400">
                              Executed by: <strong className="text-slate-600">{act.executedBy}</strong> | Impacted:{" "}
                              <strong className="text-emerald-700">{act.affectedCount || 0} Citizens</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DPBI STATUTORY NOTICE */}
              {controlRoomTab === "dpbi" && (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 uppercase">
                        Statutory Intimation to Data Protection Board of India
                      </h4>
                      <p className="text-[11px] text-blue-700">
                        Section 8(6) mandatory intimation formatted for statutory compliance.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(activeBreach.dpbiNotification?.statutoryNoticeDraft || "")}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <i className="fas fa-copy"></i>
                        Copy Notice
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-72 border border-slate-800">
                      {activeBreach.dpbiNotification?.statutoryNoticeDraft || "Drafting in progress..."}
                    </pre>
                  </div>

                  {/* Submission Tracking Form */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <i className="fas fa-stamp text-blue-600"></i>
                      Record Board Filing & Acknowledgement
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Board Reference / Ack Number</label>
                        <input
                          type="text"
                          value={dpbiSubmissionForm.referenceNumber}
                          onChange={(e) =>
                            setDpbiSubmissionForm({ ...dpbiSubmissionForm, referenceNumber: e.target.value })
                          }
                          placeholder="e.g. DPBI-ACK-2026-0041"
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Officer In Charge</label>
                        <input
                          type="text"
                          value={dpbiSubmissionForm.officerInCharge}
                          onChange={(e) =>
                            setDpbiSubmissionForm({ ...dpbiSubmissionForm, officerInCharge: e.target.value })
                          }
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        id="dpbiAck"
                        checked={dpbiSubmissionForm.acknowledgedByBoard}
                        onChange={(e) =>
                          setDpbiSubmissionForm({ ...dpbiSubmissionForm, acknowledgedByBoard: e.target.checked })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <label htmlFor="dpbiAck" className="font-bold text-slate-700 cursor-pointer">
                        Confirmed written or digital acknowledgment received from Data Protection Board of India
                      </label>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1 text-xs">Notes / Board Directives</label>
                      <textarea
                        rows={2}
                        value={dpbiSubmissionForm.notes}
                        onChange={(e) => setDpbiSubmissionForm({ ...dpbiSubmissionForm, notes: e.target.value })}
                        placeholder="Any additional inquiries or directions given by the Board..."
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <button
                      onClick={handleRecordDpbiSubmission}
                      disabled={isSubmittingDpbi}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                    >
                      <i className={`fas ${isSubmittingDpbi ? "fa-spinner fa-spin" : "fa-save"}`}></i>
                      {isSubmittingDpbi ? "Saving..." : "Save DPBI Submission Record"}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: CITIZEN NOTIFICATIONS */}
              {controlRoomTab === "citizens" && (
                <div className="space-y-5">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                    <h4 className="text-xs font-bold text-purple-900 uppercase">
                      Point 3: Notify Affected Users (Section 8(6) Compliance)
                    </h4>
                    <p className="text-[11px] text-purple-700">
                      Dispatches direct notifications to each affected Data Principal explaining the incident, containment taken, and recommended safety steps.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Notice Subject</label>
                      <input
                        type="text"
                        value={citizenNotifyForm.subject}
                        onChange={(e) => setCitizenNotifyForm({ ...citizenNotifyForm, subject: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Statutory Explanation Message</label>
                      <textarea
                        rows={3}
                        value={citizenNotifyForm.message}
                        onChange={(e) => setCitizenNotifyForm({ ...citizenNotifyForm, message: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Recommended Citizen Actions (Harm Mitigation Advice)</label>
                      <textarea
                        rows={3}
                        value={citizenNotifyForm.advice}
                        onChange={(e) => setCitizenNotifyForm({ ...citizenNotifyForm, advice: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={citizenNotifyForm.sendInApp}
                          onChange={(e) =>
                            setCitizenNotifyForm({ ...citizenNotifyForm, sendInApp: e.target.checked })
                          }
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                        <span>In-App Notifications</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={citizenNotifyForm.sendEmail}
                          onChange={(e) =>
                            setCitizenNotifyForm({ ...citizenNotifyForm, sendEmail: e.target.checked })
                          }
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                        <span>Email Broadcast (via Nodemailer)</span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleDispatchCitizenNotification}
                        disabled={isSendingCitizenNotice}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2"
                      >
                        <i className={`fas ${isSendingCitizenNotice ? "fa-spinner fa-spin" : "fa-paper-plane"}`}></i>
                        {isSendingCitizenNotice
                          ? "Dispatching Citizen Notifications..."
                          : `🚀 Dispatch Statutory Notification to ${activeBreach.estimatedAffectedCount || 0} Affected Data Principals`}
                      </button>
                    </div>

                    {activeBreach.usersNotification?.notifiedAt && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                        <i className="fas fa-check-circle text-emerald-600"></i>
                        <span>
                          Dispatched on {new Date(activeBreach.usersNotification.notifiedAt).toLocaleString("en-IN")} to{" "}
                          <strong>{activeBreach.usersNotification.totalNotified} Data Principals</strong> via{" "}
                          {(activeBreach.usersNotification.channels || []).join(", ")}.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-400">LEO MEO IT Solution Private Limited (SoSign) • Statutory Registry</span>
              <button
                onClick={() => setActiveBreach(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition"
              >
                Close Control Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intake / Report Incident Modal */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="p-5 bg-gradient-to-r from-rose-700 to-red-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Record Personal Data Breach Incident</h3>
                <p className="text-xs text-rose-200">DPDP Act 2023 Section 2(u) Incident Intake</p>
              </div>
              <button onClick={() => setShowIntakeModal(false)} className="text-white hover:text-rose-200">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreateBreach} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Incident Title *</label>
                <input
                  type="text"
                  required
                  value={intakeForm.title}
                  onChange={(e) => setIntakeForm({ ...intakeForm, title: e.target.value })}
                  placeholder="e.g. Unauthorized token exposure on exported petition signatures"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">DPDP Category (Section 2(u))</label>
                  <select
                    value={intakeForm.category}
                    onChange={(e) => setIntakeForm({ ...intakeForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {DPDP_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={intakeForm.severity}
                    onChange={(e) => setIntakeForm({ ...intakeForm, severity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Affected Collections (comma-separated)</label>
                  <input
                    type="text"
                    value={intakeForm.affectedCollections}
                    onChange={(e) => setIntakeForm({ ...intakeForm, affectedCollections: e.target.value })}
                    placeholder="User, Petition"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Affected Citizens</label>
                  <input
                    type="number"
                    min="0"
                    value={intakeForm.estimatedAffectedCount}
                    onChange={(e) => setIntakeForm({ ...intakeForm, estimatedAffectedCount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Affected Data Fields</label>
                <input
                  type="text"
                  value={intakeForm.affectedDataFields}
                  onChange={(e) => setIntakeForm({ ...intakeForm, affectedDataFields: e.target.value })}
                  placeholder="email, name, mobileNumber"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Incident Description *</label>
                <textarea
                  rows={3}
                  required
                  value={intakeForm.description}
                  onChange={(e) => setIntakeForm({ ...intakeForm, description: e.target.value })}
                  placeholder="Detail the circumstances, how it was detected, and potential exposure..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preliminary Root Cause</label>
                <input
                  type="text"
                  value={intakeForm.rootCause}
                  onChange={(e) => setIntakeForm({ ...intakeForm, rootCause: e.target.value })}
                  placeholder="e.g. Unsanitized query parameter in export service"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIntake}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <i className={`fas ${isSubmittingIntake ? "fa-spinner fa-spin" : "fa-save"}`}></i>
                  {isSubmittingIntake ? "Recording..." : "Log Incident in Registry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5-Stage Breach Response SOP Modal */}
      {showSopModal && sopData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <i className="fas fa-clipboard-check text-rose-400"></i>
                  Data Breach Incident Response Plan (SOP)
                </h3>
                <p className="text-xs text-indigo-300">
                  {sopData.framework} • {sopData.dataFiduciary?.legalEntity}
                </p>
              </div>
              <button onClick={() => setShowSopModal(false)} className="text-white hover:text-indigo-200">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 uppercase">Data Fiduciary Particulars</span>
                <p className="text-slate-600">
                  <strong>Entity:</strong> {sopData.dataFiduciary?.legalEntity} | <strong>Platform:</strong> {sopData.dataFiduciary?.platform}
                </p>
                <p className="text-slate-600">
                  <strong>Grievance Redressal:</strong> {sopData.dataFiduciary?.grievanceEmail} | <strong>Tel:</strong> {sopData.dataFiduciary?.helpline}
                </p>
              </div>

              <div className="space-y-3">
                {sopData.stages?.map((stage) => (
                  <div key={stage.stageNumber} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                        <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">
                          {stage.stageNumber}
                        </span>
                        <span>{stage.name}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                        {stage.statutoryBasis}
                      </span>
                    </div>

                    <p className="text-slate-600 font-medium italic text-[11px]">{stage.objective}</p>

                    <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Mandatory Execution Steps:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                        {stage.actions?.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                      <i className="fas fa-clock"></i>
                      <span>SLA: {stage.sla}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowSopModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Close Playbook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
