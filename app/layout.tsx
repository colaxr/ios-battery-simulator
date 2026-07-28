import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Screen Time Studio — iOS 屏幕时间截图模拟器",
  description: "按参考图生成 591 × 1280 像素的 iOS 屏幕时间截图。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
