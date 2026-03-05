import bots from "../data/known-bots.json";

const BOT_PATTERNS: RegExp[] = (bots as string[]).map(
  (p) => new RegExp(p, "i"),
);

const SENSITIVE_PATHS: RegExp[] = [
  /\/\.git/,
  /\/wp-admin/,
  /\/etc\//,
  /\/admin\b/,
  /\/\.env/,
];

export interface ClassifierInput {
  action: string; // "ACCEPT" | "DENY" (from Cloud Armor outcome)
  userAgent: string;
  requestPath: string;
  ruleMatched: string;
}

export interface ClassifierOutput {
  ivtType: "GIVT" | "SIVT" | "suspicious" | "clean";
  confidence: number;
}

function isKnownBot(ua: string): boolean {
  if (!ua) return false;
  return BOT_PATTERNS.some((p) => p.test(ua));
}

function isSensitivePath(path: string): boolean {
  if (!path) return false;
  return SENSITIVE_PATHS.some((p) => p.test(path));
}

/**
 * Classify a single request using action, user-agent, and path signals.
 * Rules are evaluated in priority order — first match wins.
 */
export function classify(input: ClassifierInput): ClassifierOutput {
  const { action, userAgent, requestPath } = input;
  const isDenied = action === "DENY";

  // Priority 1 — GIVT: known legitimate crawlers/bots
  if (isKnownBot(userAgent)) {
    return { ivtType: "GIVT", confidence: 0.95 };
  }

  // Priority 2 — SIVT: denied by Cloud Armor, not a known bot
  if (isDenied) {
    return {
      ivtType: "SIVT",
      confidence: userAgent.trim() === "" ? 0.85 : 0.8,
    };
  }

  // Priority 3 — suspicious: accepted but missing UA
  if (userAgent.trim() === "") {
    return { ivtType: "suspicious", confidence: 0.65 };
  }

  // Priority 3 — suspicious: accepted but probing sensitive path
  if (isSensitivePath(requestPath)) {
    return { ivtType: "suspicious", confidence: 0.7 };
  }

  // Priority 4 — clean
  return { ivtType: "clean", confidence: 0.05 };
}
