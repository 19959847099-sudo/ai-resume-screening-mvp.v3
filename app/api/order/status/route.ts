import { initDb } from "@/lib/db";
import { getOrderById } from "@/lib/orders";
import { findMembershipByOrder } from "@/lib/memberships";

export const runtime = "nodejs";
initDb();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = body?.order_id;
    if (!orderId || typeof orderId !== "string") {
      return Response.json({ success: false, message: "订单号不能为空", data: null }, { status: 400 });
    }

    const order = getOrderById(orderId);
    if (!order) {
      return Response.json({ success: false, message: "订单不存在", data: null }, { status: 404 });
    }

    const membership = findMembershipByOrder(orderId);

    return Response.json({
      success: true,
      message: "",
      data: {
        order_id: order.order_id,
        status: order.status,
        code_url: order.code_url,
        paid_at: order.paid_at,
        expires_at: order.membership_expires_at,
        membership_token: membership?.membership_token,
        short_code: membership?.short_code
      }
    });
  } catch {
    return Response.json({ success: false, message: "查询订单状态失败", data: null }, { status: 500 });
  }
}
