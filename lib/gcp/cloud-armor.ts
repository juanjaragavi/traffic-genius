/**
 * TrafficGenius — Cloud Armor Service
 *
 * CRUD operations on GCP Cloud Armor security policies and rules.
 * Uses @google-cloud/compute SecurityPoliciesClient.
 */

import { SecurityPoliciesClient } from "@google-cloud/compute";
import { createScopedLogger } from "@/lib/logger";
import type { SecurityPolicy, SecurityRule } from "@/lib/types";

const log = createScopedLogger("CloudArmor");
const PROJECT = process.env.GCP_PROJECT_ID || "";

let _client: SecurityPoliciesClient | null = null;

function getClient(): SecurityPoliciesClient {
  if (!_client) {
    _client = new SecurityPoliciesClient();
  }
  return _client;
}

/**
 * List all security policies in the project.
 */
export async function listPolicies(): Promise<SecurityPolicy[]> {
  try {
    const client = getClient();
    const [response] = await client.list({ project: PROJECT });
    const items = response ?? [];

    return items.map((p) => ({
      name: p.name || "",
      description: p.description || "",
      selfLink: p.selfLink || "",
      fingerprint: p.fingerprint || "",
      creationTimestamp: p.creationTimestamp || "",
      rules: (p.rules || []).map(mapRule),
    }));
  } catch (err) {
    log.error({ err }, "Failed to list security policies");
    return [];
  }
}

/**
 * Get a single security policy by name.
 */
export async function getPolicy(policyName: string): Promise<SecurityPolicy | null> {
  try {
    const client = getClient();
    const [response] = await client.get({
      project: PROJECT,
      securityPolicy: policyName,
    });

    return {
      name: response.name || "",
      description: response.description || "",
      selfLink: response.selfLink || "",
      fingerprint: response.fingerprint || "",
      creationTimestamp: response.creationTimestamp || "",
      rules: (response.rules || []).map(mapRule),
    };
  } catch (err) {
    log.error({ err }, "Failed to get security policy");
    return null;
  }
}

/**
 * Add a new rule to a security policy.
 */
export async function addRule(
  policyName: string,
  rule: SecurityRule,
): Promise<boolean> {
  try {
    const client = getClient();
    await client.addRule({
      project: PROJECT,
      securityPolicy: policyName,
      securityPolicyRuleResource: {
        priority: rule.priority,
        description: rule.description,
        action: rule.action,
        match: rule.match.expr
          ? {
              expr: { expression: rule.match.expr.expression },
            }
          : {
              versionedExpr: "SRC_IPS_V1",
              config: { srcIpRanges: rule.match.config?.srcIpRanges || [] },
            },
        preview: rule.preview ?? false,
        rateLimitOptions: rule.rateLimitOptions
          ? {
              rateLimitThreshold: rule.rateLimitOptions.rateLimitThreshold,
              conformAction: rule.rateLimitOptions.conformAction,
              exceedAction: rule.rateLimitOptions.exceedAction,
              enforceOnKey: rule.rateLimitOptions.enforceOnKey,
              banDurationSec: rule.rateLimitOptions.banDurationSec,
            }
          : undefined,
      },
    });
    return true;
  } catch (err) {
    log.error({ err }, "Failed to add rule");
    return false;
  }
}

/**
 * Remove a rule from a security policy by priority.
 */
export async function removeRule(
  policyName: string,
  priority: number,
): Promise<boolean> {
  try {
    const client = getClient();
    await client.removeRule({
      project: PROJECT,
      securityPolicy: policyName,
      priority,
    });
    return true;
  } catch (err) {
    log.error({ err }, "Failed to remove rule");
    return false;
  }
}

/**
 * Patch (update) an existing rule.
 */
export async function patchRule(
  policyName: string,
  priority: number,
  updates: Partial<SecurityRule>,
): Promise<boolean> {
  try {
    const client = getClient();
    await client.patchRule({
      project: PROJECT,
      securityPolicy: policyName,
      priority,
      securityPolicyRuleResource: {
        priority,
        description: updates.description,
        action: updates.action,
        match: updates.match?.expr
          ? { expr: { expression: updates.match.expr.expression } }
          : updates.match?.config
            ? {
                versionedExpr: "SRC_IPS_V1",
                config: { srcIpRanges: updates.match.config.srcIpRanges || [] },
              }
            : undefined,
        preview: updates.preview,
      },
    });
    return true;
  } catch (err) {
    log.error({ err }, "Failed to patch rule");
    return false;
  }
}

/**
 * Map raw GCP rule response to our SecurityRule type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRule(raw: any): SecurityRule {
  const r = raw as {
    priority?: number;
    description?: string;
    action?: string;
    match?: {
      versionedExpr?: string;
      expr?: { expression?: string };
      config?: { srcIpRanges?: string[] };
    };
    preview?: boolean;
    rateLimitOptions?: Record<string, unknown>;
  };

  return {
    priority: r.priority ?? 0,
    description: r.description || "",
    action: (r.action || "deny(403)") as SecurityRule["action"],
    match: {
      versionedExpr: r.match?.versionedExpr as "SRC_IPS_V1" | undefined,
      expr: r.match?.expr?.expression
        ? { expression: r.match.expr.expression }
        : undefined,
      config: r.match?.config
        ? { srcIpRanges: r.match.config.srcIpRanges || [] }
        : undefined,
    },
    preview: r.preview ?? false,
    rateLimitOptions: r.rateLimitOptions as SecurityRule["rateLimitOptions"],
  };
}
