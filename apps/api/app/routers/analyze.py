import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.request import AnalyzeRequest
from app.utils.streaming import ThoughtStream
from app.agents.research_agent import ResearchAgent

router = APIRouter()


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """
    Analyze a Polymarket trade and provide a trading signal.

    Streams the analysis process via Server-Sent Events (SSE).
    """
    # Validate input
    if request.input_type == "url" and not request.url:
        raise HTTPException(status_code=400, detail="URL required for URL input type")
    if request.input_type == "text" and not request.query:
        raise HTTPException(
            status_code=400, detail="Query required for text input type"
        )
    if request.input_type == "screenshot" and not request.screenshot_base64:
        raise HTTPException(
            status_code=400, detail="Screenshot required for screenshot input type"
        )

    stream = ThoughtStream()
    agent = ResearchAgent()

    async def run_analysis():
        """Run the research agent and close the stream when done."""
        try:
            await agent.run(request, stream)
        except Exception as e:
            await stream.send_error(f"Analysis failed: {str(e)}")
        finally:
            await stream.close()

    # Start analysis in background
    asyncio.create_task(run_analysis())

    # Return SSE response
    return StreamingResponse(
        stream.generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/parse-url")
async def parse_url(url: str):
    """Parse a Polymarket URL and return market data."""
    from app.utils.url_parser import parse_polymarket_url
    from app.services.polymarket import PolymarketClient

    try:
        parsed = parse_polymarket_url(url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    client = PolymarketClient()
    try:
        if parsed["type"] == "event":
            event = await client.get_event_by_slug(parsed["slug"])
            if event.get("markets") and len(event["markets"]) > 0:
                market_data = client.parse_market_data(event["markets"][0])
            else:
                raise HTTPException(status_code=404, detail="No markets found in event")
        else:
            market = await client.get_market_by_slug(parsed["slug"])
            market_data = client.parse_market_data(market)

        return {
            "success": True,
            "event_slug": parsed["slug"],
            "market_data": market_data.model_dump(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await client.close()
