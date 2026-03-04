/**
 * TrafficGenius — Login Page
 *
 * Google OAuth sign-in via NextAuth.js v5.
 * Domain-restricted to @topnetworks.co and @topfinanzas.com.
 */

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Shield, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 via-cyan-50 to-blue-100 px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-brand-blue/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-brand-cyan/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>

          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              TrafficGenius
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">
              Anti-Bot Security &amp; Traffic Analytics Dashboard
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Divider with "sign in" label */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">
                Sign in with your organization account
              </span>
            </div>
          </div>

          {/* Google Sign-In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            className="w-full h-12 text-sm font-medium gap-3 hover:bg-gray-50"
          >
            <Chrome className="w-5 h-5" />
            {loading ? "Redirecting to Google..." : "Continue with Google"}
          </Button>

          {/* Info note */}
          <div className="rounded-lg bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-700 text-center leading-relaxed">
              Access is restricted to{" "}
              <span className="font-semibold">@topnetworks.co</span> and{" "}
              <span className="font-semibold">@topfinanzas.com</span> accounts
              only.
            </p>
          </div>

          {/* Footer branding */}
          <p className="text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} TopNetworks, Inc. All rights
            reserved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
