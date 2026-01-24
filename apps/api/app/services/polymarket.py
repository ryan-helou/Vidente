import httpx
from typing import Optional, List, Dict, Any
from app.models.response import MarketData
import json


GAMMA_API_BASE = "https://gamma-api.polymarket.com"


class PolymarketClient:
    """Client for Polymarket Gamma API."""

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        await self.client.aclose()

    async def get_event_by_slug(self, slug: str) -> Dict[str, Any]:
        """Fetch event data by slug."""
        response = await self.client.get(f"{GAMMA_API_BASE}/events?slug={slug}")
        response.raise_for_status()
        events = response.json()
        if events and len(events) > 0:
            return events[0]
        raise ValueError(f"Event not found: {slug}")

    async def get_market_by_slug(self, slug: str) -> Dict[str, Any]:
        """Fetch market data by slug."""
        response = await self.client.get(f"{GAMMA_API_BASE}/markets?slug={slug}")
        response.raise_for_status()
        markets = response.json()
        if markets and len(markets) > 0:
            return markets[0]
        raise ValueError(f"Market not found: {slug}")

    async def get_market_by_id(self, market_id: str) -> Dict[str, Any]:
        """Fetch market data by ID."""
        response = await self.client.get(f"{GAMMA_API_BASE}/markets/{market_id}")
        response.raise_for_status()
        return response.json()

    async def search_markets(
        self, query: str, active: bool = True, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for markets matching a query.
        Note: Gamma API doesn't have text search, so we fetch and filter client-side.
        """
        response = await self.client.get(
            f"{GAMMA_API_BASE}/markets",
            params={
                "active": str(active).lower(),
                "closed": "false",
                "limit": 100,  # Fetch more to filter
            },
        )
        response.raise_for_status()
        markets = response.json()

        # Simple client-side filtering
        query_lower = query.lower()
        query_words = query_lower.split()

        def score_market(market: Dict) -> int:
            """Score market based on query match."""
            question = market.get("question", "").lower()
            description = market.get("description", "").lower()
            score = 0
            for word in query_words:
                if word in question:
                    score += 2
                if word in description:
                    score += 1
            return score

        # Filter and sort by relevance
        scored_markets = [(m, score_market(m)) for m in markets]
        scored_markets = [(m, s) for m, s in scored_markets if s > 0]
        scored_markets.sort(key=lambda x: x[1], reverse=True)

        return [m for m, s in scored_markets[:limit]]

    def parse_market_data(self, raw_market: Dict[str, Any]) -> MarketData:
        """Parse raw API response into clean MarketData."""
        outcomes = raw_market.get("outcomes", ["Yes", "No"])

        # Parse outcomes if it's a string
        if isinstance(outcomes, str):
            try:
                outcomes = json.loads(outcomes)
            except json.JSONDecodeError:
                outcomes = ["Yes", "No"]

        # outcomePrices comes as string or list
        prices_raw = raw_market.get("outcomePrices", [0.5, 0.5])
        if isinstance(prices_raw, str):
            try:
                prices = [float(p) for p in json.loads(prices_raw)]
            except (json.JSONDecodeError, ValueError):
                prices = [0.5, 0.5]
        else:
            prices = [float(p) for p in prices_raw] if prices_raw else [0.5, 0.5]

        # Ensure we have at least 2 prices
        while len(prices) < 2:
            prices.append(0.5)

        slug = raw_market.get("slug", raw_market.get("conditionId", ""))

        return MarketData(
            title=raw_market.get("groupItemTitle") or raw_market.get("question", ""),
            question=raw_market.get("question", ""),
            outcomes=outcomes,
            prices=prices,
            volume=float(raw_market.get("volume", 0) or 0),
            resolution_criteria=raw_market.get("description", ""),
            end_date=raw_market.get("endDate"),
            polymarket_url=f"https://polymarket.com/event/{slug}" if slug else None,
        )
