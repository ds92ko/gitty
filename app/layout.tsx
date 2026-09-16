import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gitty-widget.vercel.app"),
  title: "Gitty — GitHub 활동을 먹고 자라는 고양이",
  description:
    "GitHub 활동에 따라 모습과 감정이 변하는 README 고양이 위젯",
  openGraph: {
    title: "Gitty — GitHub 활동을 먹고 자라는 고양이",
    description:
      "GitHub 활동에 따라 모습과 감정이 변하는 README 고양이 위젯",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
