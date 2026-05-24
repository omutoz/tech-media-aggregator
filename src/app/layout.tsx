import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UATech Aggregator — Преміальний агрегатор українських техно-медіа",
  description: "Об'єднує новини, огляди та аналітику про IT, AI, гаджети та стартапи від 14 провідних українських джерел з ШІ-оцінкою якості, анти-клікбейтом та розумними фільтрами.",
  authors: [{ name: "UATech Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#08080C] text-[#F3F4F6] selection:bg-purple-600 selection:text-white">{children}</body>
    </html>
  );
}
