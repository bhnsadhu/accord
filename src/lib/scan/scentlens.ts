import { z } from "zod";

/**
 * The ScentLens /identify result, as documented in
 * github.com/bhnsadhu/scent-lens/blob/main/docs/integration.md and produced by
 * scent_lens.recognize.Result.to_dict().
 */
const matchSchema = z
  .object({
    product_id: z.string(),
    brand: z.string(),
    name: z.string(),
    /** Image similarity plus 0.3 × label match. Ranks matches; not a probability. */
    score: z.number(),
  })
  .passthrough();

export const identifyResultSchema = z.object({
  answered: z.boolean(),
  reason: z.enum(["clear label", "confident", "low confidence", "label disagrees"]),
  /** Calibrated on 101 development photos; 1.0 for the clear-label rule. A coarse estimate, not a guarantee. */
  confidence: z.number().min(0).max(1),
  product_id: z.string().nullable(),
  matches: z.array(matchSchema).max(10),
  text_read: z.array(z.string()).default([]),
  box: z.array(z.number()).length(4).nullable(),
  seconds: z.number(),
  timings: z.record(z.string(), z.number()).default({}),
});
export type IdentifyResult = z.infer<typeof identifyResultSchema>;

export class ScanUpstreamError extends Error {
  constructor(
    message: string,
    readonly kind: "timeout" | "unavailable" | "invalid-response",
  ) {
    super(message);
  }
}

/** Gradio returns either the dict itself or a one-element array holding it. */
export function parseIdentifyResponse(data: unknown): IdentifyResult {
  const value = Array.isArray(data) ? data[0] : data;
  const parsed = identifyResultSchema.safeParse(value);
  if (!parsed.success) throw new ScanUpstreamError("ScentLens returned an unexpected response", "invalid-response");
  const r = parsed.data;
  // Never let an abstention carry an answer, whatever the upstream sent.
  if (!r.answered) return { ...r, product_id: null };
  if (!r.product_id) throw new ScanUpstreamError("Answered result without a product id", "invalid-response");
  return r;
}

export type Identifier = (image: Blob, options: { timeoutMs: number }) => Promise<IdentifyResult>;

/** Calls the deployed ScentLens Gradio app through @gradio/client. Server only. */
export function gradioIdentifier(url: string): Identifier {
  return async (image, { timeoutMs }) => {
    const { Client, handle_file } = await import("@gradio/client");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new ScanUpstreamError("ScentLens did not answer in time", "timeout")), timeoutMs);
    });
    try {
      const call = (async () => {
        const client = await Client.connect(url);
        const { data } = await client.predict("/identify", { image: handle_file(image) });
        return data;
      })();
      const data = await Promise.race([call, timeout]);
      return parseIdentifyResponse(data);
    } catch (err) {
      if (err instanceof ScanUpstreamError) throw err;
      throw new ScanUpstreamError(err instanceof Error ? err.message : "ScentLens is unavailable", "unavailable");
    } finally {
      clearTimeout(timer);
    }
  };
}
