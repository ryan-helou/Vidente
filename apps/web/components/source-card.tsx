"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, CheckCircle2, XCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceData } from "@/types";

interface SourceCardProps {
  source: SourceData;
}

const statusConfig = {
  identified: {
    icon: Search,
    label: "Found",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  scraping: {
    icon: Loader2,
    label: "Loading",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    animate: true,
  },
  scraped: {
    icon: CheckCircle2,
    label: "Loaded",
    color: "bg-green-500/10 text-green-600 border-green-500/30",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    color: "bg-red-500/10 text-red-600 border-red-500/30",
  },
};

export function SourceCard({ source }: SourceCardProps) {
  const config = statusConfig[source.status];
  const Icon = config.icon;

  return (
    <Card className={cn("transition-all", config.color)}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  "animate" in config && config.animate && "animate-spin"
                )}
              />
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
            </div>
            <h4 className="font-medium text-sm truncate">{source.title}</h4>
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground truncate flex items-center gap-1 mt-1"
              >
                {new URL(source.url).hostname}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {source.snippet && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {source.snippet}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
