import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { readStore } from "@/lib/store";
import { getLang } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export async function generateMetadata(): Promise<Metadata> {
  let siteName = "DigitalStore";
  let tagline = "Premium digital products — order via WhatsApp or Telegram. No account needed.";
  let siteIcon: string | null = null;
  let lang: 'en' | 'fr' = 'en'
  try {
    const store = await readStore();
    if (store.settings?.siteName) siteName = store.settings.siteName;
    const heroSub = store.settings?.heroSubtitle;
    if (store.settings?.tagline?.trim()) tagline = store.settings.tagline.trim();
    if (heroSub) {
      const sub = typeof heroSub === 'object' && heroSub !== null ? heroSub[lang] || heroSub.en : String(heroSub);
      if (sub) tagline = sub;
    }
    siteIcon = store.settings?.siteIcon || null;
    lang = store.settings?.defaultLang === 'fr' ? 'fr' : 'en';
  } catch {}

  return {
    title: { default: `${siteName} — ${tagline.slice(0, 60)}`, template: `%s | ${siteName}` },
    description: tagline,
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    applicationName: siteName,
    icons: siteIcon ? { icon: siteIcon, apple: siteIcon } : { icon: '/favicon.ico', apple: '/icon-512.png' },
    openGraph: {
      siteName,
      title: siteName,
      description: tagline,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: siteName,
      description: tagline,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let lang = 'en' as 'en' | 'fr'
  try { lang = await getLang() } catch {}
  return (
    <html lang={lang} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-zinc-100 font-[family-name:var(--font-inter)]">{children}</body>
    </html>
  );
}