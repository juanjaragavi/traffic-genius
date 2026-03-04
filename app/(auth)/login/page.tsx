/**
 * TrafficGenius — Login Page
 *
 * Google OAuth sign-in via NextAuth.js v5.
 * Domain-restricted to @topnetworks.co and @topfinanzas.com.
 *
 * Design aligned with TopNetworks corporate login standard
 * (reference: RouteGenius at route.topnetworks.co/login).
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-lime-50 via-cyan-50 to-blue-100 px-4">
      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-10 space-y-7">
        {/* TopNetworks Logo */}
        <div className="flex justify-center">
          <Image
            src="https://storage.googleapis.com/media-topfinanzas-com/images/topnetworks-positivo-sinfondo.webp"
            alt="TopNetworks"
            width={160}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </div>

        {/* Product Branding */}
        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-brand-blue" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              TrafficGenius
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Anti-Bot Security &amp; Traffic Analytics Dashboard
          </p>
        </div>

        {/* Sign-in instruction */}
        <p className="text-center text-sm text-gray-500">
          Sign in with your corporate Google account to continue.
        </p>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 h-12 rounded-lg bg-brand-blue text-white text-sm font-semibold transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#fff"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#fff"
            />
            <path
              d="M5.84 14.09a7.12 7.12 0 0 1 0-4.17V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#fff"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#fff"
            />
          </svg>
          {loading ? "Redirecting to Google..." : "Sign In with Google"}
        </button>

        {/* Access restriction notice */}
        <p className="text-center text-xs text-gray-400 leading-relaxed">
          Access restricted to{" "}
          <span className="font-medium text-gray-500">@topnetworks.co</span> and{" "}
          <span className="font-medium text-gray-500">@topfinanzas.com</span>{" "}
          users.
        </p>
      </div>

      {/* Footer copyright */}
      <p className="mt-6 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} TopNetworks, Inc. All rights reserved.
      </p>
    </div>
  );
}
