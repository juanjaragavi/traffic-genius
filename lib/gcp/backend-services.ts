/**
 * TrafficGenius — Backend Services
 *
 * Read operations on GCP Compute Engine global backend services.
 * Uses @google-cloud/compute BackendServicesClient.
 */

import { BackendServicesClient } from "@google-cloud/compute";
import { createScopedLogger } from "@/lib/logger";
import type { BackendServiceInfo } from "@/lib/types";

const log = createScopedLogger("BackendServices");
const PROJECT = process.env.GCP_PROJECT_ID || "";

let _client: BackendServicesClient | null = null;

function getClient(): BackendServicesClient {
  if (!_client) {
    _client = new BackendServicesClient();
  }
  return _client;
}

/**
 * List all global backend services in the project.
 */
export async function listBackendServices(): Promise<BackendServiceInfo[]> {
  try {
    const client = getClient();
    const [items] = await client.list({ project: PROJECT });
    const services = items ?? [];

    return services.map((bs) => ({
      name: bs.name || "",
      description: bs.description || "",
      protocol: bs.protocol || "",
      port: bs.port ? Number(bs.port) : null,
      healthChecks: (bs.healthChecks || []).map((hc) =>
        typeof hc === "string" ? hc : String(hc),
      ),
      backends: (bs.backends || []).map((b) => ({
        group: String(b.group || ""),
        balancingMode: String(b.balancingMode || ""),
      })),
    }));
  } catch (err) {
    log.error({ err }, "Failed to list backend services");
    return [];
  }
}

/**
 * Get a single backend service by name.
 */
export async function getBackendService(
  name: string,
): Promise<BackendServiceInfo | null> {
  try {
    const client = getClient();
    const [response] = await client.get({
      project: PROJECT,
      backendService: name,
    });

    return {
      name: response.name || "",
      description: response.description || "",
      protocol: response.protocol || "",
      port: response.port ? Number(response.port) : null,
      healthChecks: (response.healthChecks || []).map((hc) =>
        typeof hc === "string" ? hc : String(hc),
      ),
      backends: (response.backends || []).map((b) => ({
        group: String(b.group || ""),
        balancingMode: String(b.balancingMode || ""),
      })),
    };
  } catch (err) {
    log.error({ err }, "Failed to get backend service");
    return null;
  }
}
