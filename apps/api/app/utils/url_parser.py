import re
from urllib.parse import urlparse
from typing import Dict, Optional


def parse_polymarket_url(url: str) -> Dict[str, str]:
    """
    Parse a Polymarket URL to extract event/market slug.

    Examples:
    - https://polymarket.com/event/fed-decision-in-october
    - https://polymarket.com/event/fed-decision-in-october?tid=123
    - https://polymarket.com/market/will-btc-hit-100k

    Returns:
        Dict with 'type' (event/market), 'slug', and 'full_url'

    Raises:
        ValueError if not a valid Polymarket URL
    """
    parsed = urlparse(url)

    # Check if it's a Polymarket URL
    if "polymarket.com" not in parsed.netloc:
        raise ValueError("Not a Polymarket URL")

    path_parts = parsed.path.strip("/").split("/")

    if len(path_parts) < 2:
        raise ValueError("Invalid Polymarket URL structure")

    resource_type = path_parts[0]  # "event" or "market"
    slug = path_parts[1]

    # Clean the slug (remove query params if accidentally included)
    slug = slug.split("?")[0]

    if resource_type not in ["event", "market"]:
        raise ValueError(f"Unknown Polymarket resource type: {resource_type}")

    return {
        "type": resource_type,
        "slug": slug,
        "full_url": url,
    }


def extract_polymarket_url(text: str) -> Optional[str]:
    """
    Extract a Polymarket URL from text.

    Args:
        text: Text that may contain a Polymarket URL

    Returns:
        The extracted URL or None
    """
    pattern = r"https?://(?:www\.)?polymarket\.com/(?:event|market)/[\w-]+"
    match = re.search(pattern, text)
    return match.group(0) if match else None
