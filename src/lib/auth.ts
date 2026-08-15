import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, agencies, roles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "recruitment-agency-os-default-secure-secret-key-2026";
export const SESSION_COOKIE_NAME = "ra_session";

export type UserRole = 
  | "SUPER_ADMIN" 
  | "AGENCY_OWNER" 
  | "MANAGER" 
  | "RECRUITMENT_OFFICER" 
  | "DOCUMENT_OFFICER" 
  | "ACCOUNTANT";

export interface SessionPayload {
  userId: number;
  agencyId: number;
  email: string;
  name: string;
  role: UserRole;
  agencySlug?: string;
}

// 1. Password Hashing & Verification
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// 2. Token Signing & Verification (HMAC-SHA256)
export function createSessionToken(payload: SessionPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days expiration
  };
  const body = Buffer.from(JSON.stringify(data)).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return {
      userId: payload.userId,
      agencyId: payload.agencyId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      agencySlug: payload.agencySlug,
    };
  } catch (error) {
    return null;
  }
}

// 3. RBAC Permission Matrix & Helpers
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ["*"],
  AGENCY_OWNER: [
    "agency:read", "agency:update",
    "users:create", "users:read", "users:update", "users:delete",
    "workers:create", "workers:read", "workers:update", "workers:delete",
    "documents:create", "documents:read", "documents:update", "documents:delete",
    "clients:create", "clients:read", "clients:update", "clients:delete",
    "orders:create", "orders:read", "orders:update", "orders:delete",
    "contracts:create", "contracts:read", "contracts:update", "contracts:delete",
    "visas:create", "visas:read", "visas:update", "visas:delete",
    "travel:create", "travel:read", "travel:update", "travel:delete",
    "finance:create", "finance:read", "finance:update", "finance:delete",
    "reports:read",
  ],
  MANAGER: [
    "agency:read",
    "users:read",
    "workers:create", "workers:read", "workers:update",
    "documents:create", "documents:read", "documents:update",
    "clients:create", "clients:read", "clients:update",
    "orders:create", "orders:read", "orders:update",
    "contracts:create", "contracts:read", "contracts:update",
    "visas:create", "visas:read", "visas:update",
    "travel:create", "travel:read", "travel:update",
    "finance:read",
    "reports:read",
  ],
  RECRUITMENT_OFFICER: [
    "workers:create", "workers:read", "workers:update",
    "clients:read",
    "orders:read", "orders:update",
    "contracts:create", "contracts:read",
    "reports:read",
  ],
  DOCUMENT_OFFICER: [
    "workers:read",
    "documents:create", "documents:read", "documents:update",
    "visas:create", "visas:read", "visas:update",
    "travel:create", "travel:read", "travel:update",
  ],
  ACCOUNTANT: [
    "clients:read",
    "orders:read",
    "contracts:read",
    "finance:create", "finance:read", "finance:update", "finance:delete",
    "reports:read",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  return allowedRoles.includes(userRole);
}

// 4. Current User & Session Utilities for API/Server Actions
export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    // Check if called within server action / api with headers
    const headersList = headers();
    const headerAgencyId = headersList.get("x-agency-id");
    const headerUserId = headersList.get("x-user-id");
    const headerUserRole = headersList.get("x-user-role") as UserRole;
    const headerUserEmail = headersList.get("x-user-email");

    if (headerAgencyId && headerUserId && headerUserRole) {
      return {
        userId: parseInt(headerUserId, 10),
        agencyId: parseInt(headerAgencyId, 10),
        role: headerUserRole,
        email: headerUserEmail || "",
        name: headersList.get("x-user-name") || "",
      };
    }

    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    return verifySessionToken(token);
  } catch (error) {
    return null;
  }
}

export async function requireAuth(requiredPermission?: string): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized: No valid session found");
  }

  if (requiredPermission && !hasPermission(session.role, requiredPermission)) {
    throw new Error(`Forbidden: Insufficient permissions (${requiredPermission} required)`);
  }

  return session;
}

// 5. Multi-Tenant Data Isolation & Query Enforcer Helpers
export function enforceTenant<T extends Record<string, any>>(data: T, agencyId: number): T & { agencyId: number } {
  return {
    ...data,
    agencyId,
  };
}

export async function getTenantId(): Promise<number> {
  const session = await requireAuth();
  if (session.role === "SUPER_ADMIN") {
    // SUPER_ADMIN can operate across tenants, but requires active agency context if needed
    // Defaults to session agencyId
  }
  return session.agencyId;
}
