import { redirect } from "next/navigation";

import { PurchaseActivation } from "@/components/purchase-activation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/server-auth";

export default async function PurchasePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/purchase");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-slate-700 bg-slate-900/75">
        <CardHeader>
          <CardTitle>Activate Paid Access</CardTitle>
          <CardDescription>
            Complete checkout in Stripe first, then verify subscription for {user.email}. This sets the paid-access
            cookie required for the dashboard and sync APIs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-300">
          <a
            className="inline-block rounded-md bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400"
            href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
            target="_blank"
            rel="noreferrer"
          >
            Open Stripe Checkout
          </a>
          <p>
            If payment just completed, webhook processing can take a few seconds. Use the verification button below once
            checkout is finished.
          </p>
          <PurchaseActivation />
        </CardContent>
      </Card>
    </div>
  );
}
