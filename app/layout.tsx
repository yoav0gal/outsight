import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Outsight",
  description: "Advanced CBT Patient Management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  const locale = await getLocale();
  // Dynamically determine direction using native JS Intl API (fallback to ltr)
  const direction = (new Intl.Locale(locale) as any).getTextInfo?.().direction || (locale === 'he' ? 'rtl' : 'ltr');

  return (
    <html lang={locale} dir={direction} className={cn( jetbrainsMono.variable, "font-sans", inter.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DirectionProvider direction={direction as "ltr" | "rtl"}>
          <NextIntlClientProvider messages={messages}>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </NextIntlClientProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
