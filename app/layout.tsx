import type { Metadata } from "next";
import { AppShell } from "@/components/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Platform",
  description: "AI-assisted lead management and outreach platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full"><AppShell>{children}</AppShell></body>
    </html>
  );
}
