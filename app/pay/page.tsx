"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";

type OrderData = {
  order_id: string;
  status: "CREATED" | "PENDING" | "PAID" | "FAILED";
  code_url: string | null;
};

function PayPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("order_id") || "";

  const [order, setOrder] = useState<OrderData | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [networkMsg, setNetworkMsg] = useState("");

  const curlCommand = useMemo(
    () =>
      `curl -X POST http://localhost:3000/api/pay/notify -H "Content-Type: application/json" -d '{"order_id":"${orderId}","wx_transaction_id":"MOCK_TX"}'`,
    [orderId]
  );

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const startPay = async () => {
      await fetch("/api/pay/native", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
    };

    const pollStatus = async () => {
      try {
        const response = await fetch("/api/order/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        });
        const payload = await response.json();

        if (!payload.success) {
          setNetworkMsg(payload.message || "重试中...");
          return;
        }

        setOrder(payload.data);
        setNetworkMsg("");

        if (payload.data.status === "PAID") {
          router.replace(`/success?order_id=${encodeURIComponent(orderId)}`);
        }
      } catch {
        setNetworkMsg("重试中...");
      }
    };

    void startPay();
    void pollStatus();

    const timer = window.setInterval(() => {
      void pollStatus();
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  }, [orderId, router]);

  useEffect(() => {
    if (!order?.code_url) {
      return;
    }

    let active = true;

    QRCode.toDataURL(order.code_url)
      .then((url) => {
        if (active) {
          setQrImage(url);
        }
      })
      .catch(() => {
        setNetworkMsg("重试中...");
      });

    return () => {
      active = false;
    };
  }, [order?.code_url]);

  const copyCurl = async () => {
    if (!curlCommand) {
      return;
    }
    await navigator.clipboard.writeText(curlCommand);
  };

  if (!orderId) {
    return <p className="text-red-600">缺少订单号</p>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold text-gray-900">订单支付</h1>

      <div className="rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-sm text-gray-500">订单号</p>
        <p className="mt-1 break-all font-mono text-sm text-gray-800">{orderId}</p>
      </div>

      <p className="text-sm text-gray-700">支付状态：{order?.status || "CREATED"}</p>

      {qrImage ? (
        <img src={qrImage} alt="支付二维码" className="h-56 w-56 rounded-xl border p-2" />
      ) : null}

      <button className="rounded-xl bg-black px-5 py-3 text-white shadow-sm" onClick={copyCurl}>
        复制 curl 命令
      </button>

      {networkMsg ? <p className="text-sm text-gray-500">{networkMsg}</p> : null}
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">支付页面加载中...</p>}>
      <PayPageContent />
    </Suspense>
  );
}