import { initDb } from "@/lib/db";
import { getOrderById, setOrderPending } from "@/lib/orders";
import {
  buildMockCodeUrl,
  createNativeTransaction,
  isWechatPayMock
} from "@/lib/wechatpay";

export const runtime = "nodejs";
initDb();

function buildOrderDescription(plan: string): string {
  if (plan === "7d") return "AI简历初筛工具-7天会员";
  if (plan === "30d") return "AI简历初筛工具-30天会员";
  return "AI简历初筛工具-会员";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = body?.order_id;

    if (!orderId || typeof orderId !== "string") {
      return Response.json(
        { success: false, message: "订单号不能为空", data: null },
        { status: 400 }
      );
    }

    const current = getOrderById(orderId);
    if (!current) {
      return Response.json(
        { success: false, message: "订单不存在", data: null },
        { status: 404 }
      );
    }

    if (current.status === "PAID") {
      return Response.json({
        success: true,
        message: "",
        data: {
          order_id: orderId,
          status: current.status,
          code_url: current.code_url
        }
      });
    }

    let codeUrl = current.code_url;

    if (isWechatPayMock()) {
      codeUrl = codeUrl || buildMockCodeUrl(orderId);
    } else {
      const nativeResult = await createNativeTransaction({
        orderId,
        description: buildOrderDescription(current.plan),
        amount: current.amount
      });
      codeUrl = nativeResult.code_url;
    }

    const updated =
      current.status === "CREATED" && codeUrl
        ? setOrderPending(orderId, codeUrl)
        : current;

    return Response.json({
      success: true,
      message: "",
      data: {
        order_id: orderId,
        status: updated?.status || current.status,
        code_url: updated?.code_url || codeUrl || null
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "生成支付二维码失败";

    return Response.json(
      { success: false, message, data: null },
      { status: 500 }
    );
  }
}