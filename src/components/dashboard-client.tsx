"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RefreshCcw, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CommentStateRecord, DashboardStats } from "@/lib/db";

type DashboardClientProps = {
  userEmail: string;
  records: CommentStateRecord[];
  stats: DashboardStats;
};

function formatTime(value: number) {
  return new Date(value).toLocaleString();
}

export function DashboardClient({ userEmail, records: initialRecords, stats: initialStats }: DashboardClientProps) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [stats, setStats] = useState(initialStats);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!query) {
      return records;
    }

    const normalized = query.toLowerCase();
    return records.filter((record) => {
      return (
        record.title.toLowerCase().includes(normalized) ||
        record.url.toLowerCase().includes(normalized) ||
        record.site.toLowerCase().includes(normalized)
      );
    });
  }, [query, records]);

  async function refresh() {
    setLoading(true);
    const response = await fetch("/api/comments/me", { cache: "no-store" });
    const data = (await response.json().catch(() => null)) as
      | {
          records?: CommentStateRecord[];
          stats?: DashboardStats;
        }
      | null;

    if (response.ok && data?.records && data?.stats) {
      setRecords(data.records);
      setStats(data.stats);
    }

    setLoading(false);
    router.refresh();
  }

  async function restoreComment(commentKey: string) {
    const response = await fetch("/api/comments/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ commentKey, collapsed: false }),
    });

    const data = (await response.json().catch(() => null)) as
      | {
          records?: CommentStateRecord[];
          stats?: DashboardStats;
        }
      | null;

    if (response.ok && data?.records && data?.stats) {
      setRecords(data.records);
      setStats(data.stats);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-900/75">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>Sync Dashboard</span>
            <Badge variant="default">Paid Access Active</Badge>
          </CardTitle>
          <CardDescription>
            Signed in as {userEmail}. This dashboard reflects your cloud-synced collapsed comments across devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock label="Tracked Comments" value={stats.totalTracked.toString()} />
          <StatBlock label="Currently Collapsed" value={stats.collapsedCount.toString()} />
          <StatBlock label="Sites Synced" value={stats.syncedSites.toString()} />
          <StatBlock
            label="Last Sync"
            value={stats.lastSyncAt ? formatTime(stats.lastSyncAt) : "No sync yet"}
            valueClassName="text-sm"
          />
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-900/75">
        <CardHeader>
          <CardTitle>Extension Setup</CardTitle>
          <CardDescription>
            In the extension popup, set your app URL to this site, then log in with the same account to enable automatic
            state sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 font-mono text-xs sm:text-sm">
            App URL: {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={refresh} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {loading ? "Refreshing..." : "Refresh Data"}
            </Button>
            <Button variant="ghost" onClick={logout}>
              Log out
            </Button>
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            Sync is authorized via extension tokens and active subscription checks.
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-900/75">
        <CardHeader>
          <CardTitle>Collapsed Comment Index</CardTitle>
          <CardDescription>Search, review, and reopen comments you previously collapsed in-thread.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by site, title, or URL"
          />

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-400">
                No collapsed comments yet. Collapse a comment on HN, Reddit, or GitHub to start syncing progress.
              </p>
            ) : (
              filtered.map((record) => (
                <article key={record.commentKey} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">{record.site}</Badge>
                      <span className="text-xs text-slate-500">Updated {formatTime(record.updatedAt)}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => restoreComment(record.commentKey)}>
                      Restore
                    </Button>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-200">{record.title || "Untitled thread"}</p>
                  {record.url ? (
                    <a
                      className="mt-1 inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200"
                      href={record.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open thread <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBlock({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold text-slate-100 ${valueClassName ?? "text-2xl"}`}>{value}</p>
    </div>
  );
}
