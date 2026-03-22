/**
 * Service Helpers — shared patterns for service layer.
 *
 * Provides standardized error handling, logging conventions,
 * and query utilities used across all domain services.
 */

import { supabase } from "@/integrations/supabase/client";

// ── Error handling ───────────────────────────────────────────────────

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly domain: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "DomainError";
  }
}

/**
 * Wrap a Supabase query result, throwing a DomainError on failure.
 */
export function unwrap<T>(
  result: { data: T | null; error: any },
  domain: string,
  operation: string
): T {
  if (result.error) {
    console.error(`[${domain}] ${operation} failed:`, result.error);
    throw new DomainError(
      result.error.message || `Erro em ${operation}`,
      domain,
      operation,
      result.error
    );
  }
  return result.data as T;
}

// ── Observability ────────────────────────────────────────────────────

export type LogLevel = "info" | "warn" | "error";

interface DomainLog {
  domain: string;
  operation: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

const logBuffer: DomainLog[] = [];
const MAX_BUFFER = 200;

/**
 * Log a domain operation. Stores in memory buffer for debugging
 * and outputs to console in development.
 */
export function logDomain(
  domain: string,
  operation: string,
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
) {
  const entry: DomainLog = {
    domain,
    operation,
    level,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  };

  if (logBuffer.length >= MAX_BUFFER) logBuffer.shift();
  logBuffer.push(entry);

  if (import.meta.env.DEV) {
    const prefix = `[${domain}:${operation}]`;
    if (level === "error") console.error(prefix, message, metadata);
    else if (level === "warn") console.warn(prefix, message, metadata);
    else console.log(prefix, message, metadata);
  }
}

/**
 * Get recent domain logs (for debugging panels).
 */
export function getDomainLogs(domain?: string, limit = 50): DomainLog[] {
  const filtered = domain ? logBuffer.filter((l) => l.domain === domain) : logBuffer;
  return filtered.slice(-limit);
}

// ── Supabase shorthand ───────────────────────────────────────────────

/**
 * Typed supabase reference for tables in generated types.
 */
export const db = supabase;

/**
 * Untyped supabase reference for tables NOT in generated types
 * (e.g., orcamento_assets, system_settings, user_profiles).
 */
export const dbAny = supabase as any;
