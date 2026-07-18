import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASVAB Ready | Study Dashboard",
  description: "Track your ASVAB Cyber score and core subtest progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
