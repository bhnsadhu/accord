"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { hueFor } from "@/lib/hues";
import type { IdentifyResult } from "@/lib/scan/scentlens";
import { ArrowIcon, CameraIcon } from "./icons";
import { CollectionControls } from "./collection-controls";
import { StripRow } from "./strip";
import { ScentLensLink, ScentLensText } from "./scentlens-link";

type Status = { enabled: false } | { enabled: true; mock: boolean; remaining: number; signedIn: boolean; limitedBy?: "month" | "global" | "caller" | null; canIncreaseWithAccount?: boolean };
type Done = { status: "done"; result: IdentifyResult; cached: boolean; remaining: number; fragrances: FragranceSummary[]; mock: boolean };
type Phase =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "identifying"; since: number }
  | { kind: "done"; data: Done }
  | { kind: "problem"; title: string; detail: string; retry: boolean };

const MAX_SIDE = 1024;
const CLIENT_TIMEOUT_MS = 130_000;

/** Downscale and recompress on the device so uploads stay small and fast. */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.86));
}

export function Scanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    fetch("/api/scan", { cache: "no-store" })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ enabled: false }));
  }, []);

  useEffect(() => {
    if (phase.kind !== "identifying") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase.kind]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function run(file: File) {
    if (inFlight.current) return; // one scan at a time, no duplicate submits
    inFlight.current = true;
    setPreview(URL.createObjectURL(file));
    setPhase({ kind: "preparing" });
    try {
      const blob = await compress(file).catch(() => {
        throw new Problem("That file couldn't be read as a photo.", "Try a JPEG or PNG from your camera.", false);
      });
      const started = Date.now();
      setNow(started);
      setPhase({ kind: "identifying", since: started });
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
        signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
      }).catch((err: Error) => {
        throw err.name === "TimeoutError"
          ? new Problem("ScentLens took too long.", "It may still be starting up. Wait a minute, then try once more.", true)
          : new Problem("You seem to be offline.", "Check your connection and try again.", true);
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.status === "done") {
        setPhase({ kind: "done", data: body as Done });
        setStatus((s) => (s && s.enabled ? { ...s, remaining: body.remaining } : s));
        return;
      }
      throw problemFor(body);
    } catch (err) {
      setPhase(
        err instanceof Problem
          ? { kind: "problem", title: err.message, detail: err.detail, retry: err.retry }
          : { kind: "problem", title: "Something went wrong.", detail: "Try again in a moment.", retry: true },
      );
    } finally {
      inFlight.current = false;
      if (input.current) input.current.value = "";
      // Another request can exhaust a shared allowance while this scan runs.
      void fetch("/api/scan", { cache: "no-store" }).then(r => r.json()).then(setStatus).catch(() => {});
    }
  }

  if (!status) return <div className="mt-10 flex h-64 items-center justify-center gap-3 text-ink-2" role="status" aria-busy="true"><CameraIcon /> Getting the scanner ready…</div>;

  if (!status.enabled) {
    return (
      <section className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="bg-paper p-6 shadow-[var(--shadow-paper)] sm:p-8" style={{ borderRadius: 4 }}>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Scanning is temporarily unavailable.</h2>
          <p className="mt-3 leading-relaxed text-ink-2">
            Please try again later. You can still find a fragrance by its name or brand.
          </p>
          <Link href="/discover" className="mt-6 inline-flex items-center gap-2 font-medium hover:underline">
            Find it by name instead <ArrowIcon />
          </Link>
        </div>
        <HowItWorks />
      </section>
    );
  }

  const busy = phase.kind === "preparing" || phase.kind === "identifying";
  const waited = phase.kind === "identifying" ? Math.floor((now - phase.since) / 1000) : 0;

  return (
    <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div>
        <label
          className={`scan-upload relative flex aspect-[4/5] max-h-[520px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden bg-paper/60 text-center ${busy ? "pointer-events-none" : ""}`}
          style={{ borderRadius: 4 }}
          data-busy={busy}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, never uploaded anywhere else
            <img src={preview} alt="Your photo" className={`absolute inset-0 h-full w-full object-cover ${busy ? "opacity-60" : ""}`} />
          ) : (
            <>
              <CameraIcon width={32} height={32} />
              <span className="text-lg font-medium">Take or choose a photo</span>
              <span className="text-sm text-ink-3">JPEG, PNG or WebP</span>
            </>
          )}
          <svg className="scan-frame" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" aria-hidden="true">
            <path d="M5 25V8a3 3 0 0 1 3-3h17M75 5h17a3 3 0 0 1 3 3v17M95 75v17a3 3 0 0 1-3 3H75M25 95H8a3 3 0 0 1-3-3V75" />
          </svg>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            disabled={busy || status.remaining === 0}
            onChange={(e) => e.target.files?.[0] && run(e.target.files[0])}
          />
        </label>
        <p className="mt-3 font-mono text-sm text-ink-3 tabular">
          {status.limitedBy === "month" ? "This month’s scans are used up." : `${status.remaining} ${status.remaining === 1 ? "scan" : "scans"} left today`}
          {status.canIncreaseWithAccount && " · sign in for more"}
        </p>
        {status.remaining === 0 && <p className="mt-2 text-sm text-ink-2">{status.limitedBy === "month" ? "The allowance renews next month. " : status.limitedBy ? "The allowance renews tomorrow. " : "Search is still available. "}<Link href="/discover" className="font-medium text-ink">Find it by name</Link></p>}
        {status.mock && (
          <p className="mt-2 text-sm font-medium text-alert">Development mode: results are fixed test data, not recognition.</p>
        )}
        <p className="mt-2 text-sm text-ink-3">Processed by <ScentLensLink /> to identify your bottle. <Link href="/privacy" className="font-medium text-ink-2">How photos are handled</Link></p>
      </div>

      <div aria-live="polite" className="scanner-response">
        <div className="selection-change" key={phase.kind}>
        {phase.kind === "idle" && <HowItWorks />}
        {phase.kind === "preparing" && <p className="text-lg">Preparing your photo…</p>}
        {phase.kind === "identifying" && (
          <div>
            <p className="text-2xl font-semibold tracking-[-0.02em]">Reading the bottle…</p>
            <p className="mt-2 text-ink-2">
              <ScentLensText>{waited < 10
                ? "Finding the bottle, comparing it with the catalog, reading the label."
                : "ScentLens is waking up. After a quiet spell the first scan takes about a minute; later ones take a few seconds."}</ScentLensText>
            </p>
            <p className="mt-4 font-mono text-sm text-ink-3 tabular">{waited}s</p>
          </div>
        )}
        {phase.kind === "problem" && (
          <div className="bg-paper p-6 shadow-[var(--shadow-paper)]" style={{ borderRadius: 4 }} role="alert">
            <p className="text-xl font-semibold"><ScentLensText>{phase.title}</ScentLensText></p>
            <p className="mt-2 text-ink-2"><ScentLensText>{phase.detail}</ScentLensText></p>
            <div className="mt-5 flex gap-5">
              {phase.retry && (
                <button type="button" onClick={() => input.current?.click()} className="font-medium underline">
                  Choose a photo again
                </button>
              )}
              <Link href="/discover" className="font-medium underline">
                Search by name
              </Link>
            </div>
          </div>
        )}
        {phase.kind === "done" && <Result data={phase.data} onAgain={() => input.current?.click()} />}
        </div>
      </div>
    </div>
  );
}

class Problem extends Error {
  constructor(
    message: string,
    readonly detail: string,
    readonly retry: boolean,
  ) {
    super(message);
  }
}

function problemFor(body: { status?: string; scope?: string; kind?: string; error?: string }): Problem {
  switch (body.status) {
    case "invalid":
      return new Problem("That photo can't be scanned.", body.error ?? "Use a JPEG, PNG or WebP photo.", true);
    case "busy":
      return new Problem("ScentLens is busy.", "Other scans are running. Try again in about twenty seconds.", true);
    case "quota":
      return body.scope === "month"
        ? new Problem("This month’s scans are used up.", "Scanning reopens next month. You can still find fragrances by name or brand.", false)
        : body.scope === "global"
        ? new Problem("Today's scans are used up.", "Accord limits scans to stay free. Scanning reopens tomorrow; search works now.", false)
        : new Problem("You've used today's scans.", "Sign in for a larger daily allowance, or search by name.", false);
    case "failed":
      return body.kind === "timeout"
        ? new Problem("ScentLens took too long.", "It may be starting up. Wait a minute, then try once more.", true)
        : new Problem("ScentLens didn't respond.", "The recognizer may be down. Try later, or search by name.", true);
    case "disabled":
      return new Problem("Scanning is switched off.", "Search by name instead.", false);
    default:
      return new Problem("Something went wrong.", "Try again in a moment.", true);
  }
}

function Result({ data, onAgain }: { data: Done; onAgain: () => void }) {
  const { result, fragrances } = data;
  const byId = new Map(fragrances.map((f) => [f.productId, f]));
  const answer = result.answered && result.product_id ? byId.get(result.product_id) : undefined;
  const others = result.matches.map((m) => byId.get(m.product_id)).filter((f): f is FragranceSummary => Boolean(f) && f!.productId !== answer?.productId);

  if (answer) {
    return (
      <div>
        <p className="text-[13px] text-ink-3">Identified</p>
        <article className="lift mt-2" style={{ "--hue": hueFor(answer.wheel) } as CSSProperties}>
          <div className="strip-h">
            <span className="stain-h" style={{ "--stain-opacity": "1" } as CSSProperties} />
            <div className="strip-text relative py-5 pr-6">
              <p className="text-sm text-ink-3">
                {answer.brand}
                {answer.wheel && <> · {answer.wheel}</>}
              </p>
              <h2 className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.02em]">
                <Link href={`/fragrance/${answer.slug}`} className="hover:underline">
                  {answer.name}
                </Link>
              </h2>
              <p className="mt-1 text-ink-2">{answer.notes.slice(0, 6).join(", ")}</p>
            </div>
          </div>
        </article>
        <p className="mt-4 text-[15px] text-ink-2">
          {result.reason === "clear label"
            ? `The label reads ${result.text_read.slice(0, 4).join(" ")}, which names this fragrance and no other in the catalog.`
            : `Estimated confidence ${result.confidence.toFixed(2)}: a calibrated estimate from 101 test photos, not a guarantee.`}{" "}
          A flanker missing from the catalog can be named as its closest sibling.
        </p>
        <div className="mt-6 bg-paper p-5 shadow-[var(--shadow-paper)]" style={{ borderRadius: 4 }}>
          <CollectionControls productId={answer.productId} />
        </div>
        <div className="mt-6 flex flex-wrap gap-5">
          <Link href={`/fragrance/${answer.slug}`} className="inline-flex items-center gap-2 font-medium hover:underline">
            Details and similar fragrances <ArrowIcon />
          </Link>
          <button type="button" onClick={onAgain} className="font-medium underline">
            Scan another
          </button>
        </div>
        {others.length > 0 && (
          <section className="mt-10">
            <h3 className="text-[13px] text-ink-3">Other close matches</h3>
            <div className="mt-2 grid gap-2">
              {others.map((f) => (
                <StripRow key={f.productId} fragrance={f} ghost />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-[-0.02em]">Not sure.</h2>
      <p className="mt-2 leading-relaxed text-ink-2">
        {result.reason === "label disagrees"
          ? "The words on the label don't match the closest catalog fragrance, so this bottle may not be in the catalog."
          : "The closest catalog fragrances are too close to call."}{" "}
        These are candidates, not an answer.
      </p>
      <div className="mt-6 grid gap-2">
        {result.matches.map((m) => {
          const f = byId.get(m.product_id);
          return f ? <StripRow key={f.productId} fragrance={f} ghost /> : null;
        })}
      </div>
      <p className="mt-6 text-[15px] text-ink-2">
        For a better read, photograph the front label straight on, fill the frame with the bottle and avoid glare.
      </p>
      <div className="mt-5 flex flex-wrap gap-5">
        <button type="button" onClick={onAgain} className="font-medium underline">
          Try another photo
        </button>
        <Link href={`/discover${result.text_read.length ? `?q=${encodeURIComponent(result.text_read.slice(0, 3).join(" "))}` : ""}`} className="font-medium underline">
          Search by name
        </Link>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <ol className="grid gap-5 text-[15px] leading-relaxed text-ink-2">
      <li>
        <b className="font-semibold text-ink">Find the bottle.</b> OWLv2 locates it in the photo and crops it.
      </li>
      <li>
        <b className="font-semibold text-ink">Compare.</b> A fine-tuned SigLIP 2 model matches the crop against 24,642 catalog
        fragrances, at three rotations.
      </li>
      <li>
        <b className="font-semibold text-ink">Read the label.</b> OCR checks the words against the best match.
      </li>
      <li>
        <b className="font-semibold text-ink">Decide or abstain.</b> A calibrated confidence decides whether to name it. Below
        the threshold, Accord shows candidates and says it isn&rsquo;t sure.
      </li>
    </ol>
  );
}
