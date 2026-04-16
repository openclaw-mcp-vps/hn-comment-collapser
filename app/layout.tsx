import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HN Comment Collapser — Persistent comment collapsing for any website",
  description: "A browser extension that lets you persistently collapse comments on any website, synced across all your devices."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
