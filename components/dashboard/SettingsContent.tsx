"use client";

/**
 * TrafficGenius — Settings Content
 *
 * Client component for user preferences and sign-out.
 * Tracks dirty state and shows a sticky "Save Changes" bar when unsaved edits exist.
 */

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import {
  User,
  LogOut,
  Bell,
  Shield,
  Clock,
  Save,
  Check,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface SettingsContentProps {
  user: {
    name: string;
    email: string;
    image: string;
  };
}

interface Preferences {
  timezone: string;
  refreshInterval: string;
  emailAlerts: boolean;
  criticalOnly: boolean;
  darkMode: boolean;
}

const DEFAULT_PREFS: Preferences = {
  timezone: "UTC",
  refreshInterval: "60",
  emailAlerts: true,
  criticalOnly: false,
  darkMode: false,
};

const TIMEZONE_VALUES = [
  { value: "UTC", key: "settings.tz_utc" },
  { value: "America/New_York", key: "settings.tz_eastern" },
  { value: "America/Chicago", key: "settings.tz_central" },
  { value: "America/Denver", key: "settings.tz_mountain" },
  { value: "America/Los_Angeles", key: "settings.tz_pacific" },
  { value: "America/Mexico_City", key: "settings.tz_mexicoCity" },
  { value: "America/Bogota", key: "settings.tz_bogota" },
  { value: "America/Sao_Paulo", key: "settings.tz_saoPaulo" },
  { value: "Europe/London", key: "settings.tz_london" },
];

const REFRESH_VALUES = [
  { value: "30", key: "settings.refresh_30s" },
  { value: "60", key: "settings.refresh_1m" },
  { value: "300", key: "settings.refresh_5m" },
  { value: "600", key: "settings.refresh_10m" },
  { value: "0", key: "settings.refresh_manual" },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsContent({ user }: SettingsContentProps) {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [savedPrefs, setSavedPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute dirty state by comparing current prefs to last-saved prefs
  const isDirty = JSON.stringify(prefs) !== JSON.stringify(savedPrefs);

  const timezoneOptions = TIMEZONE_VALUES.map((tz) => ({
    value: tz.value,
    label: t(tz.key),
  }));
  const refreshOptions = REFRESH_VALUES.map((r) => ({
    value: r.value,
    label: t(r.key),
  }));

  // Load saved preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/settings/preferences");
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            const loaded: Preferences = {
              ...DEFAULT_PREFS,
              ...data.preferences,
            };
            setPrefs(loaded);
            setSavedPrefs(loaded);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadPreferences();
  }, []);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs }),
      });

      if (!res.ok) throw new Error("Save failed");

      setSavedPrefs({ ...prefs });
      setSaveStatus("saved");

      // Reset status after 2.5 seconds
      savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [prefs]);

  const handleDiscard = useCallback(() => {
    setPrefs({ ...savedPrefs });
    setSaveStatus("idle");
  }, [savedPrefs]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="relative pb-20">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Profile + Danger Zone */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("settings.profile")}
              </CardTitle>
              <CardDescription>
                {t("settings.profileDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-brand-blue" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="role">{t("settings.role")}</Label>
                <Input id="role" value={t("settings.administrator")} disabled />
                <p className="text-xs text-gray-500 mt-1">
                  {t("settings.managedByGoogle")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out Card */}
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-base text-red-600 flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                {t("settings.session")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full"
              >
                {t("settings.signOut")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preferences */}
        <div className="space-y-6 lg:col-span-2">
          {/* Dashboard Preferences */}
          <Card
            className={cn(
              "transition-shadow duration-200",
              isDirty && "ring-2 ring-brand-blue/20 shadow-md",
            )}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t("settings.dashboardPreferences")}
                {isDirty && (
                  <span className="ml-auto inline-flex items-center rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-medium text-brand-blue">
                    {t("settings.unsaved")}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {t("settings.customizeDisplay")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">{t("settings.timezone")}</Label>
                  <Select
                    id="timezone"
                    value={prefs.timezone}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, timezone: e.target.value }))
                    }
                    options={timezoneOptions}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="refresh">
                    {t("settings.autoRefreshInterval")}
                  </Label>
                  <Select
                    id="refresh"
                    value={prefs.refreshInterval}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        refreshInterval: e.target.value,
                      }))
                    }
                    options={refreshOptions}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card
            className={cn(
              "transition-shadow duration-200",
              isDirty && "ring-2 ring-brand-blue/20 shadow-md",
            )}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {t("settings.notifications")}
                {isDirty && (
                  <span className="ml-auto inline-flex items-center rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-medium text-brand-blue">
                    {t("settings.unsaved")}
                  </span>
                )}
              </CardTitle>
              <CardDescription>{t("settings.configureAlerts")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t("settings.emailAlerts")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("settings.emailAlertsDescription")}
                  </p>
                </div>
                <Switch
                  checked={prefs.emailAlerts}
                  onCheckedChange={(checked) =>
                    setPrefs((p) => ({ ...p, emailAlerts: checked }))
                  }
                  disabled={isLoading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t("settings.criticalAlertsOnly")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("settings.criticalAlertsDescription")}
                  </p>
                </div>
                <Switch
                  checked={prefs.criticalOnly}
                  onCheckedChange={(checked) =>
                    setPrefs((p) => ({ ...p, criticalOnly: checked }))
                  }
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t("settings.securityInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">{t("settings.gcpProject")}</p>
                  <p className="font-mono text-xs text-gray-700">
                    absolute-brook-452020-d5
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">
                    {t("settings.bigqueryDataset")}
                  </p>
                  <p className="font-mono text-xs text-gray-700">
                    traffic_security_logs
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">{t("settings.authProvider")}</p>
                  <p className="text-gray-700">{t("settings.googleOAuth")}</p>
                </div>
                <div>
                  <p className="text-gray-500">
                    {t("settings.domainRestriction")}
                  </p>
                  <p className="text-gray-700">
                    topnetworks.co, topfinanzas.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Sticky Save Changes Bar ── */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          isDirty || saveStatus === "saved" || saveStatus === "error"
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Status indicator */}
              <div className="flex items-center gap-2.5 min-w-0">
                {saveStatus === "saved" ? (
                  <>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-700">
                      {t("settings.savedSuccessfully")}
                    </p>
                  </>
                ) : saveStatus === "error" ? (
                  <>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <span className="text-xs font-bold text-red-600">!</span>
                    </div>
                    <p className="text-sm font-medium text-red-700">
                      {t("settings.saveFailed")}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-brand-blue opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue" />
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("settings.unsavedChanges")}
                    </p>
                  </>
                )}
              </div>

              {/* Right: Action buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                {isDirty && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDiscard}
                    disabled={saveStatus === "saving"}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    {t("settings.discard")}
                  </Button>
                )}
                {isDirty && (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saveStatus === "saving"}
                    className="bg-brand-blue hover:bg-brand-blue/90 text-white shadow-sm min-w-30"
                  >
                    {saveStatus === "saving" ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        {t("settings.saving")}
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        {t("settings.saveChanges")}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
