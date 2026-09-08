import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: { default: "DigitalStore — Premium Digital Products", template: "%s | DigitalStore" },
  description: "Premium digital products — subscriptions, IPTV, software keys, gift cards. Browse prices and order directly via WhatsApp or Telegram. No account needed.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-zinc-100 font-[family-name:var(--font-inter)]">{children}</body>
    </html>
  );
}
