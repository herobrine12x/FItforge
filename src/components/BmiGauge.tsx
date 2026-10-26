import React from 'react';
import { BMICalculator } from '../models/BMICalculator';

interface BmiGaugeProps {
  bmi: number;
  category?: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' | string;
}

export function BmiGauge({ bmi, category: explicitCategory }: BmiGaugeProps) {
  const safeBmi = typeof bmi === 'number' && !isNaN(bmi) && bmi > 0 ? bmi : 22.0;
  const category = explicitCategory || BMICalculator.classify(safeBmi);

  // Gauge min and max BMI mapping
  const MIN_BMI = 12;
  const MAX_BMI = 40;
  const clampedBmi = Math.min(Math.max(safeBmi, MIN_BMI), MAX_BMI);

  // Percentage from 0 to 1 across 180 degrees
  const t = (clampedBmi - MIN_BMI) / (MAX_BMI - MIN_BMI);
  // Angle for the needle: 0% is -90deg (pointing straight left), 100% is +90deg (pointing straight right)
  const needleRotation = -90 + t * 180;

  // Determine colors based on prompt specification:
  // "green Normal, yellow Underweight or Overweight, red Obese"
  const isNormal = category.toLowerCase().includes('normal');
  const isUnderweight = category.toLowerCase().includes('under');
  const isOverweight = category.toLowerCase().includes('over');
  const isObese = category.toLowerCase().includes('obese');

  let categoryTheme = {
    color: '#10B981', // green
    badgeBg: 'bg-emerald-100 dark:bg-emerald-500/15',
    badgeBorder: 'border-emerald-300 dark:border-emerald-500/30',
    badgeText: 'text-emerald-900 dark:text-emerald-400',
    label: 'Normal',
  };

  if (isUnderweight) {
    categoryTheme = {
      color: '#EAB308', // yellow
      badgeBg: 'bg-amber-100 dark:bg-yellow-500/15',
      badgeBorder: 'border-amber-300 dark:border-yellow-500/30',
      badgeText: 'text-amber-900 dark:text-yellow-400',
      label: 'Underweight',
    };
  } else if (isOverweight) {
    categoryTheme = {
      color: '#F59E0B', // yellow/amber
      badgeBg: 'bg-amber-100 dark:bg-amber-500/15',
      badgeBorder: 'border-amber-300 dark:border-amber-500/30',
      badgeText: 'text-amber-900 dark:text-amber-400',
      label: 'Overweight',
    };
  } else if (isObese) {
    categoryTheme = {
      color: '#EF4444', // red
      badgeBg: 'bg-rose-100 dark:bg-rose-500/15',
      badgeBorder: 'border-rose-300 dark:border-rose-500/30',
      badgeText: 'text-rose-900 dark:text-rose-400',
      label: 'Obese',
    };
  }

  // Semicircle dimensions:
  // Center is (130, 120), radius = 88.
  // Arc angles:
  // 1. Underweight (12 to 18.5): t from 0 to 0.232
  // 2. Normal (18.5 to 25.0): t from 0.232 to 0.464
  // 3. Overweight (25.0 to 30.0): t from 0.464 to 0.643
  // 4. Obese (30.0 to 40.0): t from 0.643 to 1.0

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const cx = 130;
  const cy = 100;
  const r = 78;
  const strokeWidth = 13;

  // Arc angles from 0 to 180
  const angleUnder = 0;
  const angleNorm = ((18.5 - 12) / 28) * 180; // ~41.8°
  const angleOver = ((25.0 - 12) / 28) * 180; // ~83.6°
  const angleObese = ((30.0 - 12) / 28) * 180; // ~115.7°
  const angleEnd = 180;

  return (
    <div
      className="flex flex-col items-center justify-between p-5 bg-[#f8fafc] dark:bg-[#16161D] rounded-3xl border border-slate-200 dark:border-[#24242E] shadow-sm relative overflow-hidden"
      role="region"
      aria-label={`BMI Semicircle Gauge showing score ${safeBmi.toFixed(1)} and category ${categoryTheme.label}`}
    >
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#24242E]/60 mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">Biometric Gauge</span>
        <span className="text-[11px] font-mono text-slate-500 dark:text-[#A1A1AA]">Formula: kg / m²</span>
      </div>

      <div className="relative w-64 h-38 flex items-center justify-center mt-1">
        <svg
          viewBox="0 0 260 152"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          {/* Background Arc Shadow / Empty Track */}
          <path
            d={describeArc(cx, cy, r, 0, 180)}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-[#1E1E28]"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Underweight Arc (Yellow) */}
          <path
            d={describeArc(cx, cy, r, angleUnder, angleNorm)}
            fill="none"
            stroke="#EAB308"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="opacity-80"
          />

          {/* Normal Arc (Green) */}
          <path
            d={describeArc(cx, cy, r, angleNorm, angleOver)}
            fill="none"
            stroke="#10B981"
            strokeWidth={strokeWidth}
            className="opacity-95"
          />

          {/* Overweight Arc (Yellow/Amber) */}
          <path
            d={describeArc(cx, cy, r, angleOver, angleObese)}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={strokeWidth}
            className="opacity-80"
          />

          {/* Obese Arc (Red) */}
          <path
            d={describeArc(cx, cy, r, angleObese, angleEnd)}
            fill="none"
            stroke="#EF4444"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="opacity-80"
          />

          {/* Needle Pointer */}
          <g transform={`rotate(${needleRotation}, ${cx}, ${cy})`}>
            {/* Needle line with gradient / sharp tip */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - r + 4}
              stroke="currentColor"
              className="text-slate-800 dark:text-[#F4F4F6]"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Needle glow tip */}
            <circle
              cx={cx}
              cy={cy - r + 4}
              r="4.5"
              fill={categoryTheme.color}
              stroke="currentColor"
              className="text-slate-800 dark:text-[#F4F4F6]"
              strokeWidth="1.5"
            />
          </g>

          {/* Center Pivot */}
          <circle
            cx={cx}
            cy={cy}
            r="7"
            stroke="currentColor"
            className="fill-slate-900 stroke-slate-300 dark:fill-[#0B0B0F] dark:stroke-[#F4F4F6]"
            strokeWidth="2.5"
          />
          <circle cx={cx} cy={cy} r="3" fill={categoryTheme.color} />

          {/* Numeric Readout mathematically positioned below pivot */}
          <text
            x={cx}
            y={134}
            textAnchor="middle"
            className="font-heading font-black fill-slate-900 dark:fill-[#F4F4F6]"
            style={{ fontSize: '26px', fontWeight: 900 }}
          >
            {safeBmi.toFixed(1)}
          </text>
          <text
            x={cx}
            y={147}
            textAnchor="middle"
            className="font-mono uppercase fill-slate-500 dark:fill-[#A1A1AA]"
            style={{ fontSize: '9px', letterSpacing: '0.05em' }}
          >
            BMI Score
          </text>
        </svg>
      </div>

      {/* Category Tag & Healthy Range Guide */}
      <div className="mt-3 flex flex-col items-center gap-1.5 w-full">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${categoryTheme.badgeBg} ${categoryTheme.badgeBorder} ${categoryTheme.badgeText}`}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryTheme.color }} />
          <span>{categoryTheme.label}</span>
        </div>
        <span className="text-[11px] text-slate-600 dark:text-[#A1A1AA]">
          Target Healthy Zone: <strong className="text-emerald-800 dark:text-emerald-400 font-bold">18.5 – 24.9</strong>
        </span>
      </div>
    </div>
  );
}
