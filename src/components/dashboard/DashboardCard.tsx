import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: "up" | "down" | "neutral";
  change?: number;
  className?: string;
}

export function DashboardCard({
  title,
  value,
  icon,
  description,
  trend,
  change,
  className,
}: DashboardCardProps) {
  return (
    <Card className={cn("overflow-hidden h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-5 w-5 text-slate-500 dark:text-slate-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
            {trend && (
              <span
                className={cn(
                  "mr-1 text-xs",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500"
                )}
              >
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
                {change && ` ${change}%`}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}