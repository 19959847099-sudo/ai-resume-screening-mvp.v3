import crypto from "node:crypto";
import { getDb } from "@/lib/db";

type Membership = {
  membership_token: string;
  short_code: string;
  expires_at: string;
  source_order_id: string;
  created_at: string;
  last_used_at: string | null;
};

export function findMembershipByOrder(orderId: string): Membership | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM memberships WHERE source_order_id = ? LIMIT 1")
    .get(orderId) as Membership | undefined;
  return row || null;
}

export function createMembership(orderId: string, expiresAt: string): Membership {
  const db = getDb();
  const existing = findMembershipByOrder(orderId);
  if (existing) {
    return existing;
  }

  const membershipToken = crypto.randomUUID();
  const shortCode = crypto.randomBytes(3).toString("hex").toUpperCase();
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO memberships
     (membership_token, short_code, expires_at, source_order_id, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(membershipToken, shortCode, expiresAt, orderId, createdAt);

  return db.prepare("SELECT * FROM memberships WHERE membership_token = ?").get(membershipToken) as Membership;
}

export function verifyMembershipToken(token: string): { valid: boolean; membership: Membership | null } {
  const db = getDb();
  const membership = db
    .prepare("SELECT * FROM memberships WHERE membership_token = ? LIMIT 1")
    .get(token) as Membership | undefined;

  if (!membership) {
    return { valid: false, membership: null };
  }

  if (new Date(membership.expires_at).getTime() < Date.now()) {
    return { valid: false, membership };
  }

  db.prepare("UPDATE memberships SET last_used_at = ? WHERE membership_token = ?").run(
    new Date().toISOString(),
    token
  );

  return { valid: true, membership };
}
