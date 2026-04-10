import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amu-green via-amu-green-mid to-amu-green-light" />
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        <div className="glass-dark rounded-2xl shadow-2xl p-8 text-center">
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
          <h1 className="text-2xl font-bold text-white mb-2">Forgot Password</h1>
          <p className="text-white/60 mb-6 text-sm">
            Please contact the CPO administrator to reset your password.
          </p>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-6">
            <p className="text-amu-gold-light text-sm">
              📧 Contact: cpo@amu.ac.in
            </p>
            <p className="text-white/50 text-xs mt-1">
              Or visit the Central Purchase Office in person with your AMU ID.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block px-6 py-2 rounded-lg bg-amu-gold hover:bg-amu-gold-light text-amu-green font-semibold transition-all"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
