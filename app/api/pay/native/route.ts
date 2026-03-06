import { initDb } from "@/lib/db";
import { getOrderById, setOrderPending } from "@/lib/orders";
import { buildMockCodeUrl, isWechatPayMock } from "@/lib/wechatpay";

export const runtime = "nodejs";
initDb();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = body?.order_id;
    if (!orderId || typeof orderId !== "string") {
      return Response.json({ success: false, message: "订单号不能为空", data: null }, { status: 400 });
    }

    const current = getOrderById(orderId);
    if (!current) {
      return Response.json({ success: false, message: "订单不存在", data: null }, { status: 404 });
    }

    const codeUrl = isWechatPayMock()
      ? buildMockCodeUrl(orderId)
      : `weixin://wxpay/bizpayurl?pr=${encodeURIComponent(orderId)}`;

    const updated = current.status === "CREATED" ? setOrderPending(orderId, codeUrl) : current;

    return Response.json({
      success: true,
      message: "",
      data: {
        order_id: orderId,
        status: updated?.status,
        code_url: updated?.code_url || codeUrl
      }
    });
  } catch {
    return Response.json({ success: false, message: "生成支付二维码失败", data: null }, { status: 500 });
  }
}
