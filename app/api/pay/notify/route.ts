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
import { logError, logInfo, logWarn } from "@/lib/logger";

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

  logInfo("pay/notify", "收到 mock 支付回调", { orderId, wxTransactionId });

  if (!orderId || typeof orderId !== "string") {
    logWarn("pay/notify", "mock 回调订单号为空或非法", { orderId });
    return Response.json(
      { success: false, message: "订单号不能为空", data: null },
      { status: 400 }
    );
  }

  if (!wxTransactionId || typeof wxTransactionId !== "string") {
    logWarn("pay/notify", "mock 回调微信交易号为空或非法", { orderId, wxTransactionId });
    return Response.json(
      { success: false, message: "微信交易号不能为空", data: null },
      { status: 400 }
    );
  }

  const order = getOrderById(orderId);
  if (!order) {
    logWarn("pay/notify", "mock 回调订单不存在", { orderId });
    return Response.json(
      { success: false, message: "订单不存在", data: null },
      { status: 404 }
    );
  }

  if (order.status === "PAID") {
    logInfo("pay/notify", "mock 回调命中已支付订单，直接返回", { orderId });
    return Response.json({
      success: true,
      message: "",
      data: buildSuccessMembershipPayload(orderId)
    });
  }

  const expiresAt = calculateExpiryByPlan(order.plan);
  setOrderPaid(orderId, wxTransactionId, expiresAt);
  const membership = createMembership(orderId, expiresAt);

  logInfo("pay/notify", "mock 支付处理成功", {
    orderId,
    wxTransactionId,
    expiresAt,
    shortCode: membership.short_code
  });

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
  logInfo("pay/notify", "收到 real 支付回调");

  const signatureOk = verifyNotifySignature(rawBody, request.headers);
  if (!signatureOk) {
    logWarn("pay/notify", "微信回调验签失败");
    return Response.json(
      { code: "FAIL", message: "签名验证失败" },
      { status: 401 }
    );
  }

  logInfo("pay/notify", "微信回调验签通过");

  const payload = JSON.parse(rawBody) as WechatPayNotifyPayload;
  const resourceText = decryptNotifyResource(payload.resource);
  const transaction = JSON.parse(resourceText) as WechatPayTransaction;

  logInfo("pay/notify", "微信回调解密成功", {
    out_trade_no: transaction.out_trade_no,
    transaction_id: transaction.transaction_id,
    trade_state: transaction.trade_state
  });

  if (transaction.trade_state !== "SUCCESS") {
    logInfo("pay/notify", "交易状态非 SUCCESS，忽略", {
      out_trade_no: transaction.out_trade_no,
      trade_state: transaction.trade_state
    });
    return new Response(null, { status: 204 });
  }

  const orderId = transaction.out_trade_no;
  const wxTransactionId = transaction.transaction_id;

  if (!orderId || !wxTransactionId) {
    logWarn("pay/notify", "回调关键字段缺失", { orderId, wxTransactionId });
    return Response.json(
      { code: "FAIL", message: "回调数据缺失" },
      { status: 400 }
    );
  }

  const order = getOrderById(orderId);
  if (!order) {
    logWarn("pay/notify", "回调订单不存在", { orderId });
    return Response.json(
      { code: "FAIL", message: "订单不存在" },
      { status: 404 }
    );
  }

  if (transaction.amount?.total !== order.amount) {
    logWarn("pay/notify", "订单金额不匹配", {
      orderId,
      orderAmount: order.amount,
      callbackAmount: transaction.amount?.total
    });
    return Response.json(
      { code: "FAIL", message: "订单金额不匹配" },
      { status: 400 }
    );
  }

  if (order.status === "PAID") {
    logInfo("pay/notify", "订单已支付，幂等返回", { orderId });
    return new Response(null, { status: 204 });
  }

  const expiresAt = calculateExpiryByPlan(order.plan);
  setOrderPaid(orderId, wxTransactionId, expiresAt);

  const existing = findMembershipByOrder(orderId);
  if (!existing) {
    createMembership(orderId, expiresAt);
    logInfo("pay/notify", "会员创建成功", { orderId, expiresAt });
  } else {
    logInfo("pay/notify", "会员已存在，跳过创建", { orderId });
  }

  logInfo("pay/notify", "real 支付处理成功", {
    orderId,
    wxTransactionId,
    expiresAt
  });

  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  try {
    if (isWechatPayMock()) {
      return handleMockNotify(request);
    }

    return handleRealNotify(request);
  } catch (error) {
    logError("pay/notify", "支付回调处理失败", {
      error: error instanceof Error ? error.message : String(error)
    });

    const message =
      error instanceof Error ? error.message : "支付回调处理失败";

    return Response.json(
      { code: "FAIL", message },
      { status: 500 }
    );
  }
}