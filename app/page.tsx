import Link from "next/link";
import Pricing from "@/components/Pricing";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-6 rounded-2xl bg-white py-6">
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-500">HR 视角模拟工具</p>

          <h1 className="max-w-4xl text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            AI 模拟 HR 初筛，
            <br />
            提前知道你的简历为什么会被刷掉
          </h1>

          <p className="max-w-2xl text-base leading-7 text-gray-600">
            粘贴简历与岗位描述，快速查看匹配评分、初筛风险与优化方向。
            免费可看基础结果，会员可解锁完整 HR 分析报告。
          </p>

          <p className="text-sm text-gray-500">已支持纯文本简历分析，无需上传附件</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            className="inline-flex rounded-xl bg-black px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            href="/analyze"
          >
            免费体验一次 HR 初筛
          </Link>
          <p className="text-sm text-gray-500">直接粘贴文本即可开始分析</p>
        </div>

        <div className="grid gap-4 pt-2 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-900">模拟初筛逻辑</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              从 HR 初筛角度判断简历与岗位描述的匹配程度。
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-900">快速发现风险点</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              免费查看匹配评分、结果摘要与三条主要风险。
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-900">解锁完整建议</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              查看详细淘汰原因、改写建议与 AI 模拟 HR 评语。
            </p>
          </div>
        </div>
      </section>

      <Pricing />
    </div>
  );
}