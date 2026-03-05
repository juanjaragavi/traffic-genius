import * as maxmind from "maxmind";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(__dirname, "../data/GeoLite2-Country.mmdb");

let reader: maxmind.Reader<maxmind.CountryResponse> | null = null;

/**
 * Initialize the MaxMind GeoLite2 reader.
 * Called once at cold start. Safe to call multiple times (idempotent).
 */
export async function initGeoIp(): Promise<void> {
  if (reader) return;
  if (!fs.existsSync(DB_PATH)) {
    console.warn(
      `GeoLite2 database not found at ${DB_PATH}. Country lookup disabled.`,
    );
    return;
  }
  reader = await maxmind.open<maxmind.CountryResponse>(DB_PATH);
}

/**
 * Look up the ISO 3166-1 alpha-2 country code for an IP address.
 * Returns null if the database is not loaded or the IP is not found.
 */
export function lookupCountry(ip: string): string | null {
  if (!reader || !ip) return null;
  try {
    const result = reader.get(ip);
    return result?.country?.iso_code ?? null;
  } catch {
    return null;
  }
}
