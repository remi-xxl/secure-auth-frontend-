"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function VerifyOtpPage() {
  const router = useRouter();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

 
  const inputRefs = useRef([]);


  useEffect(() => {
    const pendingEmail = sessionStorage.getItem("pendingEmail");

    if (!pendingEmail) {
      toast.error("Please register first.");
      router.push("/register");
      return;
    }

    setEmail(pendingEmail);

    inputRefs.current[0]?.focus();
  }, []); 

  const handleChange = (index, value) => {

    if (!/^\d*$/.test(value)) return;


    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); 
    setOtp(newOtp);

    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };


  const handleKeyDown = (index, e) => {

    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      return toast.error("Please enter the complete 6-digit OTP.");
    }

    try {
      setLoading(true);

      const { data } = await api.post("/api/auth/verify-otp", {
        email,
        otp: otpString,
      });

      toast.success(data.message);

      // Clean up sessionStorage — no longer needed after verification
      sessionStorage.removeItem("pendingEmail");

      // Redirect to login so they can sign in with verified account
      router.push("/login");

    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      // We reuse the register endpoint with the same email.
      // The service checks if user exists and is unverified →
      // reuses the document and sends a fresh OTP email
      const { data } = await api.post("/api/auth/register", {
        name: "User",   
        email,
        password: "placeholder",
      });

      toast.success("New OTP sent to your email.");
      setOtp(["", "", "", "", "", ""]); // clear the input boxes
      inputRefs.current[0]?.focus();   // focus first box again

    } catch (error) {
      toast.error(error.response?.data?.message || "Could not resend OTP.");
    }
  };



  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-400">
            We sent a 6-digit code to{" "}
            <span className="text-indigo-400 font-medium">{email}</span>
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* OTP Input Boxes */}
            <div className="flex gap-3 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold
                             bg-gray-800 border border-gray-700 rounded-lg
                             text-white focus:outline-none focus:border-indigo-500
                             focus:ring-1 focus:ring-indigo-500 transition"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700
                         disabled:bg-indigo-800 disabled:cursor-not-allowed
                         text-white font-semibold rounded-lg transition"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>

          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Didn't receive the code?{" "}
            <button
              onClick={handleResend}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition"
            >
              Resend OTP
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
