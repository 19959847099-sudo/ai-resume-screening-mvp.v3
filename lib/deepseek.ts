import { cleanText, parseJsonSafely } from "@/lib/security";

function buildMockResult(isFull: boolean) {
  const base = {
    score: 74,
    summary: "候选人具备相关经历，但关键项目缺少量化成果支撑。",
    top_risks: ["近期经历成果量化不足。", "核心技能深度描述不清晰。", "简历结构与目标岗位映射不够明确。"]
  };

  if (!isFull) {
    return base;
  }

  return {
    ...base,
    detailed_risks: [
      "项目描述偏任务罗列，缺少业务结果。",
      "跨团队协作中的主导性证据不足。",
      "技术栈描述缺少生产场景与复杂度说明。"
    ],
    rewrite_suggestions: [
      "每条项目经历补充至少一个量化指标。",
      "将与目标岗位最相关的成果前置展示。",
      "采用行动-结果表达方式提升说服力。"
    ],
    hr_commentary: "候选人整体可进入后续评估，建议先优化简历中的业务影响表达。"
  };
}

export async function analyzeResume(
  resumeText: string,
  jdText: string,
  isFull: boolean
): Promise<any> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return buildMockResult(isFull);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  const prompt = [
    "You are an ATS and HR analysis assistant.",
    "Return ONLY valid JSON with no markdown and no extra words.",
    "For free mode output keys: score, summary, top_risks.",
    "For full mode output keys: score, summary, top_risks, detailed_risks, rewrite_suggestions, hr_commentary.",
    "All arrays must contain meaningful non-empty strings.",
    `Mode: ${isFull ? "full" : "free"}`,
    `Resume:\n${cleanText(resumeText)}`,
    `Job Description:\n${cleanText(jdText)}`
  ].join("\n\n");

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });

    clearTimeout(timeout);
    if (!response.ok) {
      return buildMockResult(isFull);
    }

    const payload = await response.json();
    const content: string | undefined = payload?.choices?.[0]?.message?.content;
    if (!content) {
      return buildMockResult(isFull);
    }

    const parsed = parseJsonSafely<any>(content);
    if (!parsed) {
      return buildMockResult(isFull);
    }

    return parsed;
  } catch {
    clearTimeout(timeout);
    return buildMockResult(isFull);
  }
}
