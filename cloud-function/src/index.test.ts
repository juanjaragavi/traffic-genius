import { parseLogEntry, LogEntry } from "./index";

const sampleEntry: LogEntry = {
  insertId: "abc123",
  timestamp: "2026-03-04T10:00:00Z",
  httpRequest: {
    remoteIp: "1.2.3.4",
    userAgent: "Mozilla/5.0 Chrome/120",
    requestUrl: "https://us.topfinanzas.com/credit-cards",
    status: 200,
  },
  jsonPayload: {
    enforcedSecurityPolicy: {
      name: "topnetworks-armor-policy",
      priority: 2147483647,
      outcome: "ACCEPT",
      configuredAction: "ALLOW",
    },
  },
};

describe("parseLogEntry", () => {
  it("extracts all fields from a complete log entry", () => {
    const parsed = parseLogEntry(sampleEntry);
    expect(parsed.insertId).toBe("abc123");
    expect(parsed.timestamp).toBe("2026-03-04T10:00:00Z");
    expect(parsed.sourceIp).toBe("1.2.3.4");
    expect(parsed.userAgent).toBe("Mozilla/5.0 Chrome/120");
    expect(parsed.requestPath).toBe("/credit-cards");
    expect(parsed.action).toBe("ACCEPT");
    expect(parsed.ruleMatched).toBe("2147483647");
    expect(parsed.trafficSource).toBe("topnetworks-armor-policy");
  });

  it("extracts path from requestUrl (strips domain)", () => {
    const entry = {
      ...sampleEntry,
      httpRequest: {
        ...sampleEntry.httpRequest,
        requestUrl: "https://example.com/some/deep/path?q=1",
      },
    };
    expect(parseLogEntry(entry).requestPath).toBe("/some/deep/path");
  });

  it("handles missing httpRequest fields gracefully", () => {
    const entry = {
      ...sampleEntry,
      httpRequest: { remoteIp: "5.5.5.5" },
    } as LogEntry;
    const parsed = parseLogEntry(entry);
    expect(parsed.sourceIp).toBe("5.5.5.5");
    expect(parsed.userAgent).toBe("");
    expect(parsed.requestPath).toBe("");
  });
});
