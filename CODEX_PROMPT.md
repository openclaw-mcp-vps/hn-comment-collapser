# Build Task: hn-comment-collapser

Build a complete, production-ready Next.js 15 App Router application.

PROJECT: hn-comment-collapser
HEADLINE: Persistent comment collapsing for any website
WHAT: None
WHY: None
WHO PAYS: None
NICHE: productivity-tools
PRICE: $$7/mo

ARCHITECTURE SPEC:
A browser extension with a web dashboard that allows users to persistently collapse comments on any website. The extension syncs collapsed state across devices via a cloud backend, while the web app handles user management and subscription billing.

PLANNED FILES:
- extension/manifest.json
- extension/content-script.js
- extension/background.js
- extension/popup.html
- web/pages/index.js
- web/pages/dashboard.js
- web/pages/api/auth/[...nextauth].js
- web/pages/api/collapsed-comments.js
- web/pages/api/webhooks/lemonsqueezy.js
- web/components/PricingCard.js
- web/lib/database.js
- web/lib/lemonsqueezy.js

DEPENDENCIES: next, tailwindcss, next-auth, prisma, @prisma/client, lemonsqueezy.js, @lemonsqueezy/lemonsqueezy.js, stripe, react, typescript

REQUIREMENTS:
- Next.js 15 with App Router (app/ directory)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (npx shadcn@latest init, then add needed components)
- Dark theme ONLY — background #0d1117, no light mode
- Lemon Squeezy checkout overlay for payments
- Landing page that converts: hero, problem, solution, pricing, FAQ
- The actual tool/feature behind a paywall (cookie-based access after purchase)
- Mobile responsive
- SEO meta tags, Open Graph tags
- /api/health endpoint that returns {"status":"ok"}

ENVIRONMENT VARIABLES (create .env.example):
- NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID
- NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID
- LEMON_SQUEEZY_WEBHOOK_SECRET

After creating all files:
1. Run: npm install
2. Run: npm run build
3. Fix any build errors
4. Verify the build succeeds with exit code 0

Do NOT use placeholder text. Write real, helpful content for the landing page
and the tool itself. The tool should actually work and provide value.


PREVIOUS ATTEMPT FAILED WITH:
Codex exited 1: Reading additional input from stdin...
OpenAI Codex v0.121.0 (research preview)
--------
workdir: /tmp/openclaw-builds/hn-comment-collapser
model: gpt-5.3-codex
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: none
reasoning summaries: none
session id: 019d94ce-b979-7c70-aa85-8293d035fca7
--------
user
# Build Task: hn-comment-collapser

Build a complete, production-ready Next.js 15 App Router application.

PROJECT: hn-comment-collapser
HEADLINE: Persistent comment 
Please fix the above errors and regenerate.