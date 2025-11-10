import { useState } from 'react';
import * as Types from '../types/index';

type CategorySpend = Types.CategorySpend ;

interface PieChartProps {
  data: CategorySpend[];
}

export default function PieChart({ data }: PieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-gray-400 text-center py-8">No data available</div>;
  }

  const total = data.reduce((sum, item) => sum + item.spend, 0);
  const colors = ['#3b82f6', '#f97316', '#6366f1'];

  let currentAngle = -90;
  const segments = data.map((item, i) => {
    const percentage = (item.spend / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const radius = 70;
    const innerRadius = 45;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (currentAngle * Math.PI) / 180;

    const x1 = 100 + radius * Math.cos(startRad);
    const y1 = 100 + radius * Math.sin(startRad);
    const x2 = 100 + radius * Math.cos(endRad);
    const y2 = 100 + radius * Math.sin(endRad);

    const x3 = 100 + innerRadius * Math.cos(endRad);
    const y3 = 100 + innerRadius * Math.sin(endRad);
    const x4 = 100 + innerRadius * Math.cos(startRad);
    const y4 = 100 + innerRadius * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const midAngle = (startAngle + currentAngle) / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const labelRadius = (radius + innerRadius) / 2;
    const labelX = 100 + labelRadius * Math.cos(midRad);
    const labelY = 100 + labelRadius * Math.sin(midRad);

    return {
      path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`,
      color: colors[i % colors.length],
      category: item.category,
      spend: item.spend,
      percentage,
      labelX,
      labelY,
    };
  });

  return (
    <div className="flex items-center justify-center gap-6">
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 200 200">
          {segments.map((seg, i) => (
            <path
              key={i}
              d={seg.path}
              fill={seg.color}
              className="transition-opacity cursor-pointer"
              opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.4}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
        {hoveredIndex !== null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-gray-900 text-white px-3 py-2 rounded-md shadow-lg text-center text-xs">
              <div className="font-semibold">{segments[hoveredIndex].category}</div>
              <div className="text-gray-300">€{(segments[hoveredIndex].spend / 1000).toFixed(1)}k</div>
              <div className="text-gray-400">{segments[hoveredIndex].percentage.toFixed(1)}%</div>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex items-center gap-2 cursor-pointer transition-opacity"
            style={{ opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.5 }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-gray-700">{seg.category}</span>
            <span className="text-xs font-semibold text-gray-900 ml-auto">
              €{(seg.spend / 1000).toFixed(0)}k
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
