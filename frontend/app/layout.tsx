import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/lib/redux/provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Online Exam Management System',
  description: 'Complete exam management with auto-grading',
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <ReduxProvider>
          <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">{children}</main>
        </ReduxProvider>
      </body>
    </html>
  );
}
