import { buildRow, IvtRow } from "./bigquery";

describe("buildRow", () => {
  it("maps all fields correctly", () => {
    const row = buildRow({
      insertId: "abc123",
      timestamp: "2026-03-04T10:00:00Z",
      sourceIp: "1.2.3.4",
      countryCode: "US",
      trafficSource: "topnetworks-armor-policy",
      ivtType: "clean",
      confidenceScore: 0.05,
      ruleMatched: "2147483647",
      actionTaken: "allow",
      userAgent: "Mozilla/5.0",
      requestPath: "/credit-cards",
    });

    expect(row).toEqual({
      id: "abc123",
      timestamp: "2026-03-04T10:00:00Z",
      source_ip: "1.2.3.4",
      country_code: "US",
      traffic_source: "topnetworks-armor-policy",
      ivt_type: "clean",
      confidence_score: 0.05,
      rule_matched: "2147483647",
      action_taken: "allow",
      user_agent: "Mozilla/5.0",
      request_path: "/credit-cards",
    });
  });

  it("handles null country code", () => {
    const row = buildRow({
      insertId: "xyz",
      timestamp: "2026-03-04T10:00:00Z",
      sourceIp: "10.0.0.1",
      countryCode: null,
      trafficSource: "policy",
      ivtType: "SIVT",
      confidenceScore: 0.8,
      ruleMatched: "1000",
      actionTaken: "deny",
      userAgent: "",
      requestPath: "/",
    });

    expect(row.country_code).toBeNull();
  });
});
