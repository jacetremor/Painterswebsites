import "server-only";

import { createHmac } from "node:crypto";

export function hashContactIp(tenantId: string, ip: string): string | null {
  const secret = process.env.CONTACT_IP_HASH_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || ip === "unknown") return null;
  return createHmac("sha256", secret).update(`${tenantId}:${ip}`).digest("hex");
}
