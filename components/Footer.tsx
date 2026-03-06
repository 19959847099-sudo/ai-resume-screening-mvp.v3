import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-gray-500">
        <p>简历筛选服务</p>
        <div className="flex gap-4">
          <Link href="/legal/terms">服务条款</Link>
          <Link href="/legal/privacy">隐私政策</Link>
          <Link href="/legal/refund">退款说明</Link>
          <Link href="/legal/contact">联系我们</Link>
        </div>
      </div>
    </footer>
  );
}
