"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SuccessData = {
  order_id: string;
  status: string;
  membership_token?: string;
  short_code?: string;
  expires_at?: string;
};

export default function SuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("order_id") || "";
  const [data, setData] = useState<SuccessData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const load = async () => {
      try {
        const response = await fetch("/api/order/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId })
        });
        const payload = await response.json();
        if (!payload.success) {
          setError(payload.message || "订单读取失败");
          return;
        }

        setData(payload.data);
        if (payload.data.membership_token) {
          localStorage.setItem("membership_token", payload.data.membership_token);
        }
      } catch {
        setError("订单读取失败");
      }
    };

    void load();
  }, [orderId]);

  const backToResult = () => {
    router.push("/result");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">支付成功</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="rounded-xl border border-gray-200 p-6 shadow-sm">
        <p className="text-sm text-gray-500">到期时间</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{data?.expires_at || "-"}</p>
      </div>
      <div className="rounded-xl bg-gray-100 p-4 font-mono text-sm text-gray-700">
        {data?.short_code || "-"}
      </div>
      <button className="rounded-xl bg-black px-5 py-3 text-white shadow-sm" onClick={backToResult}>
        返回结果页
      </button>
    </div>
  );
}
