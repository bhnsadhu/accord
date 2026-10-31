"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { PlusIcon } from "./icons";

export function CatalogRequest({ initialName = "" }: { initialName?: string }) {
  const id = useId();
  const status = useRef<HTMLParagraphElement>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const data = new FormData(event.currentTarget);
    setState("sending");
    try {
      const response = await fetch("/api/catalog-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setState("sent");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We could not save your request. Please try again."); setState("error"); }
    requestAnimationFrame(() => status.current?.focus());
  }
  return <details className="catalog-request">
    <summary>Missing a fragrance? <PlusIcon /></summary>
    <div className="catalog-request-body">
      <p id={`${id}-help`}>Send a private catalog request. Include the exact version so we can check the right fragrance.</p>
      {state === "sent" ? <p ref={status} tabIndex={-1} role="status" className="catalog-request-success">Request saved. It is private and will be checked before anything is added to the catalog.</p> : <form onSubmit={submit} aria-describedby={`${id}-help`}>
        <label>Fragrance and version<input name="fragrance" defaultValue={initialName.slice(0, 160)} required minLength={2} maxLength={160} autoComplete="off" placeholder="e.g. Sauvage Eau de Parfum" /></label>
        <label>Brand<input name="brand" required minLength={2} maxLength={100} autoComplete="off" placeholder="e.g. Dior" /></label>
        <label className="catalog-request-wide">Official source link <span>(optional)</span><input name="sourceUrl" type="url" maxLength={500} placeholder="https://" /></label>
        <div className="catalog-request-wide"><button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Request fragrance"}</button></div>
        {state === "error" && <p ref={status} tabIndex={-1} role="alert" className="catalog-request-wide">{error}</p>}
      </form>}
    </div>
  </details>;
}
