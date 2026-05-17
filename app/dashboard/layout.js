"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const res = await fetch(`${apiUrl}/api/admin/me`, {
                    credentials: "include",
                });

                if (res.ok) {
                    const data = await res.json();
                    setAdmin(data.admin);
                } else {
                    router.push("/login");
                }
            } catch (err) {
                console.error("Auth check failed:", err);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            await fetch(`${apiUrl}/api/admin/logout`, {
                method: "POST",
                credentials: "include",
            });
            router.push("/login");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    const allNavItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: "fas fa-home",
            color: "from-blue-500 to-blue-600",
            permissionKey: "dashboard",
        },
        {
            name: "Petition Approval",
            href: "/dashboard/petition-approval",
            icon: "fas fa-check-circle",
            color: "from-green-500 to-green-600",
            permissionKey: "petition-approval",
        },
        {
            name: "Comment Approval",
            href: "/dashboard/comment-approval",
            icon: "fas fa-comments",
            color: "from-orange-500 to-orange-600",
            permissionKey: "comment-approval",
        },
        {
            name: "Rejected Petitions",
            href: "/dashboard/rejected-petitions",
            icon: "fas fa-times-circle",
            color: "from-red-500 to-red-600",
            permissionKey: "petitions",
        },
        {
            name: "All Petitions",
            href: "/dashboard/petitions",
            icon: "fas fa-file-alt",
            color: "from-purple-500 to-purple-600",
            permissionKey: "petitions",
        },
        {
            name: "Successful Petitions",
            href: "/dashboard/successfulpetitions",
            icon: "fas fa-trophy",
            color: "from-yellow-500 to-yellow-600",
            permissionKey: "successfulpetitions",
        },
        {
            name: "Progress Updates",
            href: "/dashboard/progress-updates",
            icon: "fas fa-bullhorn",
            color: "from-blue-400 to-indigo-500",
            permissionKey: "petitions",
        },
        {
            name: "Ads Management",
            href: "/dashboard/ads",
            icon: "fas fa-ad",
            color: "from-pink-500 to-pink-600",
            permissionKey: "ads",
        },
        {
            name: "Download Requests",
            href: "/dashboard/download-requests",
            icon: "fas fa-download",
            color: "from-teal-500 to-teal-600",
            permissionKey: "download-requests",
        },
        {
            name: "Hide Requests",
            href: "/dashboard/hide-requests",
            icon: "fas fa-eye-slash",
            color: "from-orange-500 to-amber-600",
            permissionKey: "hide-requests",
        },
        {
            name: "Blog Management",
            href: "/dashboard/blogs",
            icon: "fas fa-blog",
            color: "from-cyan-500 to-cyan-600",
            permissionKey: "blogs",
        },
        {
            name: "Wallet Management",
            href: "/dashboard/wallets",
            icon: "fas fa-wallet",
            color: "from-emerald-500 to-emerald-600",
            permissionKey: "wallets",
        },
        {
            name: "Wallet Requests",
            href: "/dashboard/wallet-requests",
            icon: "fas fa-money-check-alt",
            color: "from-rose-500 to-rose-600",
            permissionKey: "wallet-requests",
        },
        {
            name: "User Management",
            href: "/dashboard/users",
            icon: "fas fa-users",
            color: "from-indigo-500 to-indigo-600",
            permissionKey: "users",
        },
        {
            name: "Verified Users",
            href: "/dashboard/verified-users",
            icon: "fas fa-user-check",
            color: "from-teal-500 to-teal-600",
            permissionKey: "users",
        },
        {
            name: "Rapid Creation",
            href: "/dashboard/rapid-creation",
            icon: "fas fa-bolt",
            color: "from-amber-500 to-orange-600",
            permissionKey: "petitions",
        },
        {
            name: "Category Management",
            href: "/dashboard/categories",
            icon: "fas fa-tags",
            color: "from-fuchsia-500 to-fuchsia-600",
            permissionKey: "categories",
        },
        {
            name: "Crowdfunding Approval",
            href: "/dashboard/crowdfunding",
            icon: "fas fa-hand-holding-heart",
            color: "from-rose-500 to-red-600",
            permissionKey: "crowdfunding",
        },
        {
            name: "Withdrawal Requests",
            href: "/dashboard/withdrawals",
            icon: "fas fa-money-bill-wave",
            color: "from-amber-500 to-orange-600",
            permissionKey: "withdrawals",
        },
    ];

    // Super admin only nav item
    const subAdminNavItem = {
        name: "Sub-Admin Management",
        href: "/dashboard/sub-admins",
        icon: "fas fa-user-shield",
        color: "from-violet-500 to-violet-600",
    };

    // Filter nav items based on role
    const getFilteredNavItems = () => {
        if (!admin) return [];

        if (admin.role === "superadmin") {
            // Super admin sees everything + sub-admin management
            return [...allNavItems, subAdminNavItem];
        }

        // Sub-admin sees only permitted modules
        const permissions = admin.permissions || [];
        // Always show dashboard for sub-admins
        return allNavItems.filter(
            (item) => item.permissionKey === "dashboard" || permissions.includes(item.permissionKey)
        );
    };

    const navItems = getFilteredNavItems();

    const isActive = (href) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname.startsWith(href);
    };

    // Check if current page is allowed for sub-admin
    useEffect(() => {
        if (!admin || loading) return;

        if (admin.role === "subadmin") {
            const permissions = admin.permissions || [];
            // Check if current path is allowed
            const currentNavItem = allNavItems.find((item) => {
                if (item.href === "/dashboard") return pathname === "/dashboard";
                return pathname.startsWith(item.href);
            });

            if (currentNavItem && currentNavItem.permissionKey !== "dashboard" && !permissions.includes(currentNavItem.permissionKey)) {
                router.push("/dashboard");
            }

            // Block sub-admin from accessing sub-admins page
            if (pathname.startsWith("/dashboard/sub-admins")) {
                router.push("/dashboard");
            }
        }
    }, [admin, pathname, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <i className="fas fa-lock text-blue-600 text-xl"></i>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Background pattern */}
            <div className="fixed inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none"></div>
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_50%)] pointer-events-none"></div>

            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200/50 shadow-xl z-50 transition-all duration-300 flex flex-col ${sidebarOpen ? "w-64" : "w-20"
                    } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
            >
                {/* Logo */}
                <div className="h-20 flex items-center justify-between px-4 border-b border-gray-200/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <i className="fas fa-shield-alt text-white text-lg"></i>
                        </div>
                        {sidebarOpen && (
                            <span className="font-bold text-xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                Admin
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <i className={`fas ${sidebarOpen ? "fa-chevron-left" : "fa-chevron-right"} text-gray-500 text-sm`}></i>
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <i className="fas fa-times text-gray-500"></i>
                    </button>
                </div>

                {/* Navigation - Scrollable Area */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item.href)
                                ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <i className={`${item.icon} text-lg ${isActive(item.href) ? "" : "text-gray-400 group-hover:text-gray-600"}`}></i>
                            {sidebarOpen && (
                                <span className="font-medium">{item.name}</span>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Logout button - Fixed at bottom of flex container */}
                <div className="p-4 border-t border-gray-200/50 bg-white/95">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 ${sidebarOpen ? "" : "justify-center"
                            }`}
                    >
                        <i className="fas fa-sign-out-alt text-lg"></i>
                        {sidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main
                className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"
                    }`}
            >
                {/* Top header */}
                <header className="h-20 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-30 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <i className="fas fa-bars text-gray-600 text-lg"></i>
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                            SOSign Admin Panel
                        </h1>
                    </div>

                    {/* Admin info */}
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-800">
                                {admin?.name || admin?.email || "Admin"}
                            </p>
                            <div className="flex items-center justify-end gap-1.5">
                                {admin?.role === "superadmin" ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                                        <i className="fas fa-crown text-[9px]"></i>
                                        Super Admin
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                                        <i className="fas fa-user-shield text-[9px]"></i>
                                        Sub-Admin
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                            admin?.role === "superadmin"
                                ? "bg-gradient-to-br from-blue-500 to-purple-600"
                                : "bg-gradient-to-br from-purple-500 to-pink-600"
                        }`}>
                            <i className="fas fa-user text-white"></i>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
