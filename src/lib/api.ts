import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/session";
import { RateLimitError } from "@/lib/security/rate-limit";

/** Wraps a route handler with consistent JSON errors that never leak internals. */
export function handle<T extends unknown[]>(fn: (...args: T) => Promise<Response>) {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof RateLimitError) return NextResponse.json({ error: e.message }, { status: 429 });
      if (e instanceof ZodError) return NextResponse.json({ error: "Data tidak sah", issues: e.issues.map((i) => i.path.join(".")) }, { status: 400 });
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Ralat pelayan. Sila cuba lagi." }, { status: 500 });
    }
  };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
