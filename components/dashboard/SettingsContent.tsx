"use client";

/**
 * TrafficGenius — Settings Content
 *
 * Client component for user preferences and sign-out.
 */

import { useState } from "react";
import { signOut } from "next-auth/react";
import { User, LogOut, Bell, Shield, Clock } from "lucide-react";
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

interface SettingsContentProps {
  user: {
    name: string;
    email: string;
    image: string;
  };
}

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Mexico_City", label: "Mexico City (CST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
];

const REFRESH_OPTIONS = [
  { value: "30", label: "Every 30 seconds" },
  { value: "60", label: "Every 1 minute" },
  { value: "300", label: "Every 5 minutes" },
  { value: "600", label: "Every 10 minutes" },
  { value: "0", label: "Manual only" },
];

export default function SettingsContent({ user }: SettingsContentProps) {
  const [prefs, setPrefs] = useState({
    timezone: "UTC",
    refreshInterval: "60",
    emailAlerts: true,
    criticalOnly: false,
    darkMode: false,
  });

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: Profile + Danger Zone */}
      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </CardTitle>
            <CardDescription>Your Google OAuth account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
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
              <Label htmlFor="role">Role</Label>
              <Input id="role" value="Administrator" disabled />
              <p className="text-xs text-gray-400 mt-1">
                Managed by Google Workspace domain
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out Card */}
        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-base text-red-600 flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right: Preferences */}
      <div className="space-y-6 lg:col-span-2">
        {/* Dashboard Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Dashboard Preferences
            </CardTitle>
            <CardDescription>
              Customize how data is displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  id="timezone"
                  value={prefs.timezone}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, timezone: e.target.value }))
                  }
                  options={TIMEZONE_OPTIONS}
                />
              </div>
              <div>
                <Label htmlFor="refresh">Auto-Refresh Interval</Label>
                <Select
                  id="refresh"
                  value={prefs.refreshInterval}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      refreshInterval: e.target.value,
                    }))
                  }
                  options={REFRESH_OPTIONS}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure alert preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Alerts</p>
                <p className="text-xs text-gray-400">
                  Receive email when threat thresholds are exceeded
                </p>
              </div>
              <Switch
                checked={prefs.emailAlerts}
                onCheckedChange={(checked) =>
                  setPrefs((p) => ({ ...p, emailAlerts: checked }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Critical Alerts Only</p>
                <p className="text-xs text-gray-400">
                  Only receive alerts for critical-severity threats
                </p>
              </div>
              <Switch
                checked={prefs.criticalOnly}
                onCheckedChange={(checked) =>
                  setPrefs((p) => ({ ...p, criticalOnly: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">GCP Project</p>
                <p className="font-mono text-xs text-gray-700">
                  absolute-brook-452020-d5
                </p>
              </div>
              <div>
                <p className="text-gray-400">BigQuery Dataset</p>
                <p className="font-mono text-xs text-gray-700">
                  traffic_security_logs
                </p>
              </div>
              <div>
                <p className="text-gray-400">Auth Provider</p>
                <p className="text-gray-700">Google OAuth 2.0</p>
              </div>
              <div>
                <p className="text-gray-400">Domain Restriction</p>
                <p className="text-gray-700">
                  topnetworks.co, topfinanzas.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
