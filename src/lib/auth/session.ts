import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { sessions, users, rolePermissions } from "@/db/schema";
import { randomToken, sha256, hashIp } from "@/lib/security/crypto";
import { clientIp, userAgent } from "@/lib/security/request";
import { isProd } from "@/lib/env";
import type { Permission, RoleKey } from "./permissions";

export const SESSION_COOKIE = "hm_session";
const SESSION_DAYS = 14;

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: RoleKey;
  permissions: Set<Permission>;
};

export async function createSession(userId: number) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(sessions).values({
    id: sha256(token),
    userId,
    expiresAt,
    ipHash: hashIp(await clientIp()),
    userAgent: (await userAgent())?.slice(0, 300) ?? null,
  });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, phone: users.phone, role: users.role, status: users.status })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const u = rows[0];
  if (!u || u.status !== "active") return null;
  const perms = await db.select({ p: rolePermissions.permissionKey }).from(rolePermissions).where(eq(rolePermissions.roleKey, u.role));
  return { id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role, permissions: new Set(perms.map((r) => r.p as Permission)) };
});

export const can = (u: SessionUser | null, p: Permission) => !!u && u.permissions.has(p);

/** For pages: redirects to login when signed out, and to the right home when lacking permission. */
export async function requirePage(p: Permission, next = "/"): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!can(u, p)) redirect(homeFor(u));
  return u;
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function requirePermission(p: Permission): Promise<SessionUser> {
  const u = await currentUser();
  if (!u || !can(u, p)) throw new AuthError(u ? 403 : 401);
  return u;
}

export class AuthError extends Error {
  constructor(public status: 401 | 403) {
    super(status === 401 ? "Sila log masuk" : "Tiada kebenaran");
  }
}

export function homeFor(u: SessionUser): string {
  if (u.permissions.has("portal.partner")) return "/partner";
  if (u.permissions.has("portal.customer")) return "/portal";
  return "/admin";
}
