import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retail Product Intelligence",
  description: "AI-powered retail product classification system"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}