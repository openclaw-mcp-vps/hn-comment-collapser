import Link from "next/link";
import { ArrowRight, Clock3, GitBranch, MessageSquareMore, Zap } from "lucide-react";
import type { ReactNode } from "react";

import { ExtensionDownload } from "@/components/extension-download";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-6 sm:p-10">
        <div className="max-w-3xl space-y-6">
          <Badge variant="default">Productivity Tools • $7/month</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100 sm:text-5xl">
            Persistent comment collapsing for every thread-heavy site you read.
          </h1>
          <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
            HN Comment Collapser remembers exactly which comments you folded on Hacker News, Reddit, GitHub Issues, and
            forums. Refresh the page, reopen tomorrow, switch devices: your thread cleanup stays intact.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg">Create Account</Button>
            </Link>
            <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK} target="_blank" rel="noreferrer">
              <Button size="lg" variant="secondary">
                Buy Access <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/dashboard">
              <Button size="lg" variant="ghost">
                Open Dashboard
              </Button>
            </Link>
          </div>
          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <FeatureChip icon={<Clock3 className="h-4 w-4" />} text="Saves 10+ minutes daily for heavy thread readers" />
            <FeatureChip icon={<GitBranch className="h-4 w-4" />} text="Cross-device sync tied to your account" />
            <FeatureChip icon={<Zap className="h-4 w-4" />} text="Works across HN, Reddit, GitHub, and forums" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-700 bg-slate-900/70">
          <CardHeader>
            <CardTitle>The Problem</CardTitle>
            <CardDescription>Every long thread session starts from scratch after a refresh.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>
              Power users in engineering, research, and moderation read hundreds of comments per day. Existing collapse
              behavior is tab-local and site-specific, so your progress disappears whenever you revisit.
            </p>
            <p>
              Thread-heavy work like triaging GitHub issues or reviewing Hacker News debates gets noisy fast. Without
              persistent collapse state, you keep re-scanning old branches instead of focusing on new signal.
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-900/70">
          <CardHeader>
            <CardTitle>The Solution</CardTitle>
            <CardDescription>One extension. One synced memory of your collapsed comments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>
              The extension injects lightweight collapse controls, fingerprints comments, and persists state in the cloud
              through your account.
            </p>
            <p>
              A dedicated dashboard shows what is collapsed, where, and when it synced. You can reopen from dashboard or
              inside the thread instantly.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ExtensionDownload />
        <Card className="border-slate-700 bg-slate-900/75">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>For developers, researchers, and creators who live in comment threads.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-4xl font-semibold text-slate-100">
              $7<span className="text-lg text-slate-400">/month</span>
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>- Unlimited synced collapsed states</li>
              <li>- Extension login and background syncing</li>
              <li>- Dashboard visibility and manual restore</li>
            </ul>
            <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK} target="_blank" rel="noreferrer" className="block">
              <Button className="w-full">Start Subscription</Button>
            </a>
            <p className="text-xs text-slate-500">Checkout is hosted by Stripe. After payment, verify access on the purchase page.</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-100">FAQ</h2>
        <FaqItem
          question="What sites are supported right now?"
          answer="Built-in selectors target Hacker News, Reddit comments, GitHub issue/pr threads, and common forum markup. Generic fallback detection covers many additional threaded UIs."
        />
        <FaqItem
          question="How does sync work?"
          answer="The extension stores state locally and syncs to your account using an authenticated token. Background sync merges changes by latest timestamp, so your newest collapse action wins."
        />
        <FaqItem
          question="How do I unlock paid access after checkout?"
          answer="Use the same email in your account and Stripe checkout. The Stripe webhook records payment, then the purchase page sets a signed paid-access cookie for your dashboard and APIs."
        />
      </section>
    </div>
  );
}

function FeatureChip({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
      <span className="mt-0.5 text-sky-300">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      <summary className="cursor-pointer list-none text-sm font-medium text-slate-100">
        <span className="inline-flex items-center gap-2">
          <MessageSquareMore className="h-4 w-4 text-sky-300" />
          {question}
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{answer}</p>
    </details>
  );
}
