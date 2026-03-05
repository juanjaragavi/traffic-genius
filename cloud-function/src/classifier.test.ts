import { classify, ClassifierInput } from "./classifier";

function input(overrides: Partial<ClassifierInput> = {}): ClassifierInput {
  return {
    action: "ACCEPT",
    userAgent: "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120",
    requestPath: "/credit-cards",
    ruleMatched: "2147483647",
    ...overrides,
  };
}

describe("classify — GIVT", () => {
  it("classifies Googlebot as GIVT", () => {
    const result = classify(
      input({ userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" }),
    );
    expect(result.ivtType).toBe("GIVT");
    expect(result.confidence).toBe(0.95);
  });

  it("classifies bingbot as GIVT", () => {
    const result = classify(
      input({ userAgent: "Mozilla/5.0 (compatible; bingbot/2.0)" }),
    );
    expect(result.ivtType).toBe("GIVT");
  });

  it("classifies HeadlessChrome as GIVT", () => {
    const result = classify(input({ userAgent: "HeadlessChrome/120.0" }));
    expect(result.ivtType).toBe("GIVT");
  });

  it("classifies GIVT even when action is DENY", () => {
    const result = classify(
      input({ userAgent: "Googlebot/2.1", action: "DENY" }),
    );
    expect(result.ivtType).toBe("GIVT");
  });
});

describe("classify — SIVT", () => {
  it("classifies denied request with non-empty UA as SIVT with 0.80", () => {
    const result = classify(
      input({ action: "DENY", userAgent: "SomeSuspiciousTool/1.0" }),
    );
    expect(result.ivtType).toBe("SIVT");
    expect(result.confidence).toBe(0.8);
  });

  it("classifies denied request with empty UA as SIVT with 0.85", () => {
    const result = classify(input({ action: "DENY", userAgent: "" }));
    expect(result.ivtType).toBe("SIVT");
    expect(result.confidence).toBe(0.85);
  });
});

describe("classify — suspicious", () => {
  it("classifies accepted request with empty UA as suspicious", () => {
    const result = classify(input({ action: "ACCEPT", userAgent: "" }));
    expect(result.ivtType).toBe("suspicious");
    expect(result.confidence).toBe(0.65);
  });

  it("classifies accepted request to /.git as suspicious", () => {
    const result = classify(
      input({ action: "ACCEPT", requestPath: "/.git/config" }),
    );
    expect(result.ivtType).toBe("suspicious");
    expect(result.confidence).toBe(0.7);
  });

  it("classifies accepted request to /wp-admin as suspicious", () => {
    const result = classify(
      input({ action: "ACCEPT", requestPath: "/wp-admin/admin-ajax.php" }),
    );
    expect(result.ivtType).toBe("suspicious");
  });
});

describe("classify — clean", () => {
  it("classifies normal accepted request as clean", () => {
    const result = classify(input());
    expect(result.ivtType).toBe("clean");
    expect(result.confidence).toBe(0.05);
  });
});
