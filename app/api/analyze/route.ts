import { analyzeResume } from "@/lib/deepseek";
import { initDb } from "@/lib/db";
import { verifyMembershipToken } from "@/lib/memberships";

export const runtime = "nodejs";
initDb();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resumeText = typeof body?.resume_text === "string" ? body.resume_text.trim() : "";
    const jdText = typeof body?.jd_text === "string" ? body.jd_text.trim() : "";
    const isFull = body?.is_full === true;
    const membershipToken = typeof body?.membership_token === "string" ? body.membership_token : "";

    if (!resumeText || !jdText) {
      return Response.json({ success: false, message: "简历内容与岗位描述不能为空", data: null }, { status: 400 });
    }

    let canUseFull = false;
    if (membershipToken) {
      canUseFull = verifyMembershipToken(membershipToken).valid;
    }

    const result = await analyzeResume(resumeText, jdText, isFull && canUseFull);

    const normalized = {
      score: Number(result?.score) || 70,
      summary: String(result?.summary || "整体匹配度中等，建议进一步优化表达。"),
      top_risks: Array.isArray(result?.top_risks)
        ? result.top_risks.slice(0, 3).map((x: unknown) => String(x))
        : ["缺少量化成果。", "岗位关键词覆盖不足。", "项目影响描述偏弱。"]
    } as Record<string, unknown>;

    if (isFull && canUseFull) {
      normalized.detailed_risks = Array.isArray(result?.detailed_risks)
        ? result.detailed_risks.map((x: unknown) => String(x))
        : [];
      normalized.rewrite_suggestions = Array.isArray(result?.rewrite_suggestions)
        ? result.rewrite_suggestions.map((x: unknown) => String(x))
        : [];
      normalized.hr_commentary = String(result?.hr_commentary || "建议继续完善后进入下一轮评估。");
    }

    return Response.json({ success: true, message: "", data: normalized });
  } catch {
    return Response.json({ success: false, message: "分析失败，请稍后重试", data: null }, { status: 500 });
  }
}
