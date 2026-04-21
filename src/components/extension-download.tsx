import Link from "next/link";
import { Download, ShieldCheck, Workflow } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExtensionDownload() {
  return (
    <Card className="border-slate-700 bg-slate-900/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5 text-sky-400" />
          Install The Extension
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-300">
        <p>
          Download the source in this repository, open <span className="font-mono text-slate-200">chrome://extensions</span>, enable
          Developer Mode, and click <span className="font-medium text-slate-100">Load unpacked</span> on the
          <span className="ml-1 font-mono text-slate-200">extension/</span> folder.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="mb-1 flex items-center gap-2 text-slate-100">
              <Workflow className="h-4 w-4 text-sky-400" />
              Cross-Site Support
            </div>
            <p className="text-xs text-slate-400">Hacker News, Reddit, GitHub Issues, and generic forum threads.</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="mb-1 flex items-center gap-2 text-slate-100">
              <ShieldCheck className="h-4 w-4 text-sky-400" />
              Authenticated Sync
            </div>
            <p className="text-xs text-slate-400">Extension sync is tied to your account and active subscription.</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Need setup details? Open <Link href="/dashboard" className="text-sky-300 hover:underline">Dashboard</Link> after purchase for
          exact connection steps.
        </p>
      </CardContent>
    </Card>
  );
}
