// Helper utility to include Authorization header & credentials for API requests
export const getAuthHeaders = (extraHeaders = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authFetch = (url, options = {}) => {
  const originalMethod = (options.method || "GET").toUpperCase();
  const isPutOrDelete = originalMethod === "PUT" || originalMethod === "DELETE";

  const headers = getAuthHeaders({
    ...(options.headers || {}),
    ...(isPutOrDelete ? { "X-HTTP-Method-Override": originalMethod } : {}),
  });

  return fetch(url, {
    ...options,
    method: isPutOrDelete ? "POST" : originalMethod,
    headers,
    credentials: "include",
  });
};
