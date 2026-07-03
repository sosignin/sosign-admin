// Helper utility to include Authorization header & credentials for API requests
export const getAuthHeaders = (extraHeaders = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authFetch = (url, options = {}) => {
  const headers = getAuthHeaders(options.headers || {});
  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
};
