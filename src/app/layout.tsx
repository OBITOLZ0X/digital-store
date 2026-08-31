import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: { default: "DigitalStore — Premium Digital Products", template: "%s | DigitalStore" },
  description: "Premium digital marketplace — subscriptions, IPTV, software keys, gift cards. Instant delivery, wallet payments.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
