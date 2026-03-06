import { initDb } from "@/lib/db";
import { createMembership, findMembershipByOrder } from "@/lib/memberships";
import { getOrderById, setOrderPaid } from "@/lib/orders";

export const runtime = "nodejs";
initDb();

function calculateExpiry(): string {
  const next = new Date();
  next.setDate(next.getDate() + 30);
  return next.toISOString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = body?.order_id;
    const wxTransactionId = body?.wx_transaction_id;

    if (!orderId || typeof orderId !== "string") {
      return Response.json({ success: false, message: "订单号不能为空", data: null }, { status: 400 });
    }

    if (!wxTransactionId || typeof wxTransactionId !== "string") {
      return Response.json({ success: false, message: "微信交易号不能为空", data: null }, { status: 400 });
    }

    const order = getOrderById(orderId);
    if (!order) {
      return Response.json({ success: false, message: "订单不存在", data: null }, { status: 404 });
    }

    if (order.status === "PAID") {
      const existing = findMembershipByOrder(orderId);
      return Response.json({
        success: true,
        message: "",
        data: {
          order_id: orderId,
          membership_token: existing?.membership_token,
          short_code: existing?.short_code,
          expires_at: existing?.expires_at
        }
      });
    }

    const expiresAt = calculateExpiry();
    setOrderPaid(orderId, wxTransactionId, expiresAt);
    const membership = createMembership(orderId, expiresAt);

    return Response.json({
      success: true,
      message: "",
      data: {
        order_id: orderId,
        membership_token: membership.membership_token,
        short_code: membership.short_code,
        expires_at: membership.expires_at
      }
    });
  } catch {
    return Response.json({ success: false, message: "支付回调处理失败", data: null }, { status: 500 });
  }
}
