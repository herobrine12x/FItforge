import React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { WorkoutRecord } from '../models/WorkoutRecord';

interface CalorieBarChartProps {
  records: WorkoutRecord[];
}

export function CalorieBarChart({ records }: CalorieBarChartProps) {
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Aggregate calories over the past 7 calendar days
  const last7DaysData = React.useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      // Find records on this day
      const daysRecords = records.filter((r) => {
        const recordDate = new Date(r.date);
        return recordDate >= dayStart && recordDate <= dayEnd;
      });

      const calories = daysRecords.reduce((sum, r) => sum + (r.caloriesBurned || 0), 0);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      data.push({
        day: dayLabel,
        date: fullDateStr,
        calories,
        sessions: daysRecords.length,
      });
    }

    return data;
  }, [records]);

  const total7DayCalories = last7DaysData.reduce((acc, curr) => acc + curr.calories, 0);

  const axisTextColor = isDark ? '#71717A' : '#475569';
  const axisLineColor = isDark ? '#24242E' : '#cbd5e1';
  const barColor = isDark ? '#C6FF3D' : '#16a34a';

  return (
    <div
      className="p-5 bg-[#f8fafc] dark:bg-[#16161D] rounded-3xl border border-slate-200 dark:border-[#24242E] shadow-sm flex flex-col justify-between"
      role="region"
      aria-label="Calories burned over the last 7 days bar chart"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#24242E]/60 mb-4">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">7-Day Energy Output</h2>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-heading text-2xl font-black text-slate-900 dark:text-[#F4F4F6]">
              {total7DayCalories.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-emerald-800 dark:text-[#C6FF3D] font-bold">kcal total</span>
          </div>
        </div>
        <div className="text-[11px] font-mono text-slate-600 dark:text-[#A1A1AA] bg-slate-100 dark:bg-[#0B0B0F] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-[#24242E]">
          Past 7 Days
        </div>
      </div>

      <div className="w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="day"
              stroke={axisTextColor}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: axisLineColor }}
            />
            <YAxis
              stroke={axisTextColor}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(198, 255, 61, 0.05)' : 'rgba(22, 163, 74, 0.08)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] rounded-xl p-2.5 shadow-xl text-xs">
                      <div className="text-slate-600 dark:text-[#A1A1AA] font-mono">{item.date} ({item.day})</div>
                      <div className="font-bold text-emerald-800 dark:text-[#C6FF3D] text-sm mt-0.5">
                        {item.calories} kcal
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-[#A1A1AA] mt-0.5">
                        {item.sessions} {item.sessions === 1 ? 'workout' : 'workouts'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="calories"
              fill={barColor}
              radius={[6, 6, 2, 2]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
