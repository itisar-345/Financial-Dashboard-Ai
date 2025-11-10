import { useState } from 'react';
import * as Types from '../types/index';

type TrendData = Types.TrendData;

interface LineChartProps {
  data: TrendData[];
}

export default function LineChart({ data }: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-gray-400 text-center py-8">No data available</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const maxCount = Math.max(...data.map(d => d.count));
  const height = 200;
  const width = 600;
  const padding = 40;

  const xStep = (width - padding * 2) / (data.length - 1);
  const yScaleValue = (height - padding * 2) / maxValue;
  const yScaleCount = (height - padding * 2) / maxCount;

  const valuePath = data.map((d, i) => {
    const x = padding + i * xStep;
    const y = height - padding - d.value * yScaleValue;
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const countPath = data.map((d, i) => {
    const x = padding + i * xStep;
    const y = height - padding - d.count * yScaleCount;
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getTooltipPosition = (index: number) => {
    const x = padding + index * xStep;
    const xPercent = (x / width) * 100;
    return xPercent > 70 ? 'right' : 'left';
  };

  return (
    <div className="relative">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="valueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={`${valuePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
          fill="url(#valueGradient)"
        />
        <path d={valuePath} fill="none" stroke="#6366f1" strokeWidth="2" />
        <path d={countPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />

        {data.map((d, i) => {
          const x = padding + i * xStep;
          const yValue = height - padding - d.value * yScaleValue;
          const yCount = height - padding - d.count * yScaleCount;
          const isHovered = hoveredIndex === i;

          return (
            <g key={i}>
              {isHovered && (
                <>
                  <line x1={x} y1={0} x2={x} y2={height} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2 2" />
                </>
              )}
              <circle
                cx={x}
                cy={yValue}
                r={isHovered ? 6 : 4}
                fill="#6366f1"
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              <circle
                cx={x}
                cy={yCount}
                r={isHovered ? 5 : 3}
                fill="#3b82f6"
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {i % 2 === 0 && (
                <text x={x} y={height - 10} textAnchor="middle" className="text-xs fill-gray-500">
                  {monthNames[new Date(d.month + '-01').getMonth()]}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoveredIndex !== null && (
        <div
          className={`absolute bottom-16 ${getTooltipPosition(hoveredIndex) === 'left' ? 'left-8' : 'right-8'} bg-gray-900 text-white px-3 py-2 rounded-md shadow-lg text-sm z-10 whitespace-nowrap`}
          style={{
            pointerEvents: 'none',
          }}
        >
          <div className="font-semibold">
            {monthNames[new Date(data[hoveredIndex].month + '-01').getMonth()]}
          </div>
          <div className="text-indigo-300">Value: €{data[hoveredIndex].value.toLocaleString('de-DE', { minimumFractionDigits: 0 })}</div>
          <div className="text-blue-300">Invoices: {data[hoveredIndex].count}</div>
        </div>
      )}
    </div>
  );
}
