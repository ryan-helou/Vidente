const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeMarket(request: {
  input_type: "url" | "text" | "screenshot";
  url?: string;
  query?: string;
  screenshot_base64?: string;
}): Promise<Response> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }

  return response;
}

export async function parseUrl(url: string): Promise<{
  success: boolean;
  event_slug: string;
  market_data: Record<string, unknown>;
}> {
  const response = await fetch(`${API_URL}/api/parse-url?url=${encodeURIComponent(url)}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to parse URL: ${response.statusText}`);
  }

  return response.json();
}

export async function healthCheck(): Promise<{
  status: string;
  version: string;
}> {
  const response = await fetch(`${API_URL}/health`);
  return response.json();
}
