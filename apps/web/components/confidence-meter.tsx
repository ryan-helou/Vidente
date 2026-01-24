"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/types";

interface ConfidenceMeterProps {
  confidence: number;
  signal: Verdict["signal"];
}

export function ConfidenceMeter({ confidence, signal }: ConfidenceMeterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animate the confidence value
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = confidence / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= confidence) {
        setDisplayValue(confidence);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [confidence]);

  const getColor = () => {
    if (signal === "HOLD") return "bg-yellow-500";
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-blue-500";
    if (confidence >= 40) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getConfidenceLabel = () => {
    if (confidence >= 80) return "Very High";
    if (confidence >= 60) return "High";
    if (confidence >= 40) return "Moderate";
    if (confidence >= 20) return "Low";
    return "Very Low";
  };

  return (
    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Confidence Level</span>
        <div className="text-right">
          <span className="font-bold text-2xl tabular-nums">{displayValue}%</span>
          <span className="text-xs text-muted-foreground ml-2">
            ({getConfidenceLabel()})
          </span>
        </div>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            getColor()
          )}
          style={{ width: `${displayValue}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Uncertain</span>
        <span>Confident</span>
      </div>
    </div>
  );
}
