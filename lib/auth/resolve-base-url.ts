/**
 * Derive Neon Auth base URL from a Neon DATABASE_URL.
 * Pooler host: ep-{id}-pooler.c-2.ap-southeast-1.aws.neon.tech
 * Auth host:   ep-{id}.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth
 */
export function deriveNeonAuthBaseUrlFromDatabaseUrl(
  databaseUrl: string | undefined
): string | null {
  if (!databaseUrl?.trim()) return null;

  try {
    const host = new URL(databaseUrl.trim().replace(/^['"]|['"]$/g, "")).hostname;
    const endpointId = host.match(/^(.+)-pooler\./)?.[1];
    const regionSuffix = host.replace(/^.+-pooler\./, "");
    if (!endpointId || !regionSuffix) return null;

    return `https://${endpointId}.neonauth.${regionSuffix}/neondb/auth`;
  } catch {
    return null;
  }
}

export function resolveNeonAuthBaseUrl(): string {
  const fromEnv = process.env.NEON_AUTH_BASE_URL?.trim();
  const derived = deriveNeonAuthBaseUrlFromDatabaseUrl(process.env.DATABASE_URL);

  if (fromEnv) {
    if (derived && fromEnv !== derived && !fromEnv.includes(".neonauth.c-")) {
      console.warn(
        `[neon-auth] NEON_AUTH_BASE_URL may be missing the region segment (e.g. c-2). ` +
          `Expected: ${derived}`
      );
    }
    return fromEnv;
  }

  if (derived) return derived;

  throw new Error(
    "NEON_AUTH_BASE_URL is not set and could not be derived from DATABASE_URL. " +
      "Copy Auth URL from Neon Console → Branch → Auth → Configuration"
  );
}
