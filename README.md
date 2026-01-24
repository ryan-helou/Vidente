# PolyVeracity AI

**Turning the Web into your Alpha. Validate any Polymarket trade with AI-powered research.**

A reactive AI agent that takes a Polymarket trade (via URL, screenshot, or text) and performs autonomous web research to validate if the market price is "correct" or "mispriced."

## Features

- **Multi-modal Input**: Paste a Polymarket URL, describe a market in text, or upload a screenshot
- **Real-time Research**: Watch the AI think and search for authoritative sources
- **Live Thought Process**: See the AI's reasoning as it analyzes the market
- **Opinionated Verdicts**: Always get a clear BUY YES/NO/HOLD signal with confidence score
- **Source Transparency**: See exactly which sources the AI used to form its opinion

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python) |
| LLM | OpenAI GPT-4o |
| Search | Tavily API |
| Scraping | Crawl4AI |
| Streaming | Server-Sent Events (SSE) |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- API Keys:
  - OpenAI: https://platform.openai.com/api-keys
  - Tavily: https://tavily.com (free tier available)

### 1. Clone and Setup

```bash
cd polyscrape
```

### 2. Backend Setup

```bash
cd apps/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Run the server
python main.py
```

The API will be available at http://localhost:8000

### 3. Frontend Setup

```bash
cd apps/web

# Install dependencies
npm install

# Run the development server
npm run dev
```

The app will be available at http://localhost:3000

## Environment Variables

### Backend (apps/api/.env)

```bash
OPENAI_API_KEY=sk-xxx          # Required
TAVILY_API_KEY=tvly-xxx        # Required
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000
```

### Frontend (apps/web/.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Endpoints

### POST /api/analyze

Analyze a Polymarket trade. Returns Server-Sent Events stream.

**Request:**
```json
{
  "input_type": "url" | "text" | "screenshot",
  "url": "https://polymarket.com/event/...",
  "query": "Will Bitcoin hit $100k?",
  "screenshot_base64": "..."
}
```

**Stream Events:**
- `market_data` - Polymarket info fetched
- `thought` - AI reasoning (phase: planning/searching/analyzing/concluding)
- `source_identified` - Research source found
- `source_scraped` - Source content retrieved
- `verdict` - Final signal with confidence score

### GET /health

Health check endpoint.

## Project Structure

```
polyscrape/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   │
│   └── api/                 # FastAPI backend
│       ├── main.py
│       └── app/
│           ├── agents/      # AI research agent
│           ├── services/    # Polymarket, Tavily, Crawl4AI
│           ├── routers/     # API endpoints
│           └── utils/       # SSE streaming
│
└── README.md
```

## How It Works

1. **Input**: User provides a Polymarket URL, screenshot, or text query
2. **Market Fetch**: App fetches current prices and resolution criteria from Polymarket
3. **Source Planning**: AI identifies 3-5 authoritative sources to research
4. **Web Search**: Tavily searches for those sources
5. **Deep Scraping**: Crawl4AI extracts full content from sources
6. **Analysis**: AI synthesizes evidence and compares to market price
7. **Verdict**: Returns BUY YES/NO/HOLD signal with confidence score

## License

MIT - Built for hackathon demonstration.

---

**Disclaimer**: This is an educational project. Not financial advice. Do your own research.
