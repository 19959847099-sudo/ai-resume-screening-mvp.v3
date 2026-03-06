type Result = {
  score: number;
  summary: string;
  top_risks: string[];
  detailed_risks?: string[];
  rewrite_suggestions?: string[];
  hr_commentary?: string;
};

type Props = {
  result: Result;
  paidLocked: boolean;
  onUnlock: () => void;
};

export default function ResultCard({ result, paidLocked, onUnlock }: Props) {
  const paidContent = (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">详细淘汰风险</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700">
          {(result.detailed_risks || ["解锁后查看更完整的淘汰风险分析"]).map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900">简历改写建议</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700">
          {(result.rewrite_suggestions || ["解锁后查看更具体的简历改写建议"]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900">AI 模拟 HR 评语</h3>
        <p className="mt-3 text-sm leading-6 text-gray-700">
          {result.hr_commentary || "解锁后查看完整 HR 评语"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
        <p className="text-sm text-gray-500">匹配分数</p>
        <div className="mt-2 flex items-end gap-2">
          <p className="text-5xl font-bold leading-none text-gray-900">{result.score}</p>
          <p className="pb-1 text-sm text-gray-500">/ 100</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-gray-900">结果摘要</h3>
        <p className="text-sm leading-6 text-gray-700">{result.summary}</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-gray-900">初筛风险提示</h3>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700">
          {result.top_risks.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900">完整 HR 分析报告</p>
          <p className="mt-1 text-sm text-gray-500">
            包含详细淘汰风险、简历改写建议与 AI 模拟 HR 评语
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5">
          {paidLocked ? (
            <>
              <div className="pointer-events-none opacity-50 blur-[1.5px]">{paidContent}</div>

              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/75 px-6 text-center backdrop-blur-sm">
                <p className="max-w-md text-sm leading-6 text-gray-700">
                  解锁完整报告后，你可以看到更具体的淘汰原因、改写建议与 AI 模拟 HR 评语。
                </p>
                <button
                  className="mt-4 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                  onClick={onUnlock}
                >
                  查看完整淘汰原因与优化建议
                </button>
              </div>
            </>
          ) : (
            paidContent
          )}
        </div>
      </div>
    </div>
  );
}