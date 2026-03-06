"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TextArea from "@/components/TextArea";

export default function AnalyzePage() {
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async () => {
    setError("");
    if (!resumeText.trim() || !jdText.trim()) {
      setError("请完整填写简历与岗位描述");
      return;
    }

    localStorage.setItem("resume_text", resumeText);
    localStorage.setItem("jd_text", jdText);

    setLoading(true);
    try {
      const token = localStorage.getItem("membership_token") || undefined;
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          jd_text: jdText,
          is_full: false,
          membership_token: token
        })
      });
      const payload = await response.json();
      if (!payload.success) {
        setError(payload.message || "分析失败");
        return;
      }

      localStorage.setItem("free_result", JSON.stringify(payload.data));
      router.push("/result");
    } catch {
      setError("网络异常，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">开始分析</h1>
      <TextArea
        label="简历内容"
        value={resumeText}
        onChange={setResumeText}
        placeholder="请粘贴完整简历文本"
      />
      <TextArea
        label="岗位描述"
        value={jdText}
        onChange={setJdText}
        placeholder="请粘贴岗位 JD 文本"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        className="rounded-xl bg-black px-5 py-3 text-white shadow-sm disabled:opacity-60"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? "分析中..." : "立即分析"}
      </button>
    </div>
  );
}
