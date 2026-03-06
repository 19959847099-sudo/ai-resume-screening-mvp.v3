import { initDb } from "@/lib/db";
import { createOrder } from "@/lib/orders";

export const runtime = "nodejs";
initDb();

type Plan = "7d" | "30d";

const PLAN_AMOUNT_MAP: Record<Plan, number> = {
  "7d": 900,
  "30d": 1900
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPlan = body?.plan;

    if (rawPlan !== "7d" && rawPlan !== "30d") {
      return Response.json({ success: false, message: "套餐参数无效", data: null }, { status: 400 });
    }

    const plan: Plan = rawPlan;
    const amount = PLAN_AMOUNT_MAP[plan];
    const order = createOrder(plan, amount);

    return Response.json({
      success: true,
      message: "",
      data: {
        order_id: order.order_id,
        amount: order.amount
      }
    });
  } catch {
    return Response.json({ success: false, message: "创建订单失败", data: null }, { status: 500 });
  }
}