// src/app/login/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return toast.error("Please fill in all fields.");
    }

    try {
      setLoading(true);

      // ── Backend connection ──────────────────────────
      // POST http://localhost:5000/api/auth/login
      // matches router.post("/login", login) in auth.routes.js
      //
      // req.body in controller receives:
      // { email: "john@gmail.com", password: "password123" }
      //
      // The service then:
      // 1. User.findOne({ email }).select("+password")
      // 2. checks user.isVerified === true
      // 3. user.comparePassword(password) → bcrypt.compare()
      // 4. returns the user document
      //
      // The CONTROLLER then (not the service):
      // 5. calls generateToken(res, user._id)
      //    which creates JWT and sets it as an HTTP-only cookie
      //    res.cookie("token", token, { httpOnly: true ... })
      //
      // That cookie is now stored in the browser automatically.
      // Every subsequent request from axios (withCredentials: true)
      // will send that cookie — this is how protected routes work.
      const { data } = await api.post("/api/auth/login", formData);

      toast.success(data.message);

      // Store user info in localStorage so the dashboard
      // can display name/email without an extra API call.
      // Unlike the JWT cookie (which is HTTP-only and secure),
      // this is just display data — not sensitive.
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to protected dashboard
      router.push("/dashboard");

    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700
                           rounded-lg text-white placeholder-gray-500
                           focus:outline-none focus:border-indigo-500
                           focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                {/* Links to forgot password page — we'll build this later */}
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700
                           rounded-lg text-white placeholder-gray-500
                           focus:outline-none focus:border-indigo-500
                           focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700
                         disabled:bg-indigo-800 disabled:cursor-not-allowed
                         text-white font-semibold rounded-lg transition
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition"
            >
              Create one
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}