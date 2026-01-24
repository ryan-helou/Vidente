"use client";

import { useState } from "react";
import { InputPanel } from "@/components/input-panel";
import { SplitScreenLayout } from "@/components/split-screen-layout";
import { useAnalysis } from "@/hooks/use-analysis";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles } from "lucide-react";

export default function Home() {
  const {
    market,
    thoughts,
    sources,
    verdict,
    status,
    error,
    analyze,
    reset,
  } = useAnalysis();

  const [hasStarted, setHasStarted] = useState(false);

  const handleSubmit = async (input: Parameters<typeof analyze>[0]) => {
    setHasStarted(true);
    await analyze(input);
  };

  const handleReset = () => {
    reset();
    setHasStarted(false);
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Vidente</h1>
            </div>
            {hasStarted && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Validate any Polymarket trade with AI-powered web research
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Input Panel */}
        <div className="mb-6">
          <InputPanel
            onSubmit={handleSubmit}
            isLoading={status === "loading" || status === "streaming"}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {hasStarted && (
          <SplitScreenLayout
            market={market}
            thoughts={thoughts}
            sources={sources}
            verdict={verdict}
            status={status}
          />
        )}

        {/* Initial State */}
        {!hasStarted && (
          <div className="text-center py-16 text-muted-foreground">
            <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h2 className="text-xl font-semibold mb-2">Ready to Analyze</h2>
            <p className="max-w-md mx-auto">
              Enter a Polymarket URL, describe a market, or upload a screenshot to
              get AI-powered trading insights.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>
            Built for hackathon demonstration. Not financial advice.
          </p>
        </div>
      </footer>
    </main>
  );
}
