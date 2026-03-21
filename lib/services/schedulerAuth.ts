import { getCronSecret } from "@/lib/supabase/env";

function extractBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
}

export function isSchedulerAuthorized(request: Request) {
  const secret = getCronSecret();

  if (!secret) {
    return false;
  }

  const bearerToken = extractBearerToken(request);
  const headerToken = request.headers.get("x-scheduler-token") ?? "";

  return bearerToken === secret || headerToken === secret;
}
