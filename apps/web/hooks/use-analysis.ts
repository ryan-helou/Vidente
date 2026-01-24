"use client";

import { useState, useCallback } from "react";
import type {
  AnalyzeRequest,
  MarketData,
  ThoughtMessage,
  SourceData,
  Verdict,
  AnalysisStatus,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AnalysisState {
  market: MarketData | null;
  thoughts: ThoughtMessage[];
  sources: SourceData[];
  verdict: Verdict | null;
  status: AnalysisStatus;
  error: string | null;
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    market: null,
    thoughts: [],
    sources: [],
    verdict: null,
    status: "idle",
    error: null,
  });

  const reset = useCallback(() => {
    setState({
      market: null,
      thoughts: [],
      sources: [],
      verdict: null,
      status: "idle",
      error: null,
    });
  }, []);

  const analyze = useCallback(async (input: AnalyzeRequest) => {
    // Reset state
    setState({
      market: null,
      thoughts: [],
      sources: [],
      verdict: null,
      status: "loading",
      error: null,
    });

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      setState((prev) => ({ ...prev, status: "streaming" }));

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));

              setState((prev) => {
                switch (event.type) {
                  case "market_data":
                    return { ...prev, market: event.data as MarketData };

                  case "thought":
                    return {
                      ...prev,
                      thoughts: [...prev.thoughts, event.data as ThoughtMessage],
                    };

                  case "source_identified":
                  case "source_scraped": {
                    const sourceData = event.data as SourceData;
                    const existingIdx = prev.sources.findIndex(
                      (s) => s.id === sourceData.id
                    );
                    if (existingIdx >= 0) {
                      const newSources = [...prev.sources];
                      newSources[existingIdx] = sourceData;
                      return { ...prev, sources: newSources };
                    }
                    return {
                      ...prev,
                      sources: [...prev.sources, sourceData],
                    };
                  }

                  case "verdict":
                    return {
                      ...prev,
                      verdict: event.data as Verdict,
                      status: "complete",
                    };

                  case "error":
                    return {
                      ...prev,
                      error: (event.data as { message: string }).message,
                      status: "error",
                    };

                  default:
                    return prev;
                }
              });
            } catch (e) {
              console.error("Failed to parse SSE event:", e);
            }
          }
        }
      }

      // Ensure we end in complete state if no explicit verdict
      setState((prev) => {
        if (prev.status === "streaming") {
          return { ...prev, status: "complete" };
        }
        return prev;
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Unknown error",
        status: "error",
      }));
    }
  }, []);

  return { ...state, analyze, reset };
}
