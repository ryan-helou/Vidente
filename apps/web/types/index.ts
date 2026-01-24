// Request types
export interface AnalyzeRequest {
  input_type: "url" | "text" | "screenshot";
  url?: string;
  query?: string;
  screenshot_base64?: string;
}

// Response types
export interface MarketData {
  title: string;
  question: string;
  outcomes: string[];
  prices: number[];
  volume: number;
  resolution_criteria: string;
  end_date: string | null;
  polymarket_url: string | null;
}

export interface ThoughtMessage {
  id: string;
  content: string;
  phase: "planning" | "searching" | "analyzing" | "concluding";
}

export interface SourceData {
  id: string;
  url: string;
  title: string;
  snippet?: string;
  content_markdown?: string;
  relevance_score?: number;
  status: "identified" | "scraping" | "scraped" | "failed";
}

export interface Verdict {
  signal: "BUY_YES" | "BUY_NO" | "HOLD";
  confidence: number;
  summary: string;
  key_evidence: string[];
  risks: string[];
  sources_used: string[];
}

export interface StreamEvent {
  type:
    | "market_data"
    | "thought"
    | "source_identified"
    | "source_scraped"
    | "verdict"
    | "error";
  data: MarketData | ThoughtMessage | SourceData | Verdict | { message: string };
  timestamp: string;
}

export type AnalysisStatus =
  | "idle"
  | "loading"
  | "streaming"
  | "complete"
  | "error";
