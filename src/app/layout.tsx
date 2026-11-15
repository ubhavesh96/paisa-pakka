import type { Metadata, Viewport } from "next";
import { Inter, Mukta, Noto_Sans_Devanagari } from "next/font/google";
import { AppProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const noto = Noto_Sans_Devanagari({
  variable: "--font-noto",
  subsets: ["devanagari", "latin"],
});

const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["devanagari", "latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paisa Pakka",
  description: "Voice-first money companion: check scams, save on payday, get the schemes you’re owed.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#3442b8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hi" className={`${noto.variable} ${mukta.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
