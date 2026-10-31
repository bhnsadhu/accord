import { readFile } from "node:fs/promises";
import { expect } from "@playwright/test";

export async function mailLink(to: string, kind: "verify" | "reset") {
  let url = "";
  await expect.poll(async () => {
    const text = await readFile("output/reference-build/test-mail.jsonl", "utf8").catch(() => "");
    const mail = text.trim().split("\n").filter(Boolean).map(s => JSON.parse(s)).filter(m => m.to === to && m.kind === kind).at(-1);
    url = mail?.url ?? "";
    return Boolean(url);
  }, { timeout: 10000 }).toBe(true);
  return url;
}
