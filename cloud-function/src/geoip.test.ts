import { lookupCountry, initGeoIp } from "./geoip";
import path from "path";

describe("lookupCountry", () => {
  it("returns null when database is not initialized", () => {
    // lookupCountry without init → returns null, never throws
    expect(lookupCountry("8.8.8.8")).toBeNull();
  });

  it("returns null for invalid IP", () => {
    expect(lookupCountry("not-an-ip")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(lookupCountry("")).toBeNull();
  });
});
