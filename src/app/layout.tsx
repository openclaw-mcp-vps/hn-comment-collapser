import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hn-comment-collapser.com"),
  title: {
    default: "HN Comment Collapser | Persistent Comment Collapsing Across Sites",
    template: "%s | HN Comment Collapser",
  },
  description:
    "Save your reading progress in long threads. HN Comment Collapser remembers collapsed comments on Hacker News, Reddit, GitHub Issues, and forums with synced state across devices.",
  keywords: [
    "Hacker News",
    "Reddit",
    "GitHub issues",
    "browser extension",
    "comment collapse",
    "productivity",
    "developer tools",
  ],
  openGraph: {
    title: "HN Comment Collapser",
    description:
      "Persistent comment collapsing for any website. Never lose your thread reading progress again.",
    url: "https://hn-comment-collapser.com",
    siteName: "HN Comment Collapser",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HN Comment Collapser",
    description:
      "Persistent comment collapsing for Hacker News, Reddit, GitHub Issues, and forum threads.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="text-slate-100 antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
          <header className="sticky top-0 z-30 mt-3 rounded-xl border border-slate-800 bg-[#0d1117]/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/" className="text-sm font-semibold tracking-wide text-slate-100">
                HN Comment Collapser
              </Link>
              <nav className="flex items-center gap-4 text-sm text-slate-300">
                <Link href="/dashboard" className="hover:text-sky-300">
                  Dashboard
                </Link>
                <Link href="/login" className="hover:text-sky-300">
                  Log in
                </Link>
                <Link href="/signup" className="rounded-md bg-sky-500 px-3 py-1.5 font-medium text-slate-950 hover:bg-sky-400">
                  Start
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 py-8">{children}</main>
          <footer className="border-t border-slate-800 py-6 text-xs text-slate-500">
            HN Comment Collapser helps heavy thread readers stay focused across every site.
          </footer>
        </div>
      </body>
    </html>
  );
}
