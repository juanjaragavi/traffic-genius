/**
 * TrafficGenius — Settings Preferences API
 *
 * GET  /api/settings/preferences — Fetch current user preferences
 * PUT  /api/settings/preferences — Save user preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { query } from "@/lib/db";
import { createScopedLogger } from "@/lib/logger";

const logger = createScopedLogger("api:settings:preferences");

interface PreferencesRow {
  preferences: Record<string, unknown>;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await query<PreferencesRow>(
      "SELECT preferences FROM dashboard_preferences WHERE user_id = $1",
      [Number(session.user.id)],
    );

    return NextResponse.json({
      preferences: rows[0]?.preferences ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch preferences");
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid 'preferences' object" },
        { status: 400 },
      );
    }

    const userId = Number(session.user.id);

    // Upsert: insert or update on conflict
    await query(
      `INSERT INTO dashboard_preferences (user_id, preferences, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET preferences = $2, updated_at = NOW()`,
      [userId, JSON.stringify(preferences)],
    );

    logger.info({ userId }, "Preferences saved");

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to save preferences");
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 },
    );
  }
}
