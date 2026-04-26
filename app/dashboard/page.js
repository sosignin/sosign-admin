"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
          }/api/admin/stats`,
          {
            credentials: "include", // Include admin cookies
          }
        );
        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("Failed to fetch statistics");
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num) => {
    // Handle undefined, null, or non-numeric values
    if (num === undefined || num === null || typeof num !== "number") {
      return "0";
    }

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // Chart data/options (memoized to avoid re-creation and to respect hook rules)
  const petitionsDoughnutData = useMemo(() => {
    if (!stats) return { labels: [], datasets: [] };
    return {
      labels: ["Active", "Successful"],
      datasets: [
        {
          label: "Petitions",
          data: [
            stats.breakdown?.activePetitions || 0,
            stats.breakdown?.successfulPetitions || 0,
          ],
          backgroundColor: ["#3b82f6", "#22c55e"],
          borderColor: ["#ffffff"],
          borderWidth: 2,
        },
      ],
    };
  }, [stats]);

  const petitionsDoughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      layout: { padding: 0 },
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, padding: 12 } },
        tooltip: { enabled: true },
      },
    }),
    []
  );

  const signaturesDoughnutData = useMemo(() => {
    if (!stats) return { labels: [], datasets: [] };
    return {
      labels: ["Active", "Successful"],
      datasets: [
        {
          label: "Signatures",
          data: [
            stats.breakdown?.activeSignatures || 0,
            stats.breakdown?.successfulSignatures || 0,
          ],
          backgroundColor: ["#60a5fa", "#34d399"],
          borderColor: ["#ffffff"],
          borderWidth: 2,
        },
      ],
    };
  }, [stats]);

  const signaturesDoughnutOptions = petitionsDoughnutOptions;

  const totalsBarData = useMemo(() => {
    if (!stats) return { labels: [], datasets: [] };
    return {
      labels: ["Petitions", "Signatures", "Users", "Victories"],
      datasets: [
        {
          label: "Totals",
          data: [
            stats.totalPetitions || 0,
            stats.totalSignatures || 0,
            stats.totalUsers || 0,
            stats.victories || 0,
          ],
          backgroundColor: ["#3b82f6", "#22c55e", "#a855f7", "#f59e0b"],
          borderWidth: 0,
          borderRadius: 10,
          maxBarThickness: 40,
        },
      ],
    };
  }, [stats]);

  const totalsBarOptions = useMemo(() => {
    const values = totalsBarData?.datasets?.[0]?.data || [0];
    const maxVal = Math.max(...values, 10);
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      layout: { padding: 0 },
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          suggestedMax: Math.ceil(maxVal * 1.2),
          ticks: { precision: 0 },
          grid: { color: "#f1f5f9" },
        },
      },
    };
  }, [totalsBarData]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 font-medium">
            Welcome to your admin dashboard
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-chart-line text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 font-medium">
            Welcome to your admin dashboard
          </p>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <i className="fas fa-exclamation-triangle text-red-500 text-lg"></i>
            <p className="font-semibold">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Add additional check for stats being null or missing required properties
  if (!stats) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 font-medium">
            Welcome to your admin dashboard
          </p>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <i className="fas fa-info-circle text-yellow-500 text-lg"></i>
            <p className="font-semibold">
              No data available. Please refresh the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 font-medium">
          Welcome to your admin dashboard
        </p>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Petitions */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Total Petitions
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {formatNumber(stats?.totalPetitions || 0)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-file-alt text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Total Signatures */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Total Signatures
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {formatNumber(stats?.totalSignatures || 0)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-signature text-green-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Total Users
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {formatNumber(stats?.totalUsers || 0)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-users text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Victories */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Victories
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {formatNumber(stats?.victories || 0)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-trophy text-yellow-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Total Crowdfunding Raised */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-500/10 to-rose-600/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Crowdfunding Raised
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  ₹{formatNumber(stats?.crowdfunding?.totalRaised || 0)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-rose-100 to-rose-200 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-hand-holding-heart text-rose-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Active Campaigns
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {formatNumber(stats?.crowdfunding?.active || 0)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-bullhorn text-amber-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Petition Breakdown */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <i className="fas fa-chart-pie text-blue-600 text-lg"></i>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Petition Breakdown
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200/50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-700 font-medium">
                    Active Petitions
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  {formatNumber(stats?.breakdown?.activePetitions || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200/50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-700 font-medium">
                    Successful Petitions
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  {formatNumber(stats?.breakdown?.successfulPetitions || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Breakdown */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                <i className="fas fa-signature text-green-600 text-lg"></i>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Signature Breakdown
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200/50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-700 font-medium">
                    Active Petition Signatures
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  {formatNumber(stats?.breakdown?.activeSignatures || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200/50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-700 font-medium">
                    Successful Petition Signatures
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  {formatNumber(stats?.breakdown?.successfulSignatures || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Petitions Breakdown Doughnut */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <i className="fas fa-chart-pie text-blue-600 text-lg"></i>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Petitions Status
              </h3>
            </div>
            <div className="h-64">
              <Doughnut
                data={petitionsDoughnutData}
                options={petitionsDoughnutOptions}
              />
            </div>
          </div>
        </div>

        {/* Signatures Breakdown Doughnut */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                <i className="fas fa-chart-pie text-green-600 text-lg"></i>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Signatures Mix
              </h3>
            </div>
            <div className="h-64">
              <Doughnut
                data={signaturesDoughnutData}
                options={signaturesDoughnutOptions}
              />
            </div>
          </div>
        </div>

        {/* Totals Comparison Bar */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-yellow-500/5 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <i className="fas fa-chart-bar text-purple-600 text-lg"></i>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Totals Overview
              </h3>
            </div>
            <div className="h-64">
              <Bar data={totalsBarData} options={totalsBarOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
              <i className="fas fa-chart-line text-orange-600 text-lg"></i>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Recent Activity (Last 30 Days)
            </h3>
          </div>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  {formatNumber(stats?.recentActivity || 0)}
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur"></div>
              </div>
              <p className="text-gray-600 font-medium text-lg">
                New petitions and successful campaigns
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
