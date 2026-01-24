"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/types";

interface VerdictDisplayProps {
  verdict: Verdict;
}

const signalConfig = {
  BUY_YES: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    label: "BUY YES",
    description: "The market underprices YES",
  },
  BUY_NO: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    label: "BUY NO",
    description: "The market underprices NO",
  },
  HOLD: {
    icon: MinusCircle,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    label: "HOLD",
    description: "The market is fairly priced",
  },
};

export function VerdictDisplay({ verdict }: VerdictDisplayProps) {
  const config = signalConfig[verdict.signal];
  const Icon = config.icon;

  return (
    <Card className={cn("border-2", config.border, config.bg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Icon className={cn("h-6 w-6", config.color)} />
            <span className={config.color}>{config.label}</span>
          </CardTitle>
          <Badge variant="secondary" className="text-lg px-3 py-1 font-bold">
            {verdict.confidence}%
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <p className="text-sm leading-relaxed">{verdict.summary}</p>

        {/* Key Evidence */}
        {verdict.key_evidence.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Key Evidence
            </h4>
            <ul className="space-y-1">
              {verdict.key_evidence.map((point, i) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-green-600 mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {verdict.risks.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              Risks & Counterarguments
            </h4>
            <ul className="space-y-1">
              {verdict.risks.map((risk, i) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-orange-600 mt-1">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sources */}
        {verdict.sources_used.length > 0 && (
          <div className="pt-2 border-t">
            <h4 className="font-semibold text-xs text-muted-foreground mb-2">
              Sources Used
            </h4>
            <div className="flex flex-wrap gap-1">
              {verdict.sources_used.map((url, i) => {
                try {
                  const hostname = new URL(url).hostname;
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {hostname}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  );
                } catch {
                  return null;
                }
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
