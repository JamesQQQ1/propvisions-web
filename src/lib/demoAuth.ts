// src/lib/demoAuth.ts
/**
 * Demo Access helpers
 * - Reads DEMO_ACCESS_KEYS from env
 * - Accepts CSV and/or whitespace separated
 * - Trims, de-dupes, ignores empty entries
 * - Case-insensitive compare
 */

export type ParsedKeys = {
    all: string[];
    lowerSet: Set<string>;
  };
  
  export function parseAllowedKeysFromEnv(): ParsedKeys {
    const raw = process.env.DEMO_ACCESS_KEYS || process.env.NEXT_PUBLIC_DEMO_ACCESS_KEYS || "";
    // Split on commas and whitespace (one or many)
    const parts = raw.split(/[,\s]+/g).map(s => s.trim()).filter(Boolean);
    const dedup = Array.from(new Set(parts));
    const lowerSet = new Set(dedup.map(s => s.toLowerCase()));
    return { all: dedup, lowerSet };
  }
  
  /**
   * Extracts a user-provided code from:
   * - JSON body: { code } or { accessCode } or { key }
   * - Query string: ?code=... or ?accessCode=... or ?key=...
   * - Header: x-demo-code: ...
   */
  export function extractUserCode(req: any): string | null {
    const headers = req?.headers || {};
    const h = (name: string) => (headers[name] ?? headers[name.toLowerCase()] ?? "");
    const headerCode = String(h("x-demo-code") || "").trim();
  
    // Body (may already be parsed by Next)
    const body = typeof req.body === "string"
      ? safeJson(req.body)
      : (req.body || {});
    const bodyCode = String(
      body?.code ?? body?.accessCode ?? body?.key ?? ""
    ).trim();
  
    // Query
    const q = req?.query || {};
    const queryCode = String(
      q.code ?? q.accessCode ?? q.key ?? ""
    ).trim();
  
    const firstNonEmpty = [headerCode, bodyCode, queryCode].find(Boolean) || null;
    return firstNonEmpty;
  }
  
  function safeJson(s: string) {
    try { return JSON.parse(s); } catch { return {}; }
  }
  
  export function isAllowed(code: string, lowerSet: Set<string>): boolean {
    return lowerSet.has(code.toLowerCase());
  }
  