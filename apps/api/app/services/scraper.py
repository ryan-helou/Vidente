from typing import Optional
import asyncio


class Crawl4AIScraper:
    """Wrapper for Crawl4AI web scraper."""

    def __init__(self):
        self._crawler = None
        self._initialized = False

    async def _ensure_initialized(self):
        """Lazy initialization of the crawler."""
        if not self._initialized:
            try:
                from crawl4ai import AsyncWebCrawler

                self._crawler = AsyncWebCrawler()
                await self._crawler.start()
                self._initialized = True
            except Exception as e:
                print(f"Failed to initialize Crawl4AI: {e}")
                self._crawler = None

    async def scrape(self, url: str, timeout: int = 30) -> Optional[str]:
        """
        Scrape a URL and return markdown content.

        Args:
            url: URL to scrape
            timeout: Timeout in seconds

        Returns:
            Markdown content or None if failed
        """
        await self._ensure_initialized()

        if self._crawler is None:
            # Fallback: use httpx to get raw HTML
            return await self._fallback_scrape(url, timeout)

        try:
            result = await asyncio.wait_for(
                self._crawler.arun(url=url),
                timeout=timeout,
            )

            if result and result.markdown:
                # Truncate if too long
                content = result.markdown
                if len(content) > 50000:
                    content = content[:50000] + "\n\n[Content truncated...]"
                return content
            return None

        except asyncio.TimeoutError:
            print(f"Timeout scraping {url}")
            return None
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return await self._fallback_scrape(url, timeout)

    async def _fallback_scrape(self, url: str, timeout: int) -> Optional[str]:
        """Fallback scraping using httpx when Crawl4AI fails."""
        import httpx
        from html import unescape
        import re

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(
                    url,
                    follow_redirects=True,
                    headers={
                        "User-Agent": "Mozilla/5.0 (compatible; PolyVeracityBot/1.0)"
                    },
                )
                response.raise_for_status()

                html = response.text

                # Simple HTML to text conversion
                # Remove scripts and styles
                html = re.sub(
                    r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.I
                )
                html = re.sub(
                    r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL | re.I
                )
                # Remove HTML tags
                text = re.sub(r"<[^>]+>", " ", html)
                # Unescape HTML entities
                text = unescape(text)
                # Clean up whitespace
                text = re.sub(r"\s+", " ", text).strip()

                if len(text) > 50000:
                    text = text[:50000] + "\n\n[Content truncated...]"

                return text

        except Exception as e:
            print(f"Fallback scrape failed for {url}: {e}")
            return None

    async def close(self):
        """Clean up resources."""
        if self._crawler and self._initialized:
            try:
                await self._crawler.close()
            except Exception:
                pass
