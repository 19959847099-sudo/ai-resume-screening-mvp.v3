import { initDb } from "@/lib/db";
import { getOrderById, setOrderPending } from "@/lib/orders";
import {
  buildMockCodeUrl,
  createNativeTransaction,
  isWechatPayMock
} from "@/lib/wechatpay";
import { logError, logInfo, logWarn } from "@/lib/logger";

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

    logInfo("pay/native", "收到创建支付二维码请求", { orderId });

    if (!orderId || typeof orderId !== "string") {
      logWarn("pay/native", "订单号为空或非法", { orderId });
      return Response.json(
        { success: false, message: "订单号不能为空", data: null },
        { status: 400 }
      );
    }

    const current = getOrderById(orderId);
    if (!current) {
      logWarn("pay/native", "订单不存在", { orderId });
      return Response.json(
        { success: false, message: "订单不存在", data: null },
        { status: 404 }
      );
    }

    logInfo("pay/native", "查询到订单", {
      orderId,
      status: current.status,
      plan: current.plan,
      amount: current.amount,
      mock: isWechatPayMock()
    });

    if (current.status === "PAID") {
      logInfo("pay/native", "订单已支付，直接返回", { orderId });
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
      logInfo("pay/native", "使用 mock code_url", { orderId, codeUrl });
    } else {
      logInfo("pay/native", "准备调用微信 Native 下单", { orderId });
      const nativeResult = await createNativeTransaction({
        orderId,
        description: buildOrderDescription(current.plan),
        amount: current.amount
      });
      codeUrl = nativeResult.code_url;
      logInfo("pay/native", "微信 Native 下单成功", { orderId, codeUrl });
    }

    const updated =
      current.status === "CREATED" && codeUrl
        ? setOrderPending(orderId, codeUrl)
        : current;

    logInfo("pay/native", "返回支付二维码", {
      orderId,
      status: updated?.status || current.status
    });

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
    logError("pay/native", "生成支付二维码失败", {
      error: error instanceof Error ? error.message : String(error)
    });

    const message =
      error instanceof Error ? error.message : "生成支付二维码失败";

    return Response.json(
      { success: false, message, data: null },
      { status: 500 }
    );
  }
}