/**
 * TrafficGenius — Cloud DNS Service
 *
 * Read operations on GCP Cloud DNS managed zones and records.
 * Uses @google-cloud/dns DNS client.
 */

import { DNS } from "@google-cloud/dns";
import { createScopedLogger } from "@/lib/logger";
import type { DnsZone, DnsRecord } from "@/lib/types";

const log = createScopedLogger("CloudDNS");
const PROJECT = process.env.GCP_PROJECT_ID || "";

let _client: DNS | null = null;

function getClient(): DNS {
  if (!_client) {
    _client = new DNS({ projectId: PROJECT });
  }
  return _client;
}

/**
 * List all managed DNS zones in the GCP project.
 */
export async function listDnsZones(): Promise<DnsZone[]> {
  try {
    const client = getClient();
    const [zones] = await client.getZones();

    return zones.map((zone) => ({
      name: zone.metadata.name || "",
      dnsName: zone.metadata.dnsName || "",
      description: zone.metadata.description || "",
      visibility: zone.metadata.visibility || "public",
    }));
  } catch (err) {
    log.error({ err }, "Failed to list DNS zones");
    return [];
  }
}

/**
 * Get DNS records for a specific managed zone.
 *
 * @param zoneName - The managed zone name (not the DNS name).
 * @param type     - Optional record type filter (e.g. "A", "CNAME").
 *                   Defaults to A and CNAME records when omitted.
 */
export async function getDnsRecords(
  zoneName: string,
  type?: string,
): Promise<DnsRecord[]> {
  try {
    const client = getClient();
    const zone = client.zone(zoneName);

    if (type) {
      const [records] = await zone.getRecords({ type });
      return records.map(mapRecord);
    }

    // No type specified — fetch A and CNAME records separately then merge.
    const [aRecords] = await zone.getRecords({ type: "A" });
    const [cnameRecords] = await zone.getRecords({ type: "CNAME" });

    return [...aRecords, ...cnameRecords].map(mapRecord);
  } catch (err) {
    log.error({ err, zoneName, type }, "Failed to get DNS records");
    return [];
  }
}

/**
 * Validate whether a domain has DNS records in any managed zone.
 *
 * Iterates through all project zones and checks if the given domain
 * matches a zone's dnsName suffix. For the first matching zone, it
 * retrieves A/CNAME records and reports validity.
 *
 * @param domain - Fully qualified domain to validate (e.g. "us.topfinanzas.com").
 */
export async function validateDomainDns(domain: string): Promise<{
  valid: boolean;
  zone: string | null;
  records: DnsRecord[];
}> {
  try {
    const zones = await listDnsZones();

    for (const z of zones) {
      // Zone dnsName has a trailing dot (e.g. "topfinanzas.com.").
      // Normalise both sides for suffix comparison.
      const zoneDomain = z.dnsName.replace(/\.$/, "");
      const normalised = domain.replace(/\.$/, "").toLowerCase();

      if (
        normalised === zoneDomain.toLowerCase() ||
        normalised.endsWith(`.${zoneDomain.toLowerCase()}`)
      ) {
        const records = await getDnsRecords(z.name);

        // Filter to records whose name matches the queried domain.
        const domainWithDot = normalised.endsWith(".")
          ? normalised
          : `${normalised}.`;
        const matching = records.filter(
          (r) => r.name.toLowerCase() === domainWithDot.toLowerCase(),
        );

        return {
          valid: matching.length > 0,
          zone: z.name,
          records: matching,
        };
      }
    }

    // No zone matched the domain.
    return { valid: false, zone: null, records: [] };
  } catch (err) {
    log.error({ err, domain }, "Failed to validate domain DNS");
    return { valid: false, zone: null, records: [] };
  }
}

/**
 * Map a raw Cloud DNS record object to our DnsRecord type.
 */
function mapRecord(raw: Record<string, unknown>): DnsRecord {
  const m = raw.metadata || {};
  return {
    name: (m.name as string) || "",
    type: (m.type as string) || "",
    ttl: (m.ttl as number) || 0,
    rrdatas: (m.rrdatas as string[]) || [],
  };
}
