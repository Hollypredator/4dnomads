import { notFound } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";

// Decision 4 (docs/cutover-plan.md): supabase-js never throws. Every call
// returns { data, error }. A discarded error is silent by default -- a
// failed write can render as a success. unwrap() is the single point every
// Supabase call goes through, so there is no unchecked path.

export type AppErrorKind =
  | "not_found" // 22P02 invalid input syntax, PGRST116 no rows
  | "forbidden" // 42501 RLS denial, or a custom errcode from a trigger guard
  | "validation" // 23514 check violation
  | "conflict" // 23505 unique violation
  | "rate_limited" // P0001 raised by a rate/volume-cap trigger
  | "unavailable" // 57014 timeout, 08006/53300 connection issues
  | "auth" // PGRST301 expired JWT, AuthApiError, AuthRetryableFetchError
  | "unknown";

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly cause?: unknown;

  constructor(kind: AppErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.cause = cause;
  }
}

function classify(error: PostgrestError): { kind: AppErrorKind; message: string } {
  switch (error.code) {
    case "22P02":
    case "PGRST116":
      return { kind: "not_found", message: "The item you were looking for could not be found." };
    case "42501":
      return { kind: "forbidden", message: "You do not have permission to do that." };
    case "23514":
      return { kind: "validation", message: "That value is not allowed." };
    case "23505":
      return { kind: "conflict", message: "That already exists." };
    case "23503":
      return { kind: "validation", message: "That refers to something that no longer exists." };
    case "P0001":
      return { kind: "rate_limited", message: error.message || "Please slow down and try again." };
    case "P0002":
      return { kind: "not_found", message: "The item you were looking for could not be found." };
    case "57014":
    case "08006":
    case "53300":
      return { kind: "unavailable", message: "The service is temporarily unavailable. Please try again." };
    case "PGRST301":
      return { kind: "auth", message: "Your session has expired. Please sign in again." };
    default:
      return { kind: "unknown", message: "Something went wrong. Please try again." };
  }
}

/**
 * Wraps every Supabase call. Reads `error`, logs full context, and throws a
 * typed AppError -- there is no path through this function that silently
 * drops a failure. `notFound()` short-circuits the two "doesn't exist"
 * classes so Server Components render the 404 boundary directly.
 */
export function unwrap<T>(
  result: { data: T | null; error: PostgrestError | null },
  context: { op: string; args?: Record<string, unknown> }
): T {
  if (result.error) {
    const { kind, message } = classify(result.error);

    console.error("[supabase]", {
      op: context.op,
      args: context.args,
      kind,
      code: result.error.code,
      pgMessage: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    if (kind === "not_found") {
      notFound();
    }

    throw new AppError(kind, message, result.error);
  }

  if (result.data === null) {
    // A successful call with no error and no data means "no rows" for
    // .single()/.maybeSingle() reads keyed by an id from the URL.
    console.warn("[supabase] null data with no error", context);
    notFound();
  }

  return result.data;
}

/** For mutations with no `.select()` (delete, or an update/insert whose row isn't needed). Checks only `error`, never treats null data as not-found. */
export function unwrapVoid(
  result: { error: PostgrestError | null },
  context: { op: string; args?: Record<string, unknown> }
): void {
  if (result.error) {
    const { kind, message } = classify(result.error);
    console.error("[supabase]", { op: context.op, args: context.args, kind, code: result.error.code, pgMessage: result.error.message });
    throw new AppError(kind, message, result.error);
  }
}

/** Same contract as unwrap(), for calls where an empty result is valid (lists). */
export function unwrapList<T>(
  result: { data: T[] | null; error: PostgrestError | null },
  context: { op: string; args?: Record<string, unknown> }
): T[] {
  if (result.error) {
    const { kind, message } = classify(result.error);
    console.error("[supabase]", {
      op: context.op,
      args: context.args,
      kind,
      code: result.error.code,
      pgMessage: result.error.message,
    });
    throw new AppError(kind, message, result.error);
  }
  return result.data ?? [];
}
