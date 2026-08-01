import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { DiagnosticsFAB } from "@/components/diagnostics-fab";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart School - School Automation Software | Sisi Technology Ltd",
  description: "Modern and Complete School Automation Software for the Nigerian Market. 25+ modules, 8 user panels. Developed by Sisi Technology Ltd, Jos Plateau State.",
  keywords: ["Smart School", "School Management", "Nigeria", "Education", "Sisi Technology", "School Automation", "ERP"],
  authors: [{ name: "Sisi Technology Ltd" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased bg-background text-foreground`}>
        <Providers>
          {children}
          <DiagnosticsFAB />
          <Toaster />
          <SonnerToaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
