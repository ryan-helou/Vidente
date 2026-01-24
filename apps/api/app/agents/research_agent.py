"""
Research Agent - Core AI orchestration for PolyVeracity.

This agent:
1. Parses user input (URL, text, or screenshot)
2. Fetches Polymarket data
3. Plans research sources using LLM
4. Searches and scrapes sources
5. Synthesizes evidence into a verdict
"""

import asyncio
from typing import Optional, List, Dict, Any

from app.models.request import AnalyzeRequest
from app.models.response import MarketData
from app.services.polymarket import PolymarketClient
from app.services.search import TavilySearch
from app.services.scraper import Crawl4AIScraper
from app.services.llm import LLMService
from app.utils.streaming import ThoughtStream
from app.utils.url_parser import parse_polymarket_url
from .prompts import SYSTEM_PROMPT, SOURCE_PLANNING_PROMPT, ANALYSIS_PROMPT


class ResearchAgent:
    """Main research agent that orchestrates the analysis flow."""

    def __init__(self):
        self.polymarket = PolymarketClient()
        self.search = TavilySearch()
        self.scraper = Crawl4AIScraper()
        self.llm = LLMService()

    async def run(self, request: AnalyzeRequest, stream: ThoughtStream) -> None:
        """
        Main entry point for the research agent.

        Args:
            request: The analysis request
            stream: ThoughtStream for sending events to frontend
        """
        try:
            # Phase 1: Parse Input & Get Market Data
            await stream.think(
                "Starting analysis... Let me understand the market question.",
                phase="planning",
            )

            market_data = await self._get_market_data(request, stream)
            if not market_data:
                await stream.send_error("Could not find or parse market data")
                return

            await stream.send_market_data(market_data.model_dump())

            # Phase 2: Plan Research Sources
            await stream.think(
                f"Market: '{market_data.question}'\n"
                f"Current odds: Yes {market_data.prices[0]*100:.1f}% / No {market_data.prices[1]*100:.1f}%\n\n"
                f"Now identifying the most authoritative sources to research...",
                phase="planning",
            )

            sources = await self._plan_sources(market_data, stream)

            if not sources:
                await stream.think(
                    "Could not identify specific sources. Will search broadly.",
                    phase="planning",
                )
                sources = [
                    {
                        "name": "General Search",
                        "type": "news",
                        "search_query": market_data.question,
                        "reasoning": "Broad search for relevant information",
                    }
                ]

            await stream.think(
                f"Identified {len(sources)} key sources to investigate. Starting research...",
                phase="searching",
            )

            # Phase 3: Search & Scrape Evidence
            evidence = await self._gather_evidence(sources, stream)

            if not evidence:
                await stream.think(
                    "Limited evidence found. Will provide analysis based on available information.",
                    phase="analyzing",
                )
                evidence = []

            # Phase 4: Analyze and Generate Verdict
            await stream.think(
                "Evidence gathered. Analyzing and forming my verdict...",
                phase="analyzing",
            )

            verdict = await self._analyze(market_data, evidence, stream)

            # Phase 5: Deliver Verdict
            signal_text = verdict.get("signal", "HOLD")
            confidence = verdict.get("confidence", 50)

            await stream.think(
                f"Analysis complete.\n\n"
                f"My verdict: {signal_text} with {confidence}% confidence.\n\n"
                f"{verdict.get('summary', '')}",
                phase="concluding",
            )

            await stream.send_verdict(verdict)

        except Exception as e:
            await stream.send_error(f"Analysis failed: {str(e)}")
            raise
        finally:
            await self.polymarket.close()
            await self.scraper.close()

    async def _get_market_data(
        self, request: AnalyzeRequest, stream: ThoughtStream
    ) -> Optional[MarketData]:
        """Extract market data from the input."""

        if request.input_type == "url":
            return await self._get_market_from_url(request.url, stream)

        elif request.input_type == "screenshot":
            return await self._get_market_from_screenshot(
                request.screenshot_base64, stream
            )

        elif request.input_type == "text":
            return await self._get_market_from_text(request.query, stream)

        return None

    async def _get_market_from_url(
        self, url: str, stream: ThoughtStream
    ) -> Optional[MarketData]:
        """Get market data from a Polymarket URL."""
        try:
            parsed = parse_polymarket_url(url)
            await stream.think(
                f"Parsed Polymarket URL: {parsed['type']}/{parsed['slug']}",
                phase="planning",
            )

            if parsed["type"] == "event":
                event = await self.polymarket.get_event_by_slug(parsed["slug"])
                if event.get("markets") and len(event["markets"]) > 0:
                    return self.polymarket.parse_market_data(event["markets"][0])
            else:
                market = await self.polymarket.get_market_by_slug(parsed["slug"])
                return self.polymarket.parse_market_data(market)

        except Exception as e:
            await stream.think(f"Error fetching market data: {str(e)}", phase="planning")
            return None

    async def _get_market_from_screenshot(
        self, image_base64: str, stream: ThoughtStream
    ) -> Optional[MarketData]:
        """Extract market data from a screenshot using GPT-4o vision."""
        await stream.think(
            "Processing screenshot with AI vision...",
            phase="planning",
        )

        try:
            extracted = await self.llm.extract_from_screenshot(image_base64)

            question = extracted.get("question", "")
            if not question:
                await stream.think(
                    "Could not extract market question from screenshot.",
                    phase="planning",
                )
                return None

            await stream.think(
                f"Extracted from screenshot: '{question}'",
                phase="planning",
            )

            # Try to find matching market on Polymarket
            markets = await self.polymarket.search_markets(question[:100])
            if markets:
                await stream.think(
                    f"Found matching market on Polymarket: '{markets[0].get('question', '')}'",
                    phase="planning",
                )
                return self.polymarket.parse_market_data(markets[0])

            # If no match, create synthetic market from screenshot data
            yes_price = extracted.get("yes_price")
            no_price = extracted.get("no_price")

            if yes_price is None:
                yes_price = 0.5
            if no_price is None:
                no_price = 1 - yes_price

            return MarketData(
                title=question,
                question=question,
                outcomes=["Yes", "No"],
                prices=[yes_price, no_price],
                volume=0,
                resolution_criteria=extracted.get("description", ""),
                end_date=extracted.get("end_date"),
                polymarket_url=None,
            )

        except Exception as e:
            await stream.think(
                f"Error processing screenshot: {str(e)}",
                phase="planning",
            )
            return None

    async def _get_market_from_text(
        self, query: str, stream: ThoughtStream
    ) -> Optional[MarketData]:
        """Get market data from a text query."""
        await stream.think(
            f"Searching for markets matching: '{query}'",
            phase="planning",
        )

        try:
            markets = await self.polymarket.search_markets(query)
            if markets:
                market = markets[0]
                await stream.think(
                    f"Found matching market: '{market.get('question', '')}'",
                    phase="planning",
                )
                return self.polymarket.parse_market_data(market)

            # No matching market - create a synthetic one for the query
            await stream.think(
                "No matching market found. Analyzing as a general question.",
                phase="planning",
            )

            return MarketData(
                title=query,
                question=query,
                outcomes=["Yes", "No"],
                prices=[0.5, 0.5],
                volume=0,
                resolution_criteria="User query - no specific resolution criteria from Polymarket",
                end_date=None,
                polymarket_url=None,
            )

        except Exception as e:
            await stream.think(
                f"Error searching markets: {str(e)}",
                phase="planning",
            )
            return None

    async def _plan_sources(
        self, market: MarketData, stream: ThoughtStream
    ) -> List[Dict[str, Any]]:
        """Use LLM to identify critical sources to research."""
        prompt = SOURCE_PLANNING_PROMPT.format(
            question=market.question,
            resolution_criteria=market.resolution_criteria or "Not specified",
            yes_price=f"{market.prices[0]*100:.1f}",
            no_price=f"{market.prices[1]*100:.1f}",
            end_date=market.end_date or "Not specified",
        )

        try:
            result = await self.llm.complete_json(
                prompt=prompt,
                system_prompt=SYSTEM_PROMPT,
                max_tokens=1024,
            )
            return result.get("sources", [])

        except Exception as e:
            print(f"Error planning sources: {e}")
            return []

    async def _gather_evidence(
        self, sources: List[Dict[str, Any]], stream: ThoughtStream
    ) -> List[Dict[str, Any]]:
        """Search and scrape each source."""
        evidence = []

        async def process_source(source: Dict[str, Any], idx: int):
            source_id = f"source_{idx}"

            # Send identified event
            await stream.send_source_identified(
                source_id=source_id,
                title=source.get("name", f"Source {idx+1}"),
                reasoning=source.get("reasoning", ""),
            )

            # Search with Tavily
            query = source.get("search_query", "")
            await stream.think(
                f"Searching: {query}",
                phase="searching",
            )

            try:
                search_results = await self.search.search(query, max_results=3)
            except Exception as e:
                await stream.think(f"Search failed: {str(e)}", phase="searching")
                search_results = []

            if not search_results:
                await stream.send_source_update(
                    source_id=source_id,
                    url="",
                    title=source.get("name", ""),
                    status="failed",
                )
                return None

            # Take best result
            best_result = search_results[0]
            url = best_result.get("url", "")
            title = best_result.get("title", "")

            await stream.send_source_update(
                source_id=source_id,
                url=url,
                title=title,
                status="scraping",
                snippet=best_result.get("content", "")[:500],
            )

            # Scrape full content
            content = None
            try:
                content = await self.scraper.scrape(url)
            except Exception as e:
                await stream.think(f"Could not scrape {url}: {str(e)}", phase="searching")

            if content:
                # Truncate content for display
                display_content = content[:5000] if len(content) > 5000 else content
                await stream.send_source_update(
                    source_id=source_id,
                    url=url,
                    title=title,
                    status="scraped",
                    content=display_content,
                )
            else:
                # Fall back to search snippet
                content = best_result.get("content", "")
                await stream.send_source_update(
                    source_id=source_id,
                    url=url,
                    title=title,
                    status="scraped",
                    snippet=content[:500] if content else "",
                )

            return {
                "source": source,
                "url": url,
                "title": title,
                "content": content or best_result.get("content", ""),
            }

        # Process sources concurrently (max 3 at a time)
        semaphore = asyncio.Semaphore(3)

        async def process_with_semaphore(source, idx):
            async with semaphore:
                return await process_source(source, idx)

        tasks = [process_with_semaphore(source, idx) for idx, source in enumerate(sources)]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if result and not isinstance(result, Exception):
                evidence.append(result)

        return evidence

    async def _analyze(
        self,
        market: MarketData,
        evidence: List[Dict[str, Any]],
        stream: ThoughtStream,
    ) -> Dict[str, Any]:
        """Synthesize evidence and produce verdict."""

        # Format evidence for the prompt
        evidence_summary = ""
        if evidence:
            for idx, e in enumerate(evidence, 1):
                evidence_summary += f"\n### Source {idx}: {e.get('title', 'Unknown')}\n"
                evidence_summary += f"URL: {e.get('url', 'N/A')}\n"
                content = e.get("content", "No content available")
                # Truncate content for prompt
                if len(content) > 3000:
                    content = content[:3000] + "...[truncated]"
                evidence_summary += f"Content:\n{content}\n"
        else:
            evidence_summary = "No specific sources were found. Please provide your best analysis based on general knowledge."

        prompt = ANALYSIS_PROMPT.format(
            question=market.question,
            resolution_criteria=market.resolution_criteria or "Not specified",
            yes_price=f"{market.prices[0]*100:.1f}",
            no_price=f"{market.prices[1]*100:.1f}",
            end_date=market.end_date or "Not specified",
            evidence_summary=evidence_summary,
        )

        try:
            verdict = await self.llm.complete_json(
                prompt=prompt,
                system_prompt=SYSTEM_PROMPT,
                max_tokens=2048,
            )

            # Add sources used
            verdict["sources_used"] = [e.get("url", "") for e in evidence if e.get("url")]

            # Validate and sanitize verdict
            if "signal" not in verdict:
                verdict["signal"] = "HOLD"
            if "confidence" not in verdict:
                verdict["confidence"] = 50
            if "summary" not in verdict:
                verdict["summary"] = "Analysis complete."
            if "key_evidence" not in verdict:
                verdict["key_evidence"] = []
            if "risks" not in verdict:
                verdict["risks"] = []

            # Ensure confidence is within bounds
            verdict["confidence"] = max(0, min(100, int(verdict["confidence"])))

            return verdict

        except Exception as e:
            print(f"Error in analysis: {e}")
            return {
                "signal": "HOLD",
                "confidence": 30,
                "summary": f"Analysis encountered an error: {str(e)}",
                "key_evidence": [],
                "risks": ["Analysis could not be completed fully"],
                "sources_used": [],
            }
