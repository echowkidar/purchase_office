"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hashData, setHashData] = useState<{ hash: string; timestamp: number } | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith("@amu.ac.in")) {
      setError("Please enter a valid AMU email address");
      return;
    }
    
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "reset" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
      } else {
        setSuccess("Password reset code sent to your email!");
        setHashData({ hash: data.hash, timestamp: data.timestamp });
        setStep(2);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashData || !otp) return;
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          hash: hashData.hash,
          timestamp: hashData.timestamp,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setSuccess("Password successfully reset! Redirecting to login...");
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amu-green via-amu-green-mid to-amu-green-light" />
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        <div className="glass-dark rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-white/10 p-2 ring-2 ring-amu-gold/30">
                <Image
                  src="/logo/android-chrome-512x512.png"
                  alt="AMU Logo"
                  width={64}
                  height={64}
                  className="rounded-full"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-white/60 text-sm">
              {step === 1 ? "Enter your email to receive a verification code" : "Enter the verification code and your new password"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm animate-fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-200 text-sm animate-fade-in">
              {success}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">AMU Email ID</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@amu.ac.in"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amu-gold/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-2.5 rounded-lg bg-amu-gold hover:bg-amu-gold-light text-amu-green font-semibold transition-all duration-200 disabled:opacity-50 mt-2"
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1 text-center">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amu-gold/50 tracking-widest text-center text-xl transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amu-gold/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amu-gold/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6 || !newPassword || !confirmPassword}
                className="w-full py-2.5 rounded-lg bg-amu-gold hover:bg-amu-gold-light text-amu-green font-semibold transition-all duration-200 disabled:opacity-50 mt-4"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              
              <div className="text-center mt-4">
                 <button type="button" onClick={() => { setStep(1); setSuccess(""); setError(""); }} className="text-sm text-white/60 hover:text-white transition-colors">
                    &larr; Back to Email
                 </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Remembered your password? Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
