/** Structured operational events deliberately omit input, cookies, IPs, email and tokens. */
export function reportFailure(event: string, details: { route?: string; digest?: string; kind?: string } = {}) {
  console.error(JSON.stringify({ level: "error", event, ...details, at: new Date().toISOString() }));
}
