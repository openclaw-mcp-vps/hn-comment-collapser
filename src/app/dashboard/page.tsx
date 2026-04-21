import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats, getUserCollapsedStates, isUserPaid } from "@/lib/db";
import { getCurrentUser, hasPaywallAccess } from "@/lib/server-auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const paywallActive = await hasPaywallAccess(user.id);

  if (!paywallActive) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-slate-700 bg-slate-900/75">
          <CardHeader>
            <CardTitle>Dashboard Is Locked</CardTitle>
            <CardDescription>
              The tool runs behind a paid-access cookie. Subscribe and verify payment to unlock sync and comment controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Badge variant={isUserPaid(user) ? "default" : "neutral"}>
                {isUserPaid(user) ? "Subscription detected" : "No active subscription"}
              </Badge>
            </div>
            <p>
              Step 1: complete Stripe checkout. Step 2: visit Purchase Activation to set your paid-access cookie for this
              browser.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK} target="_blank" rel="noreferrer">
                <Button>Open Checkout</Button>
              </a>
              <Link href="/purchase">
                <Button variant="secondary">Verify Purchase</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [records, stats] = await Promise.all([getUserCollapsedStates(user.id), getDashboardStats(user.id)]);

  return <DashboardClient userEmail={user.email} records={records} stats={stats} />;
}
