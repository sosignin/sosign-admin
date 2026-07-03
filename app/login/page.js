"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState("admin"); // "admin" or "subadmin"
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const endpoint = loginMode === "admin" ? "/api/admin/login" : "/api/subadmin/login";

      const res = await fetch(
        `${apiUrl}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON response but got:", contentType);
        setError("Server error: Invalid response format");
        setIsLoading(false);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem("adminToken", data.token);
        }
        router.push("/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]"></div>
      
      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200/50 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full translate-y-12 -translate-x-12"></div>
          {/* Logo/Header */}
          <div className="text-center mb-6 relative z-10">
            <div className="relative inline-block">
              <div 
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <i className={`fas ${loginMode === "admin" ? "fa-lock" : "fa-user-shield"} text-white text-2xl relative z-10`}></i>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur opacity-20"></div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Admin Portal</h2>
            <p className="text-gray-600 font-medium">Sign in to access your dashboard</p>
          </div>

          {/* Login Mode Toggle */}
          <div className="relative z-10 mb-6">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => { setLoginMode("admin"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  loginMode === "admin"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
              >
                <i className="fas fa-crown text-xs"></i>
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode("subadmin"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  loginMode === "subadmin"
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
              >
                <i className="fas fa-user-shield text-xs"></i>
                Sub-Admin
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm relative z-10">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-red-500 mr-3 text-lg"></i>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-green-500 text-lg group-focus-within:text-green-600 transition-colors"></i>
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-purple-500 text-lg group-focus-within:text-purple-600 transition-colors"></i>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-14 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-orange-500 hover:text-orange-600 transition-all duration-200 hover:scale-110"
                >
                  {showPassword ? (
                    <i className="fas fa-eye-slash text-lg"></i>
                  ) : (
                    <i className="fas fa-eye text-lg"></i>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group ${
                loginMode === "admin"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              } ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-2xl"}`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Signing In...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    {loginMode === "admin" ? "Sign In as Super Admin" : "Sign In as Sub-Admin"}
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center relative z-10">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <i className="fas fa-shield-alt text-green-500"></i>
              <span className="font-medium">Protected by advanced security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
