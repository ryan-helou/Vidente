import asyncio
from typing import List, Dict, Any, Optional
from tavily import TavilyClient
from app.config import settings


class TavilySearch:
    """Wrapper for Tavily search API."""

    def __init__(self):
        self._client: Optional[TavilyClient] = None

    @property
    def client(self) -> TavilyClient:
        """Lazy initialization of Tavily client."""
        if self._client is None:
            self._client = TavilyClient(api_key=settings.tavily_api_key)
        return self._client

    async def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "advanced",
        topic: str = "general",
    ) -> List[Dict[str, Any]]:
        """
        Search using Tavily API.

        Args:
            query: Search query
            max_results: Maximum number of results
            search_depth: "basic" or "advanced"
            topic: "general" or "news"

        Returns:
            List of search results with url, title, and content
        """
        # Tavily client is sync, so we run in executor
        loop = asyncio.get_event_loop()

        def do_search():
            return self.client.search(
                query=query,
                search_depth=search_depth,
                topic=topic,
                max_results=max_results,
                include_answer=False,
            )

        result = await loop.run_in_executor(None, do_search)
        return result.get("results", [])

    async def search_with_context(
        self, query: str, max_results: int = 5
    ) -> Dict[str, Any]:
        """
        Search and get both results and a generated answer.

        Returns:
            Dict with 'results' and 'answer'
        """
        loop = asyncio.get_event_loop()

        def do_search():
            return self.client.search(
                query=query,
                search_depth="advanced",
                max_results=max_results,
                include_answer=True,
            )

        result = await loop.run_in_executor(None, do_search)
        return {
            "results": result.get("results", []),
            "answer": result.get("answer", ""),
        }
