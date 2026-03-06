import { initDb } from "@/lib/db";
import { createMembership, findMembershipByOrder } from "@/lib/memberships";
import { getOrderById, setOrderPaid } from "@/lib/orders";
import {
  decryptNotifyResource,
  isWechatPayMock,
  verifyNotifySignature,
  type WechatPayNotifyPayload,
  type WechatPayTransaction
} from "@/lib/wechatpay";

export const runtime = "nodejs";
initDb();

function calculateExpiryByPlan(plan: string): string {
  const next = new Date();

  if (plan === "7d") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setDate(next.getDate() + 30);
  }

  return next.toISOString();
}

function buildSuccessMembershipPayload(orderId: string) {
  const existing = findMembershipByOrder(orderId);
  return {
    order_id: orderId,
    membership_token: existing?.membership_token,
    short_code: existing?.short_code,
    expires_at: existing?.expires_at
  };
}

async function handleMockNotify(request: Request) {
  const body = await request.json();
  const orderId = body?.order_id;
  const wxTransactionId = body?.wx_transaction_id;

  if (!orderId || typeof orderId !== "string") {
    return Response.json(
      { success: false, message: "订单号不能为空", data: null },
      { status: 400 }
    );
  }

  if (!wxTransactionId || typeof wxTransactionId !== "string") {
    return Response.json(
      { success: false, message: "微信交易号不能为空", data: null },
      { status: 400 }
    );
  }

  const order = getOrderById(orderId);
  if (!order) {
    return Response.json(
      { success: false, message: "订单不存在", data: null },
      { status: 404 }
    );
  }

  if (order.status === "PAID") {
    return Response.json({
      success: true,
      message: "",
      data: buildSuccessMembershipPayload(orderId)
    });
  }

  const expiresAt = calculateExpiryByPlan(order.plan);
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
}

async function handleRealNotify(request: Request) {
  const rawBody = await request.text();

  const signatureOk = verifyNotifySignature(rawBody, request.headers);
  if (!signatureOk) {
    return Response.json(
      { code: "FAIL", message: "签名验证失败" },
      { status: 401 }
    );
  }

  const payload = JSON.parse(rawBody) as WechatPayNotifyPayload;
  const resourceText = decryptNotifyResource(payload.resource);
  const transaction = JSON.parse(resourceText) as WechatPayTransaction;

  if (transaction.trade_state !== "SUCCESS") {
    return new Response(null, { status: 204 });
  }

  const orderId = transaction.out_trade_no;
  const wxTransactionId = transaction.transaction_id;

  if (!orderId || !wxTransactionId) {
    return Response.json(
      { code: "FAIL", message: "回调数据缺失" },
      { status: 400 }
    );
  }

  const order = getOrderById(orderId);
  if (!order) {
    return Response.json(
      { code: "FAIL", message: "订单不存在" },
      { status: 404 }
    );
  }

  if (transaction.amount?.total !== order.amount) {
    return Response.json(
      { code: "FAIL", message: "订单金额不匹配" },
      { status: 400 }
    );
  }

  if (order.status === "PAID") {
    return new Response(null, { status: 204 });
  }

  const expiresAt = calculateExpiryByPlan(order.plan);
  setOrderPaid(orderId, wxTransactionId, expiresAt);

  const existing = findMembershipByOrder(orderId);
  if (!existing) {
    createMembership(orderId, expiresAt);
  }

  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  try {
    if (isWechatPayMock()) {
      return handleMockNotify(request);
    }

    return handleRealNotify(request);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "支付回调处理失败";

    return Response.json(
      { code: "FAIL", message },
      { status: 500 }
    );
  }
}