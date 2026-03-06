import "@/app/globals.css";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI简历筛选",
  description: "极简风格的简历与岗位匹配分析服务"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
