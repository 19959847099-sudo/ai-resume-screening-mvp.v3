"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ResultCard from "@/components/ResultCard";

type ResultData = {
  score: number;
  summary: string;
  top_risks: string[];
  detailed_risks?: string[];
  rewrite_suggestions?: string[];
  hr_commentary?: string;
};

export default function ResultPage() {
  const router = useRouter();
  const [freeResult, setFreeResult] = useState<ResultData | null>(null);
  const [fullResult, setFullResult] = useState<ResultData | null>(null);
  const [error, setError] = useState("");
  const [loadingFull, setLoadingFull] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("free_result");
    if (raw) {
      setFreeResult(JSON.parse(raw));
    }

    const resumeText = localStorage.getItem("resume_text") || "";
    const jdText = localStorage.getItem("jd_text") || "";
    const membershipToken = localStorage.getItem("membership_token") || "";

    const tryUpgrade = async () => {
      if (!resumeText || !jdText || !membershipToken) {
        setLoadingFull(false);
        return;
      }

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume_text: resumeText,
            jd_text: jdText,
            is_full: true,
            membership_token: membershipToken
          })
        });
        const payload = await response.json();
        if (payload.success) {
          setFullResult(payload.data);
        }
      } catch {
        setError("自动升级失败，请稍后重试");
      } finally {
        setLoadingFull(false);
      }
    };

    void tryUpgrade();
  }, []);

  const displayResult = useMemo(() => fullResult || freeResult, [fullResult, freeResult]);

  const goToPay = async () => {
    try {
      const createResp = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "30d" })
      });
      const createPayload = await createResp.json();
      if (!createPayload.success) {
        setError(createPayload.message || "创建订单失败");
        return;
      }
      const orderId = createPayload.data.order_id as string;
      router.push(`/pay?order_id=${encodeURIComponent(orderId)}`);
    } catch {
      setError("创建订单失败");
    }
  };

  if (!displayResult) {
    return <p className="text-gray-600">暂无结果，请先完成分析</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">匹配度：{displayResult?.score} / 100</h1>
      <p className="text-sm text-gray-500">低于 60 分的简历，大概率会被 HR 刷掉。</p>
      
      <ResultCard result={displayResult} paidLocked={!fullResult} onUnlock={goToPay} />
      
      {loadingFull && <p className="text-sm text-gray-500">正在检查会员状态...</p>}
      
      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-sm text-gray-500">
        本分析由 AI 模拟 HR 初筛逻辑生成，仅供投递前参考，不代表真实招聘结果。
      </p>
    </div>
  );
}