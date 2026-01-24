"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { MarketCard, MarketCardSkeleton } from "./market-card";
import { ThoughtLog } from "./thought-log";
import { SourceCard } from "./source-card";
import { VerdictDisplay } from "./verdict-display";
import { ConfidenceMeter } from "./confidence-meter";
import { Brain, FileSearch } from "lucide-react";
import type {
  MarketData,
  ThoughtMessage,
  SourceData,
  Verdict,
  AnalysisStatus,
} from "@/types";

interface SplitScreenLayoutProps {
  market: MarketData | null;
  thoughts: ThoughtMessage[];
  sources: SourceData[];
  verdict: Verdict | null;
  status: AnalysisStatus;
}

export function SplitScreenLayout({
  market,
  thoughts,
  sources,
  verdict,
  status,
}: SplitScreenLayoutProps) {
  const isActive = status === "loading" || status === "streaming";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]">
      {/* Left Column: Market Info + Verdict */}
      <div className="lg:col-span-2 border rounded-lg overflow-hidden bg-background">
        <div className="p-3 border-b bg-muted/30">
          <h3 className="font-semibold text-sm">Market Analysis</h3>
        </div>
        <div className="p-4 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          {/* Market Card */}
          {market ? <MarketCard market={market} /> : <MarketCardSkeleton />}

          {/* Confidence Meter */}
          {verdict && (
            <ConfidenceMeter
              confidence={verdict.confidence}
              signal={verdict.signal}
            />
          )}

          {/* Verdict Display */}
          {verdict && <VerdictDisplay verdict={verdict} />}
        </div>
      </div>

      {/* Right Column: Thoughts + Sources */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        {/* Thought Log */}
        <div className="border rounded-lg overflow-hidden bg-background flex-1 min-h-[300px]">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Thought Process
            </h3>
            {isActive && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Live
              </span>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            <ThoughtLog thoughts={thoughts} />
          </div>
        </div>

        {/* Sources */}
        <div className="border rounded-lg overflow-hidden bg-background flex-1 min-h-[250px]">
          <div className="p-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Research Sources ({sources.length})
            </h3>
          </div>
          <div className="max-h-[250px] overflow-y-auto">
            {sources.length > 0 ? (
              <div className="p-4 grid gap-3">
                {sources.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Sources will appear here as they're found...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
