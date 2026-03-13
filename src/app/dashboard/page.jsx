"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  // ─────────────────────────────────────────────
  // GET /api/user/profile
  // ─────────────────────────────────────────────
  // This is the first backend call when dashboard loads.
  // The JWT cookie stored in the browser during login
  // is automatically sent with this request because
  // of withCredentials: true in our api.js.
  //
  // Flow:
  // browser sends cookie → protect middleware reads it
  // → jwt.verify() decodes userId
  // → User.findById(userId) fetches fresh user from MongoDB
  // → req.user = user → getProfile controller runs
  // → userService.getProfile returns user document
  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/api/user/profile");
      setUser(data.user);
      setProfileForm({ name: data.user.name, email: data.user.email });
    } catch (error) {
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // PUT /api/user/profile
  // ─────────────────────────────────────────────
  // Sends updated name/email to backend.
  // protect middleware runs first → knows which user
  // via req.user._id → service updates MongoDB document.
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      const { data } = await api.put("/api/user/profile", profileForm);
      setUser(data.user);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed.");
    } finally {
      setProfileLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // PUT /api/user/avatar
  // ─────────────────────────────────────────────
  // File uploads cannot be sent as JSON.
  // We use FormData which sends as multipart/form-data.
  // The key "avatar" must match upload.single("avatar")
  // in your multer middleware and user.routes.js.
  //
  // Flow:
  // FormData → multer reads file → req.file.buffer
  // → uploadToCloudinary(buffer) streams to Cloudinary
  // → gets back { secure_url, public_id }
  // → saves to user.avatar in MongoDB
  // → returns { url, public_id } to frontend
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setAvatarLoading(true);
      const { data } = await api.put("/api/user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser((prev) => ({ ...prev, avatar: data.avatar }));
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Avatar upload failed.");
    } finally {
      setAvatarLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // PUT /api/user/change-password
  // ─────────────────────────────────────────────
  // Sends currentPassword and newPassword to backend.
  // Service:
  // 1. fetches user with .select("+password")
  // 2. bcrypt.compare(currentPassword, user.password)
  // 3. bcrypt.compare(newPassword, user.password) → not same
  // 4. user.password = newPassword
  // 5. user.save() → pre-save hook hashes it automatically
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      return toast.error("Please fill in both password fields.");
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters.");
    }
    try {
      setPasswordLoading(true);
      const { data } = await api.put("/api/user/change-password", passwordForm);
      toast.success(data.message);
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Password change failed.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // POST /api/auth/logout
  // ─────────────────────────────────────────────
  // protect middleware runs first (logout needs valid token).
  // Controller clears the JWT cookie:
  //   res.cookie("token", "", { expires: new Date(0) })
  // Browser immediately deletes the cookie.
  // All subsequent protected requests will return 401.
  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      localStorage.removeItem("user");
      toast.success("Logged out successfully.");
      router.push("/login");
    } catch (error) {
      toast.error("Logout failed.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-indigo-400 text-lg animate-pulse">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700
                       rounded-lg transition font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Profile Card */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold mb-6">Profile</h2>

          <div className="flex items-center gap-6 mb-8">

            {/* Avatar — clicking triggers hidden file input */}
            <div className="relative">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden
                           cursor-pointer hover:opacity-80 transition ring-2
                           ring-indigo-500"
              >
                {user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center
                                  text-2xl font-bold text-gray-300">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />

              {avatarLoading && (
                <div className="absolute inset-0 rounded-full bg-black/50
                                flex items-center justify-center">
                  <span className="text-xs text-white">Uploading...</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-lg font-semibold">{user?.name}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <p className="text-xs text-indigo-400 mt-1">
                Click avatar to change photo
              </p>
            </div>
          </div>

          {/* Update Profile Form */}
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700
                             rounded-lg text-white placeholder-gray-500
                             focus:outline-none focus:border-indigo-500
                             focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700
                             rounded-lg text-white placeholder-gray-500
                             focus:outline-none focus:border-indigo-500
                             focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700
                         disabled:bg-indigo-800 disabled:cursor-not-allowed
                         text-white font-medium rounded-lg transition"
            >
              {profileLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold mb-6">Change Password</h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter current password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700
                           rounded-lg text-white placeholder-gray-500
                           focus:outline-none focus:border-indigo-500
                           focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Min. 6 characters"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700
                           rounded-lg text-white placeholder-gray-500
                           focus:outline-none focus:border-indigo-500
                           focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700
                         disabled:bg-indigo-800 disabled:cursor-not-allowed
                         text-white font-medium rounded-lg transition"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

      </div>
    </div>
  )}