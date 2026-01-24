"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, TrendingUp, Calendar, DollarSign } from "lucide-react";
import type { MarketData } from "@/types";

interface MarketCardProps {
  market: MarketData;
}

export function MarketCard({ market }: MarketCardProps) {
  const yesPrice = market.prices[0] * 100;
  const noPrice = market.prices[1] * 100;

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">
            {market.question}
          </CardTitle>
          {market.polymarket_url && (
            <a
              href={market.polymarket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price bars */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-green-600 dark:text-green-400">
                Yes
              </span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {yesPrice.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={yesPrice}
              className="h-3 bg-green-100 dark:bg-green-900/30"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-red-600 dark:text-red-400">
                No
              </span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {noPrice.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={noPrice}
              className="h-3 bg-red-100 dark:bg-red-900/30"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          {market.volume > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatVolume(market.volume)} volume
            </Badge>
          )}
          {market.end_date && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Ends {formatDate(market.end_date)}
            </Badge>
          )}
        </div>

        {/* Resolution criteria */}
        {market.resolution_criteria && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p className="font-medium mb-1">Resolution Criteria:</p>
            <p className="line-clamp-3">{market.resolution_criteria}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MarketCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded animate-pulse w-10" />
              <div className="h-4 bg-muted rounded animate-pulse w-12" />
            </div>
            <div className="h-3 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded animate-pulse w-10" />
              <div className="h-4 bg-muted rounded animate-pulse w-12" />
            </div>
            <div className="h-3 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-5 bg-muted rounded animate-pulse w-24" />
          <div className="h-5 bg-muted rounded animate-pulse w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
