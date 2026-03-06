import Link from "next/link";
import Pricing from "@/components/Pricing";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">AI 简历筛选</h1>
        <p className="max-w-2xl text-gray-600">粘贴简历与岗位描述，立即获得匹配分析与优化建议。</p>
        <Link className="inline-flex rounded-xl bg-black px-5 py-3 text-white shadow-sm" href="/analyze">
          开始分析
        </Link>
      </section>
      <Pricing />
    </div>
  );
}
