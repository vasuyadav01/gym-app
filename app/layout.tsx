import type { Metadata } from "next";
import { DM_Sans, Space_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/lib/ThemeContext";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vasu Fitness",
  description: "AI Fitness App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        dmSans.variable,
        spaceMono.variable,
        geist.variable
      )}
    >
      <body className="min-h-screen bg-slate-300 dark:bg-[#000] flex justify-center">
        <ThemeProvider>
          <div className="w-full max-w-[390px] min-h-screen bg-[#f4f4f5] dark:bg-[var(--app-bg)] shadow-2xl relative overflow-x-hidden">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}