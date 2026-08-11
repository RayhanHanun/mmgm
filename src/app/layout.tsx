import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Buku Kas MMGM",
  description: "Buku Kas Digital Karang Taruna MMGM",
};

import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50">
        {children}
        <Toaster theme="dark" position="bottom-center" duration={2000} />
      </body>
    </html>
  );
}
