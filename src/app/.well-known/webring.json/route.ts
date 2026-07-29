import { MANIFEST } from "@/lib/webring";

// Proof of consent for the UW CS webring, served at /.well-known/webring.json.
//
// This is a route handler rather than a file in public/ so the manifest stays derived
// from one config (src/lib/webring.ts) instead of drifting from it. Static: the body is
// a constant, so there is no reason to run this per request.
export const dynamic = "force-static";

export function GET() {
  return Response.json(MANIFEST);
}
