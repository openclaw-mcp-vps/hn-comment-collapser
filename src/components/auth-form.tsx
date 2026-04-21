"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  nextPath?: string;
};

export function AuthForm({ mode, nextPath = "/dashboard" }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
  const title = mode === "signup" ? "Create your account" : "Welcome back";
  const subtitle =
    mode === "signup"
      ? "Start syncing collapsed comments across sites and devices."
      : "Sign in to manage your collapsed threads and extension sync.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(data?.error ?? "Authentication failed.");
      setLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <Card className="mx-auto w-full max-w-md border-slate-700 bg-slate-900/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error ? <p className="rounded-md border border-rose-500/40 bg-rose-500/10 p-2 text-sm text-rose-300">{error}</p> : null}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <Link href={mode === "signup" ? "/login" : "/signup"} className="text-sky-300 hover:underline">
            {mode === "signup" ? "Log in" : "Create an account"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
