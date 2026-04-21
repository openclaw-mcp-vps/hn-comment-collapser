"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function PurchaseActivation() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function verifyPurchase() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/paywall/refresh", {
      method: "POST",
    });

    const data = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;

    if (!response.ok) {
      setMessage(data?.message ?? data?.error ?? "We could not verify an active subscription yet.");
      setLoading(false);
      return;
    }

    setMessage("Subscription verified. Your dashboard and sync API are now unlocked.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button onClick={verifyPurchase} disabled={loading}>
        {loading ? "Checking Stripe status..." : "I completed checkout, unlock my account"}
      </Button>
      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}
