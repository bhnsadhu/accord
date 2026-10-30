import { describe, expect, it } from "vitest";
import { checkImage, sniffImage } from "./image";
import { parseIdentifyResponse, ScanUpstreamError } from "./scentlens";
import { scannerMode } from "./service";

// The documented example response from ScentLens docs/integration.md.
const documented = {
  answered: true,
  reason: "confident",
  confidence: 0.8123,
  product_id: "p05819",
  matches: [
    {
      product_id: "p05819",
      brand: "Chanel",
      name: "Chance Eau De Parfum",
      score: 1.0412,
      family: "FLORAL",
      subfamily: "...",
      accords: "...",
      notes: "...",
      gender: "...",
      year: "...",
    },
  ],
  text_read: ["CHANCE", "CHANEL"],
  box: [120, 40, 610, 980],
  seconds: 1.16,
  timings: { crop: 0.85, embed: 0.12, read: 0.18, match: 0.01 },
};

describe("parseIdentifyResponse", () => {
  it("accepts the documented schema, bare or wrapped in Gradio's array", () => {
    expect(parseIdentifyResponse(documented).product_id).toBe("p05819");
    expect(parseIdentifyResponse([documented]).matches[0].brand).toBe("Chanel");
  });

  it("strips any product id from an abstention", () => {
    const r = parseIdentifyResponse({ ...documented, answered: false, reason: "low confidence", product_id: "p05819" });
    expect(r.answered).toBe(false);
    expect(r.product_id).toBeNull();
    expect(r.matches).toHaveLength(1);
  });

  it("keeps clear-label confidence as reported, without promoting it", () => {
    const r = parseIdentifyResponse({ ...documented, reason: "clear label", confidence: 1 });
    expect(r.reason).toBe("clear label");
    expect(r.confidence).toBe(1);
  });

  it("accepts a missing box", () => {
    expect(parseIdentifyResponse({ ...documented, box: null }).box).toBeNull();
  });

  it("rejects malformed responses", () => {
    for (const bad of [null, "error", { ...documented, reason: "maybe" }, { ...documented, confidence: 3 }, { answered: true }]) {
      expect(() => parseIdentifyResponse(bad)).toThrow(ScanUpstreamError);
    }
    expect(() => parseIdentifyResponse({ ...documented, product_id: null })).toThrow(/without a product id/);
  });
});

describe("image validation", () => {
  const pad = (head: number[], size = 4096) => {
    const b = new Uint8Array(size);
    b.set(head);
    return b;
  };
  const jpeg = pad([0xff, 0xd8, 0xff, 0xe0]);
  const png = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = pad([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")]);

  it("sniffs formats from magic bytes", () => {
    expect(sniffImage(jpeg)).toBe("image/jpeg");
    expect(sniffImage(png)).toBe("image/png");
    expect(sniffImage(webp)).toBe("image/webp");
    expect(sniffImage(pad([...Buffer.from("<svg")]))).toBeNull();
  });

  it("rejects tiny, huge and non-image uploads", () => {
    expect(checkImage(jpeg).ok).toBe(true);
    expect(checkImage(new Uint8Array(10)).ok).toBe(false);
    expect(checkImage(pad([0xff, 0xd8, 0xff], 3 * 1024 * 1024)).ok).toBe(false);
    expect(checkImage(pad([...Buffer.from("%PDF")])).ok).toBe(false);
  });
});

describe("scannerMode", () => {
  const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;
  it("is off unless explicitly enabled with a URL", () => {
    expect(scannerMode(env({}))).toBe("off");
    expect(scannerMode(env({ SCANNER_MODE: "live" }))).toBe("off");
    expect(scannerMode(env({ SCANNER_MODE: "live", SCENTLENS_URL: "https://x" }))).toBe("live");
  });

  it("never allows the mock in production", () => {
    expect(scannerMode(env({ SCANNER_MODE: "mock", NODE_ENV: "development" }))).toBe("mock");
    expect(scannerMode(env({ SCANNER_MODE: "mock", NODE_ENV: "production" }))).toBe("off");
  });
});
