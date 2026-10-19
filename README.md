# 🔮 Vidente
Made by Ryan Helou, Amine Elmoudarrib and Daniel Fagang

*Give it a Polymarket bet and it researches the web to tell you whether the market's odds are wrong.*

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)

Prediction markets price events as probabilities, but the price is only as good as the crowd's information. Vidente takes a single market — pasted as a Polymarket URL, typed as a plain-text question, or dropped in as a screenshot — and runs an autonomous research pass to decide whether the current odds are fair or mispriced. It streams the whole process back to a split-screen UI so you watch the agent reason, search, and read sources in real time before it commits to a call.

The backend agent works in phases. It pulls the market's question, prices, and resolution criteria from Polymarket's Gamma API (`gamma-api.polymarket.com`), then asks GPT-4o to name three to five *authoritative* sources — official statements, wire services, primary filings — with a search query for each. Those queries go to Tavily (advanced depth), the top hit for each is scraped by Crawl4AI (with a plain httpx-plus-regex fallback when the crawler can't start), and up to three sources are fetched concurrently. GPT-4o then synthesizes the evidence against the market price and returns a verdict: `BUY_YES`, `BUY_NO`, or `HOLD`, plus a 0–100 confidence score, a short summary, key evidence, and the counter-risks. The system prompt forbids the model from ever refusing a call — thin evidence just means lower confidence.

A couple of implementation notes worth knowing. The Gamma API has no text search, so a text or screenshot query fetches up to 100 active markets and ranks them client-side (a query word in the question scores 2, in the description 1); if nothing matches it falls back to a synthetic 50/50 market. Everything reaches the frontend over Server-Sent Events — `market_data`, `thought` (tagged planning/searching/analyzing/concluding), `source_identified`, `source_scraped`, and `verdict` — which the React hook stitches into live state.

The stack is a two-app monorepo: a FastAPI backend under `apps/api` and a Next.js 16 / React 19 frontend under `apps/web` using Tailwind v4 and shadcn/ui.

This is an early-stage hackathon build — three commits in, no tests, and the internal code still carries earlier working names (PolyVeracity, polyscrape) that haven't all been renamed to Vidente. It's a working demo, not a finished product, and explicitly not financial advice.
