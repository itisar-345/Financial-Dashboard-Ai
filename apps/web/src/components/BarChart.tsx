import { useState } from 'react';
import * as Types from '../types/index';

type VendorSpend = Types.VendorSpend;

interface BarChartProps {
  data: VendorSpend[] | any[];
  horizontal?: boolean;
}

export default function BarChart({ data, horizontal = false }: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-gray-400 text-center py-8">No data available</div>;
  }

  const getSpend = (item: any) => item.spend !== undefined ? item.spend : item.amount;
  const maxSpend = Math.max(...data.map(d => getSpend(d)));

  if (horizontal) {
    return (
      <div className="space-y-2">
        {data.map((item, i) => {
          const vendor = item.vendor || '';
          const spend = getSpend(item);
          const percentage = (spend / maxSpend) * 100;
          const isHovered = hoveredIndex === i;

          return (
            <div
              key={i}
              className="flex items-center gap-2 relative group"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className="text-xs text-gray-600 w-32 truncate">{vendor}</span>
              <div className="flex-1 h-4 bg-blue-100 rounded overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                  style={{ width: `${Math.max(percentage, 5)}%` }}
                />
              </div>
              {isHovered && (
                <div className="absolute left-0 right-0 -top-12 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10 ml-12">
                  <div className="font-semibold">{vendor}</div>
                  <div>€{spend.toLocaleString('de-DE', { minimumFractionDigits: 0 })}</div>
                  <div className="text-gray-300">{percentage.toFixed(1)}%</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-end justify-center gap-2 h-40">
      {data.slice(0, 5).map((item, i) => {
        const spend = getSpend(item);
        const month = item.month || item.vendor || `Item ${i}`;
        const percentage = (spend / maxSpend) * 100;
        const isHovered = hoveredIndex === i;

        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1 flex-1 relative"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className="w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-t transition-all duration-300 cursor-pointer hover:shadow-md"
              style={{
                height: `${Math.max((percentage / 100) * 120, 20)}px`,
                opacity: hoveredIndex === null || isHovered ? 1 : 0.6,
              }}
            />
            <span className="text-xs text-gray-600 truncate text-center">{month}</span>
            {isHovered && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                <div className="font-semibold">{month}</div>
                <div>€{spend.toLocaleString('de-DE', { minimumFractionDigits: 0 })}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
