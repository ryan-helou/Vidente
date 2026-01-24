import json
import base64
from typing import Optional, Dict, Any, List
from openai import AsyncOpenAI
from app.config import settings


class LLMService:
    """OpenAI GPT-4o service for reasoning and vision tasks."""

    def __init__(self):
        self._client: Optional[AsyncOpenAI] = None

    @property
    def client(self) -> AsyncOpenAI:
        """Lazy initialization of OpenAI client."""
        if self._client is None:
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        return self._client

    async def complete(
        self,
        prompt: str,
        system_prompt: str = "",
        model: str = "gpt-4o",
        max_tokens: int = 2048,
        temperature: float = 0.7,
    ) -> str:
        """
        Get a text completion from the model.

        Args:
            prompt: User prompt
            system_prompt: System instructions
            model: Model to use
            max_tokens: Maximum response tokens
            temperature: Sampling temperature

        Returns:
            Model response text
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        return response.choices[0].message.content or ""

    async def complete_json(
        self,
        prompt: str,
        system_prompt: str = "",
        model: str = "gpt-4o",
        max_tokens: int = 2048,
    ) -> Dict[str, Any]:
        """
        Get a JSON completion from the model.

        Args:
            prompt: User prompt
            system_prompt: System instructions
            model: Model to use
            max_tokens: Maximum response tokens

        Returns:
            Parsed JSON response
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.3,  # Lower temp for structured output
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content or "{}"
        return json.loads(content)

    async def analyze_image(
        self,
        image_base64: str,
        prompt: str,
        model: str = "gpt-4o",
        max_tokens: int = 1024,
    ) -> str:
        """
        Analyze an image using GPT-4o vision.

        Args:
            image_base64: Base64-encoded image
            prompt: Question/instruction about the image
            model: Model to use
            max_tokens: Maximum response tokens

        Returns:
            Model response text
        """
        # Detect image type from base64 header or assume PNG
        if image_base64.startswith("/9j/"):
            media_type = "image/jpeg"
        elif image_base64.startswith("iVBORw"):
            media_type = "image/png"
        else:
            media_type = "image/png"

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{image_base64}"
                            },
                        },
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
            max_tokens=max_tokens,
        )

        return response.choices[0].message.content or ""

    async def extract_from_screenshot(self, image_base64: str) -> Dict[str, Any]:
        """
        Extract Polymarket trade information from a screenshot.

        Args:
            image_base64: Base64-encoded screenshot

        Returns:
            Dict with extracted market information
        """
        prompt = """Analyze this Polymarket screenshot and extract the following information:
1. The market question/title
2. Current Yes/No prices (as percentages)
3. Any visible resolution criteria or description
4. The event end date if visible

Return a JSON object with these fields:
{
    "question": "the market question",
    "yes_price": 0.65,
    "no_price": 0.35,
    "description": "any visible description or criteria",
    "end_date": "date if visible or null"
}

If you cannot determine a value, use null. Always provide your best interpretation of the market question."""

        try:
            response = await self.analyze_image(image_base64, prompt, max_tokens=512)

            # Try to parse JSON from response
            # Handle case where response has markdown code blocks
            content = response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            return json.loads(content)

        except json.JSONDecodeError:
            # If JSON parsing fails, return minimal info
            return {
                "question": response[:200] if response else "Unknown market",
                "yes_price": None,
                "no_price": None,
                "description": None,
                "end_date": None,
            }
