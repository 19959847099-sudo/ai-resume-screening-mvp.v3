export default function Pricing() {
  return (
    <section className="space-y-6 rounded-xl border border-gray-200 p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">会员解锁完整分析</h2>
        <p className="mt-2 text-gray-600">
          免费版包含匹配分数、摘要与三条主要风险。
        </p>
        <p className="text-gray-600">会员可解锁完整 HR 初筛分析报告。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">短期体验</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">7 天会员</p>

          <p className="mt-3 text-4xl font-bold text-gray-900">¥9.9</p>

          <ul className="mt-4 space-y-1 text-sm text-gray-600">
            <li>解锁完整风险分析</li>
            <li>查看 AI 改写建议</li>
            <li>查看 HR 模拟评语</li>
          </ul>
        </div>

        <div className="rounded-xl border border-black p-5 shadow-sm">
          <p className="text-sm text-gray-500">推荐</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">30 天会员</p>

          <p className="mt-3 text-4xl font-bold text-gray-900">¥19</p>

          <ul className="mt-4 space-y-1 text-sm text-gray-600">
            <li>解锁完整风险分析</li>
            <li>查看 AI 改写建议</li>
            <li>查看 HR 模拟评语</li>
            <li className="font-medium text-black">性价比更高</li>
          </ul>
        </div>
      </div>
    </section>
  );
}