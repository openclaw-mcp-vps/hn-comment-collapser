export default function Home() {
  const checkoutUrl = process.env.NEXT_PUBLIC_LS_CHECKOUT_URL || "#";
  return (
    <main className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <span className="inline-block bg-[#161b22] border border-[#30363d] text-[#58a6ff] text-xs font-medium px-3 py-1 rounded-full mb-6">
          Browser Extension + Cloud Sync
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
          Collapse comments.<br />
          <span className="text-[#58a6ff]">Permanently. Everywhere.</span>
        </h1>
        <p className="text-lg text-[#8b949e] max-w-xl mx-auto mb-8">
          HN Comment Collapser lets you collapse any comment thread on any website and remembers your choices — synced across all your devices automatically.
        </p>
        <a
          href={checkoutUrl}
          className="inline-block bg-[#58a6ff] hover:bg-[#79b8ff] text-[#0d1117] font-semibold px-8 py-3 rounded-lg transition-colors text-base"
        >
          Get Started — $7/mo
        </a>
        <p className="mt-4 text-sm text-[#8b949e]">Works on Hacker News, Reddit, YouTube, and more.</p>
      </section>

      {/* Features strip */}
      <section className="max-w-3xl mx-auto px-6 pb-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        {[
          { icon: "🔒", title: "Persistent", desc: "Collapsed state saved forever, not just for the session." },
          { icon: "☁️", title: "Cloud Synced", desc: "Same collapsed threads on every browser and device." },
          { icon: "🌐", title: "Any Website", desc: "Works on any site with comment sections." }
        ].map((f) => (
          <div key={f.title} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="text-2xl mb-2">{f.icon}</div>
            <div className="font-semibold text-white mb-1">{f.title}</div>
            <div className="text-sm text-[#8b949e]">{f.desc}</div>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="max-w-sm mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Simple Pricing</h2>
        <div className="bg-[#161b22] border border-[#58a6ff] rounded-2xl p-8 text-center">
          <div className="text-sm text-[#58a6ff] font-medium uppercase tracking-wide mb-2">Pro</div>
          <div className="text-5xl font-bold text-white mb-1">$7</div>
          <div className="text-[#8b949e] mb-6">per month</div>
          <ul className="text-left space-y-3 mb-8">
            {[
              "Browser extension (Chrome & Firefox)",
              "Unlimited collapsed comments",
              "Cloud sync across all devices",
              "Works on any website",
              "Priority support"
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <span className="text-[#58a6ff] mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a
            href={checkoutUrl}
            className="block w-full bg-[#58a6ff] hover:bg-[#79b8ff] text-[#0d1117] font-semibold py-3 rounded-lg transition-colors text-center"
          >
            Subscribe Now
          </a>
          <p className="mt-3 text-xs text-[#8b949e]">Cancel anytime. No contracts.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-white text-center mb-8">FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: "Which browsers and websites are supported?",
              a: "The extension works on Chrome and Firefox. It supports any website with comment sections including Hacker News, Reddit, YouTube, and more."
            },
            {
              q: "How does cross-device sync work?",
              a: "When you collapse a comment, it's saved to our cloud backend. Log in on any device and your collapsed state is restored automatically."
            },
            {
              q: "Can I cancel my subscription?",
              a: "Yes, you can cancel anytime from your account dashboard. You'll retain access until the end of your billing period."
            }
          ].map((item) => (
            <div key={item.q} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <div className="font-semibold text-white mb-2">{item.q}</div>
              <div className="text-sm text-[#8b949e]">{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#30363d] py-6 text-center text-xs text-[#8b949e]">
        © {new Date().getFullYear()} HN Comment Collapser. All rights reserved.
      </footer>
    </main>
  );
}
