from pydantic import BaseModel
from typing import Optional, Literal


class AnalyzeRequest(BaseModel):
    """Request model for the /analyze endpoint."""

    input_type: Literal["url", "text", "screenshot"]

    # For URL input
    url: Optional[str] = None

    # For text input
    query: Optional[str] = None

    # For screenshot input
    screenshot_base64: Optional[str] = None

    def get_input_value(self) -> str:
        """Get the relevant input value based on input_type."""
        if self.input_type == "url":
            return self.url or ""
        elif self.input_type == "text":
            return self.query or ""
        elif self.input_type == "screenshot":
            return self.screenshot_base64 or ""
        return ""
