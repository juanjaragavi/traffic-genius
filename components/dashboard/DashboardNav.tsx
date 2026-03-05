"use client";

/**
 * TrafficGenius — Dashboard Sidebar Navigation
 *
 * Collapsible sidebar for authenticated dashboard pages.
 * Expanded (icons + labels) by default on desktop, collapses to icon-only.
 * Slide-over drawer on mobile with hamburger toggle in a slim top bar.
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  BarChart3,
  Bug,
  ScrollText,
  Settings,
  Activity,
  Globe,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useSidebar } from "@/lib/sidebar-context";
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
  {
    labelKey: "nav.settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

/** Sidebar width constants (Tailwind classes) */
const SIDEBAR_EXPANDED_W = "w-64";
const SIDEBAR_COLLAPSED_W = "w-17";

export default function DashboardNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { collapsed, setCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [mobileOpen, handleKeyDown]);

  /** Shared nav link renderer */
  function NavLink({
    item,
    showLabel,
    onClick,
  }: {
    item: (typeof navItems)[number];
    showLabel: boolean;
    onClick?: () => void;
  }) {
    const isActive = item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={onClick}
        title={!showLabel ? t(item.labelKey) : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
          showLabel ? "px-3 py-2.5" : "px-3 py-2.5 justify-center",
          isActive
            ? "bg-blue-50/80 text-brand-blue shadow-sm border border-blue-100/80"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80",
        )}
      >
        <Icon className="w-4.5 h-4.5 shrink-0" />
        {showLabel && <span className="truncate">{t(item.labelKey)}</span>}
      </Link>
    );
  }

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between h-14 px-4 border-b border-gray-200/60 bg-white/90 backdrop-blur-md">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="https://storage.googleapis.com/media-topfinanzas-com/images/topnetworks-positivo-sinfondo.webp"
            alt="TopNetworks Logo"
            width={100}
            height={28}
            className="h-6 w-auto"
            priority
          />
          <div className="h-5 w-px bg-gray-300" />
          <Shield className="w-4 h-4 text-brand-cyan" />
          <span className="text-sm font-bold text-brand-gradient">
            TrafficGenius
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200/60 shadow-xl transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <Shield className="w-5 h-5 text-brand-cyan" />
            <span className="text-base font-bold text-brand-gradient">
              TrafficGenius
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3 overflow-y-auto h-[calc(100%-3.5rem)]">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              showLabel
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-gray-200/60 bg-white/95 backdrop-blur-md transition-[width] duration-300 ease-in-out",
          collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W,
        )}
      >
        {/* Sidebar header */}
        <div
          className={cn(
            "flex items-center h-16 border-b border-gray-100 shrink-0",
            collapsed ? "justify-center px-2" : "px-4 gap-3",
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center min-w-0 cursor-pointer",
              collapsed ? "justify-center" : "gap-2.5",
            )}
          >
            {!collapsed && (
              <Image
                src="https://storage.googleapis.com/media-topfinanzas-com/images/topnetworks-positivo-sinfondo.webp"
                alt="TopNetworks Logo"
                width={110}
                height={30}
                className="h-7 w-auto shrink-0"
                priority
              />
            )}
            {collapsed && <Shield className="w-6 h-6 text-brand-cyan" />}
          </Link>
          {!collapsed && (
            <div className="flex items-center gap-1.5 min-w-0 ml-auto">
              <div className="h-5 w-px bg-gray-200" />
              <Shield className="w-4 h-4 text-brand-cyan shrink-0" />
              <span className="text-sm font-bold text-brand-gradient truncate">
                TrafficGenius
              </span>
            </div>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} showLabel={!collapsed} />
          ))}
        </nav>

        {/* Sidebar footer: language switcher + collapse toggle */}
        <div
          className={cn(
            "border-t border-gray-100 p-3 shrink-0 flex flex-col gap-2",
            collapsed && "items-center",
          )}
        >
          {!collapsed && <LanguageSwitcher />}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center justify-center gap-2 w-full p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer text-xs"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span className="text-gray-500">{t("nav.collapse")}</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
