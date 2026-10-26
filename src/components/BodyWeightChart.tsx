import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Minus,
  Plus,
  Scale,
  Trash2,
} from 'lucide-react';
import { BodyWeightManager } from '../models/BodyWeightManager';
import { IBodyWeightEntry } from '../models/types';

interface BodyWeightChartProps {
  userId: string;
  currentWeightKg: number;
  onOpenLogModal: () => void;
  onWeightChanged?: (weightKg: number) => void;
  refreshKey?: number;
}

export const BodyWeightChart: React.FC<BodyWeightChartProps> = ({
  userId,
  currentWeightKg,
  onOpenLogModal,
  onWeightChanged,
  refreshKey = 0,
}) => {
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

  const manager = useMemo(() => new BodyWeightManager(), []);

  const entries = useMemo(() => {
    return manager.getEntriesAscending(userId);
  }, [manager, userId, refreshKey]);

  const stats = useMemo(() => {
    return manager.getWeightStats(userId);
  }, [manager, userId, refreshKey]);

  // Format data for recharts
  const chartData = useMemo(() => {
    return entries.map((e) => {
      const d = new Date(e.date);
      const label = isNaN(d.getTime())
        ? e.date
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        id: e.id,
        date: label,
        fullDate: e.date,
        weightKg: e.weightKg,
        notes: e.notes,
      };
    });
  }, [entries]);

  const handleDelete = (id: string) => {
    if (confirm('Delete this weight entry?')) {
      manager.deleteEntry(id, userId);
      const updated = manager.getEntriesDescending(userId);
      if (updated.length > 0 && onWeightChanged) {
        onWeightChanged(updated[0].weightKg);
      }
    }
  };

  const hasData = chartData.length > 0;
  const current = stats.current ?? currentWeightKg;
  const starting = stats.starting ?? currentWeightKg;
  const change = stats.change;

  return (
    <div className="p-5 bg-[#f8fafc] dark:bg-[#16161D] rounded-3xl border border-slate-200 dark:border-[#24242E] shadow-sm flex flex-col justify-between">
      {/* Header with Title & Log Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-[#24242E]/70 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-700 dark:text-[#C6FF3D]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#A1A1AA]">
              Body Weight Trajectory
            </h2>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-heading text-3xl font-black text-slate-900 dark:text-[#F4F4F6]">
              {current.toFixed(1)} <span className="text-sm font-mono text-slate-500 dark:text-[#A1A1AA]">kg</span>
            </span>

            {hasData && stats.count > 1 && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                  change < 0
                    ? 'text-emerald-800 bg-emerald-100 border border-emerald-300 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                    : change > 0
                    ? 'text-amber-800 bg-amber-100 border border-amber-300 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20'
                    : 'text-slate-600 bg-slate-200/60 border border-slate-300 dark:text-gray-400 dark:bg-gray-500/10 dark:border-gray-500/20'
                }`}
              >
                {change < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : change > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)} kg overall
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onOpenLogModal}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#b8f52e] dark:text-[#0B0B0F] transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Log Weight</span>
        </button>
      </div>

      {/* Chart or Empty State */}
      {hasData ? (
        <div className="mt-4">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#24242E' : '#e2e8f0'} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={isDark ? '#71717A' : '#64748B'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#24242E' : '#cbd5e1' }}
                />
                <YAxis
                  stroke={isDark ? '#71717A' : '#64748B'}
                  fontSize={11}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#24242E' : '#cbd5e1' }}
                  tickFormatter={(val) => `${val.toFixed(0)}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] rounded-xl p-3 shadow-xl text-xs font-mono">
                          <div className="text-slate-600 dark:text-[#A1A1AA] mb-1">{data.fullDate}</div>
                          <div className="text-base font-bold text-emerald-800 dark:text-[#C6FF3D]">
                            {data.weightKg} kg
                          </div>
                          {data.notes && (
                            <div className="text-slate-800 dark:text-[#F4F4F6] text-[11px] mt-1 font-sans">
                              {data.notes}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weightKg"
                  stroke={isDark ? '#C6FF3D' : '#16a34a'}
                  strokeWidth={2.5}
                  dot={{ fill: isDark ? '#0B0B0F' : '#ffffff', stroke: isDark ? '#C6FF3D' : '#16a34a', strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: isDark ? '#C6FF3D' : '#16a34a', stroke: isDark ? '#0B0B0F' : '#ffffff', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Metrics Footer */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-[#24242E]/60 text-center">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#0B0B0F]/60 border border-slate-200 dark:border-[#24242E]">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-[#A1A1AA] block">Starting</span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-[#F4F4F6]">
                {starting.toFixed(1)} kg
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#0B0B0F]/60 border border-slate-200 dark:border-[#24242E]">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-[#A1A1AA] block">Lowest</span>
              <span className="font-mono text-sm font-bold text-emerald-800 dark:text-[#C6FF3D]">
                {stats.min?.toFixed(1) ?? '--'} kg
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#0B0B0F]/60 border border-slate-200 dark:border-[#24242E]">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-[#A1A1AA] block">Highest</span>
              <span className="font-mono text-sm font-bold text-amber-800 dark:text-amber-300">
                {stats.max?.toFixed(1) ?? '--'} kg
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-[#24242E] flex items-center justify-center text-slate-600 dark:text-[#A1A1AA] mb-3">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-slate-900 dark:text-[#F4F4F6] uppercase tracking-wide">
            No Weight History Yet
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#A1A1AA] max-w-xs mt-1 leading-relaxed">
            Record regular weigh-ins to plot your weight trends, track body mass changes, and keep your BMI accurate.
          </p>
          <button
            onClick={onOpenLogModal}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#24242E] dark:hover:bg-[#2e2e3a] dark:text-[#C6FF3D] dark:border-[#C6FF3D]/30 transition-colors cursor-pointer"
          >
            Log First Weigh-in
          </button>
        </div>
      )}
    </div>
  );
};
