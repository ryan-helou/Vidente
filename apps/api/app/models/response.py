from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime


class MarketData(BaseModel):
    """Polymarket market information."""

    title: str
    question: str
    outcomes: List[str] = ["Yes", "No"]
    prices: List[float]  # [Yes price, No price] as decimals 0-1
    volume: float = 0
    resolution_criteria: str = ""
    end_date: Optional[str] = None
    polymarket_url: Optional[str] = None


class ThoughtMessage(BaseModel):
    """AI thought/reasoning message."""

    id: str
    content: str
    phase: Literal["planning", "searching", "analyzing", "concluding"]


class SourceData(BaseModel):
    """Information about a research source."""

    id: str
    url: str = ""
    title: str
    snippet: Optional[str] = None
    content_markdown: Optional[str] = None
    relevance_score: Optional[float] = None
    status: Literal["identified", "scraping", "scraped", "failed"] = "identified"


class Verdict(BaseModel):
    """Final trading signal and analysis."""

    signal: Literal["BUY_YES", "BUY_NO", "HOLD"]
    confidence: int  # 0-100
    summary: str
    key_evidence: List[str]
    risks: List[str]
    sources_used: List[str] = []


class StreamEvent(BaseModel):
    """Wrapper for SSE events."""

    type: Literal[
        "market_data",
        "thought",
        "source_identified",
        "source_scraped",
        "analysis_update",
        "verdict",
        "error",
    ]
    data: dict
    timestamp: str = ""

    def __init__(self, **kwargs):
        if "timestamp" not in kwargs or not kwargs["timestamp"]:
            kwargs["timestamp"] = datetime.utcnow().isoformat()
        super().__init__(**kwargs)
