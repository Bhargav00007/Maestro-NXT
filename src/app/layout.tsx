import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutClient from "./layout-client";
import ZabbixDataProvider from "@/components/ZabbixDataProvider";
import AIChat from "@/components/AIchat";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maestro NXT",
  description: "Network Monitoring Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen ${geistSans.variable} ${geistMono.variable}`}>
        <LayoutClient>
          <ZabbixDataProvider>{children}<AIChat
          apiUrl="https://watchwing.vercel.app/api/describe"
          welcomeMessage="Hi there! I'm WatchWing AI. I can see your screen and help you with testing, debugging, or anything you're working on. What can I assist you with?"
          inputPlaceholder="Ask about your screen or testing..."
          chatTitle="WatchWing AI"
        /></ZabbixDataProvider>
        </LayoutClient>
      </body>
    </html>
  );
}