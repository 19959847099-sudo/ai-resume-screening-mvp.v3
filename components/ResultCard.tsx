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
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800">详细风险</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
          {(result.detailed_risks || ["解锁后查看详细风险分析"]).map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">改写建议</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
          {(result.rewrite_suggestions || ["解锁后查看简历改写建议"]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">HR 评语</h3>
        <p className="mt-1 text-gray-700">{result.hr_commentary || "解锁后查看完整 HR 评语"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 rounded-xl border border-gray-200 p-6 shadow-sm">
      <div>
        <p className="text-sm text-gray-500">匹配分数</p>
        <p className="text-4xl font-bold text-gray-900">{result.score}</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">结果摘要</h3>
        <p className="mt-1 text-gray-700">{result.summary}</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">主要风险</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
          {result.top_risks.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      </div>

      <div className="relative rounded-xl border border-gray-100 p-4">
        {paidLocked ? (
          <>
            <div className="pointer-events-none opacity-50 blur-[1px]">{paidContent}</div>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm">
              <button className="rounded-xl bg-black px-5 py-3 text-white shadow-sm" onClick={onUnlock}>
                解锁完整分析
              </button>
            </div>
          </>
        ) : (
          paidContent
        )}
      </div>
    </div>
  );
}
