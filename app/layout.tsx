import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import ThemeProvider from "@/components/ThemeProvider";
import { CursorGlow } from "@/components/ui/cursor-glow";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "WhatsAppBrain — Smart WhatsApp Auto-Reply for Small Businesses",
  description: "Auto-reply to price questions, share your hours, confirm bookings, and hand off complex queries to you — all on WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} font-sans antialiased`}>
        <ThemeProvider>
          <CursorGlow />
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
