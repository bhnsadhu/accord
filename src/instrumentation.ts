import type { Instrumentation } from "next";
import { reportFailure } from "./lib/observability";

export const onRequestError: Instrumentation.onRequestError = (error, _request, context) => {
  const digest = typeof error === "object" && error !== null && "digest" in error && typeof error.digest === "string" ? error.digest.slice(0, 100) : undefined;
  reportFailure("request_failed", { route: context.routePath, kind: context.routeType, digest });
};
