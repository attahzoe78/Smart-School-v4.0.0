"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  color?: string;
  subtitle?: string;
}

export function StatCard({ title, value, icon: Icon, change, changeType = "neutral", color = "bg-emerald-500", subtitle }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-white", color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {change && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className={cn(
              "font-medium",
              changeType === "positive" && "text-emerald-600",
              changeType === "negative" && "text-red-600",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
