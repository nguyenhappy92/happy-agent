import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Happy Support — AI Slack Agent",
  description:
    "AI-powered support agent for Slack, built with Claude and deployed on Vercel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
