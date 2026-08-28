import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { AppError, unwrap, unwrapMaybe, unwrapVoid, unwrapList, runAction } from "./errors";

function pgError(code: string, message = "pg error"): PostgrestError {
  return {
    code,
    message,
    details: "",
    hint: "",
    name: "PostgrestError",
    toJSON: () => ({ code, message, details: "", hint: "", name: "PostgrestError" }),
  };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("unwrap", () => {
  it("returns data on success", () => {
    expect(unwrap({ data: { id: "1" }, error: null }, { op: "test" })).toEqual({ id: "1" });
  });

  it("throws a classified AppError for a real Postgres error", () => {
    expect(() => unwrap({ data: null, error: pgError("23505") }, { op: "test" })).toThrow(AppError);
    try {
      unwrap({ data: null, error: pgError("23505") }, { op: "test" });
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).kind).toBe("conflict");
    }
  });

  it("42501 classifies as forbidden", () => {
    try {
      unwrap({ data: null, error: pgError("42501") }, { op: "test" });
      expect.unreachable();
    } catch (err) {
      expect((err as AppError).kind).toBe("forbidden");
    }
  });

  it("throws Next's not-found signal for a 'not found' Postgres code (22P02/PGRST116)", () => {
    // notFound() throws with digest "NEXT_HTTP_ERROR_FALLBACK;404" rather
    // than returning -- this is the behavior unwrap() relies on to short-
    // circuit reads keyed by an id from the URL.
    expect(() => unwrap({ data: null, error: pgError("PGRST116") }, { op: "test" })).toThrow();
  });

  it("null data with no error and no mutation flag is treated as not-found", () => {
    expect(() => unwrap({ data: null, error: null }, { op: "test" })).toThrow();
  });

  it("null data with no error and mutation:true throws forbidden -- the RLS WITH CHECK silent-deny case", () => {
    try {
      unwrap({ data: null, error: null }, { op: "test", mutation: true });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).kind).toBe("forbidden");
    }
  });
});

describe("unwrapMaybe", () => {
  it("returns null for a not_found-classified error instead of throwing", () => {
    expect(unwrapMaybe({ data: null, error: pgError("PGRST116") }, { op: "test" })).toBeNull();
  });

  it("returns null when there is genuinely no row", () => {
    expect(unwrapMaybe({ data: null, error: null }, { op: "test" })).toBeNull();
  });

  it("still throws for a non-not-found error", () => {
    expect(() => unwrapMaybe({ data: null, error: pgError("42501") }, { op: "test" })).toThrow(AppError);
  });
});

describe("unwrapVoid", () => {
  it("does not throw on success regardless of data shape", () => {
    expect(() => unwrapVoid({ error: null }, { op: "test" })).not.toThrow();
  });

  it("throws AppError on a real error", () => {
    expect(() => unwrapVoid({ error: pgError("23514") }, { op: "test" })).toThrow(AppError);
  });
});

describe("unwrapList", () => {
  it("returns the array on success", () => {
    expect(unwrapList({ data: [1, 2, 3], error: null }, { op: "test" })).toEqual([1, 2, 3]);
  });

  it("returns an empty array for null data with no error -- an empty list is a valid, non-exceptional result", () => {
    expect(unwrapList({ data: null, error: null }, { op: "test" })).toEqual([]);
  });

  it("throws AppError on a real error", () => {
    expect(() => unwrapList({ data: null, error: pgError("57014") }, { op: "test" })).toThrow(AppError);
  });
});

describe("runAction", () => {
  it("wraps a successful call as { ok: true, data }", async () => {
    const result = await runAction(async () => "value");
    expect(result).toEqual({ ok: true, data: "value" });
  });

  it("converts a thrown AppError into { ok: false, error }", async () => {
    const result = await runAction(async () => {
      throw new AppError("forbidden", "nope");
    });
    expect(result).toEqual({ ok: false, error: "nope" });
  });

  it("re-throws anything that is not an AppError", async () => {
    await expect(
      runAction(async () => {
        throw new Error("unexpected bug");
      })
    ).rejects.toThrow("unexpected bug");
  });
});
