/** Opt back into account storage only after its database is available. */
export function accountsEnabled() {
  return process.env.ACCORD_ACCOUNTS_ENABLED === "true";
}
