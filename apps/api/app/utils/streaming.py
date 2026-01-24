import asyncio
import json
import uuid
from datetime import datetime
from typing import AsyncGenerator, Dict, Any


class ThoughtStream:
    """Manages streaming thoughts and events to the frontend via SSE."""

    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue()
        self._closed = False

    async def send(self, event_type: str, data: Dict[str, Any]) -> None:
        """Send an event to the stream."""
        if not self._closed:
            event = {
                "type": event_type,
                "data": data,
                "timestamp": datetime.utcnow().isoformat(),
            }
            await self.queue.put(event)

    async def think(self, thought: str, phase: str = "analyzing") -> None:
        """Convenience method for sending thought messages."""
        await self.send(
            "thought",
            {
                "id": str(uuid.uuid4()),
                "content": thought,
                "phase": phase,
            },
        )

    async def send_market_data(self, market_data: Dict[str, Any]) -> None:
        """Send market data event."""
        await self.send("market_data", market_data)

    async def send_source_identified(
        self, source_id: str, title: str, reasoning: str
    ) -> None:
        """Send source identified event."""
        await self.send(
            "source_identified",
            {
                "id": source_id,
                "url": "",
                "title": title,
                "snippet": reasoning,
                "status": "identified",
            },
        )

    async def send_source_update(
        self,
        source_id: str,
        url: str,
        title: str,
        status: str,
        content: str = None,
        snippet: str = None,
    ) -> None:
        """Send source scraping status update."""
        data = {
            "id": source_id,
            "url": url,
            "title": title,
            "status": status,
        }
        if snippet:
            data["snippet"] = snippet
        if content:
            data["content_markdown"] = content

        await self.send("source_scraped", data)

    async def send_verdict(self, verdict: Dict[str, Any]) -> None:
        """Send final verdict."""
        await self.send("verdict", verdict)

    async def send_error(self, message: str) -> None:
        """Send error event."""
        await self.send("error", {"message": message})

    async def close(self) -> None:
        """Signal stream end."""
        self._closed = True
        await self.queue.put(None)

    async def generator(self) -> AsyncGenerator[str, None]:
        """Async generator for SSE responses."""
        while True:
            try:
                event = await self.queue.get()
                if event is None:
                    break
                yield f"data: {json.dumps(event)}\n\n"
            except asyncio.CancelledError:
                break
