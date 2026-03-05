"use client";

/**
 * TrafficGenius — Dashboard Navigation
 *
 * Top navigation bar for authenticated dashboard pages.
 * Security-themed with TopNetworks branding. Supports i18n.
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Shield,
  BarChart3,
  Bug,
  ScrollText,
  Settings,
  LogOut,
  Activity,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import LanguageSwitcher from "@/components/dashboard/LanguageSwitcher";

const navItems = [
  {
    labelKey: "nav.overview",
    href: "/dashboard",
    icon: Activity,
    exact: true,
  },
  {
    labelKey: "nav.traffic",
    href: "/dashboard/traffic",
    icon: BarChart3,
  },
  {
    labelKey: "nav.botDetection",
    href: "/dashboard/ivt",
    icon: Bug,
  },
  {
    labelKey: "nav.securityRules",
    href: "/dashboard/cloud-armor",
    icon: Shield,
  },
  {
    labelKey: "nav.sites",
    href: "/dashboard/sites",
    icon: Globe,
  },
  {
    labelKey: "nav.auditLog",
    href: "/dashboard/audit-log",
    icon: ScrollText,
  },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <header className="w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + App Name */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 sm:gap-3 min-w-0 cursor-pointer"
          >
            <Image
              src="https://storage.googleapis.com/media-topfinanzas-com/images/topnetworks-positivo-sinfondo.webp"
              alt="TopNetworks Logo"
              width={120}
              height={32}
              className="h-5 sm:h-8 w-auto shrink-0"
              priority
            />
            <div className="h-4 sm:h-6 w-px bg-gray-300 shrink-0" />
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <Shield className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-brand-cyan shrink-0" />
              <h1 className="text-sm sm:text-xl font-bold text-brand-gradient tracking-tight truncate">
                TrafficGenius
              </h1>
            </div>
          </Link>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-blue-50/80 text-brand-blue border border-blue-100/80 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          {/* Right: Language Switcher + Settings + Mobile Menu */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <Link
              href="/dashboard/settings"
              className="hidden sm:flex items-center gap-2 text-sm text-gray-500 hover:text-brand-blue transition-colors rounded-lg px-2 py-1.5 hover:bg-blue-50/60 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline">{t("nav.settings")}</span>
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-brand-blue"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              {t("nav.settings")}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
