"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
    <div className="h-[calc(100vh-200px)] w-full border rounded-lg overflow-hidden bg-background">
      <ResizablePanelGroup orientation="horizontal">
        {/* Left Panel: Market Info + Verdict */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full flex flex-col">
            <div className="p-3 border-b bg-muted/30">
              <h3 className="font-semibold text-sm">Market Analysis</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
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
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Live Research Feed */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full flex flex-col">
            {/* Thought Log - Top Half */}
            <div className="h-1/2 flex flex-col border-b">
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
              <ScrollArea className="flex-1">
                <ThoughtLog thoughts={thoughts} />
              </ScrollArea>
            </div>

            {/* Sources Grid - Bottom Half */}
            <div className="h-1/2 flex flex-col">
              <div className="p-3 border-b bg-muted/30">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileSearch className="h-4 w-4" />
                  Research Sources ({sources.length})
                </h3>
              </div>
              <ScrollArea className="flex-1">
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
              </ScrollArea>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
