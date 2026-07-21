"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeePieChartProps {
  paid: number;
  partial: number;
  unpaid: number;
  totalCollected: number;
  totalExpected: number;
}

const COLORS = {
  Paid: "#10B981",
  Partial: "#F59E0B",
  Unpaid: "#EF4444",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { name: string; value: number } }>;
  total: number;
}

function CustomTooltip({ active, payload, total }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{item.payload.name}</p>
      <p className="text-xs text-muted-foreground">{item.value} students ({pct}%)</p>
    </div>
  );
}

export function FeePieChart({
  paid,
  partial,
  unpaid,
  totalCollected,
  totalExpected,
}: FeePieChartProps) {
  const total = paid + partial + unpaid;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const data = [
    { name: "Paid", value: paid },
    { name: "Partial", value: partial },
    { name: "Unpaid", value: unpaid },
  ].filter((d) => d.value > 0);

  const collectionPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fee status</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No fee data available
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <div className="cursor-pointer">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                    onMouseEnter={(_, index) => setHoveredIdx(index)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {data.map((entry, index) => {
                      const isHovered = hoveredIdx === index;
                      return (
                        <Cell
                          key={entry.name}
                          fill={COLORS[entry.name as keyof typeof COLORS]}
                          style={{
                            cursor: "pointer",
                            transition: "transform 150ms ease, filter 150ms ease",
                            transform: isHovered ? "scale(1.08)" : "scale(1)",
                            transformOrigin: "center",
                            filter: hoveredIdx !== null && !isHovered ? "brightness(0.8)" : "none",
                          }}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip total={total} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              {data.map((entry, idx) => {
                const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                const color = COLORS[entry.name as keyof typeof COLORS];
                const isActive = hoveredIdx === idx;
                return (
                  <div
                    key={entry.name}
                    className={`flex items-center justify-between py-1 rounded transition-all duration-150 ${hoveredIdx !== null && !isActive ? "opacity-40" : ""} ${isActive ? "scale-[1.02]" : ""}`}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium">{entry.value}</span>
                      <span className="text-xs text-muted-foreground">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Collection</span>
                  <span className="text-sm font-mono font-medium">{collectionPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Collected</span>
                  <span className="text-sm font-mono font-medium text-success">
                    ₹{totalCollected.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
