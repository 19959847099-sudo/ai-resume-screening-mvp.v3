import crypto from "node:crypto";
import { getDb } from "@/lib/db";

export type OrderStatus = "CREATED" | "PENDING" | "PAID" | "FAILED";

export type OrderRecord = {
  order_id: string;
  plan: string;
  amount: number;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  membership_expires_at: string | null;
  wx_transaction_id: string | null;
  code_url: string | null;
};

export function createOrder(plan: string, amount: number): OrderRecord {
  const db = getDb();
  const orderId = `ord_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(
    `INSERT INTO orders (order_id, plan, amount, status, created_at)
     VALUES (?, ?, ?, 'CREATED', ?)`
  );

  stmt.run(orderId, plan, amount, createdAt);
  return getOrderById(orderId)!;
}

export function getOrderById(orderId: string): OrderRecord | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM orders WHERE order_id = ?").get(orderId) as OrderRecord | undefined;
  return row || null;
}

export function setOrderPending(orderId: string, codeUrl: string): OrderRecord | null {
  const db = getDb();
  const order = getOrderById(orderId);
  if (!order || order.status !== "CREATED") {
    return order;
  }

  db.prepare("UPDATE orders SET status = 'PENDING', code_url = ? WHERE order_id = ?").run(codeUrl, orderId);
  return getOrderById(orderId);
}

export function setOrderPaid(
  orderId: string,
  wxTransactionId: string,
  membershipExpiresAt: string
): OrderRecord | null {
  const db = getDb();
  const paidAt = new Date().toISOString();

  db.prepare(
    `UPDATE orders
     SET status = 'PAID', paid_at = ?, wx_transaction_id = ?, membership_expires_at = ?
     WHERE order_id = ?`
  ).run(paidAt, wxTransactionId, membershipExpiresAt, orderId);

  return getOrderById(orderId);
}
