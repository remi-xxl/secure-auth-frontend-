import axios from "axios";

const api = axios.create({
  // baseURL points to our backend.
  // process.env.NEXT_PUBLIC_ prefix is required for Next.js
  // to expose env variables to the browser.
  // Without NEXT_PUBLIC_ the variable is undefined on the client.
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",

  // withCredentials: true is CRITICAL.
  // This tells the browser to include cookies in every request.
  // Without this, our JWT cookie is never sent and all
  // protected routes return 401 Unauthorized.
  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

// ─────────────────────────────────────────────
// Response Interceptor
// ─────────────────────────────────────────────
// Interceptors run on every request/response automatically.
// This one catches any 401 response globally —
// meaning the token expired or is invalid —
// and redirects to login without needing to handle
// it in every single page component.

api.interceptors.response.use(
  // Success handler — just return the response as-is
  (response) => response,

  // Error handler — runs when response status is 4xx or 5xx
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're in the browser (not during SSR)
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    // Re-throw so individual pages can still catch
    // and display specific error messages if needed
    return Promise.reject(error);
  }
);

export default api;