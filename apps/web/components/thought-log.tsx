"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Brain, Search, BarChart3, CheckCircle2 } from "lucide-react";
import type { ThoughtMessage } from "@/types";

interface ThoughtLogProps {
  thoughts: ThoughtMessage[];
}

const phaseConfig = {
  planning: {
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    badgeColor: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    icon: Brain,
    label: "Planning",
  },
  searching: {
    color:
      "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",
    badgeColor: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    icon: Search,
    label: "Searching",
  },
  analyzing: {
    color:
      "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    badgeColor: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
    icon: BarChart3,
    label: "Analyzing",
  },
  concluding: {
    color:
      "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
    badgeColor: "bg-green-500/20 text-green-700 dark:text-green-300",
    icon: CheckCircle2,
    label: "Concluding",
  },
};

export function ThoughtLog({ thoughts }: ThoughtLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new thoughts
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thoughts]);

  if (thoughts.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>AI thoughts will appear here...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {thoughts.map((thought, idx) => {
        const config = phaseConfig[thought.phase];
        const Icon = config.icon;

        return (
          <div
            key={thought.id}
            className={cn(
              "p-3 rounded-lg border animate-in fade-in slide-in-from-bottom-2",
              config.color
            )}
            style={{ animationDelay: `${Math.min(idx * 50, 200)}ms` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" />
              <Badge variant="outline" className={cn("text-xs", config.badgeColor)}>
                {config.label}
              </Badge>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {thought.content}
            </p>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
