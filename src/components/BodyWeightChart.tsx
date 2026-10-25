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
    <div className="p-5 bg-[#16161D] rounded-3xl border border-[#24242E] flex flex-col justify-between">
      {/* Header with Title & Log Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#24242E]/70 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#C6FF3D]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA]">
              Body Weight Trajectory
            </h2>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-heading text-3xl font-black text-[#F4F4F6]">
              {current.toFixed(1)} <span className="text-sm font-mono text-[#A1A1AA]">kg</span>
            </span>

            {hasData && stats.count > 1 && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                  change < 0
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    : change > 0
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    : 'text-gray-400 bg-gray-500/10 border border-gray-500/20'
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
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#C6FF3D] hover:bg-[#b8f52e] text-[#0B0B0F] transition-all shadow-sm shadow-[#C6FF3D]/15 cursor-pointer self-start sm:self-auto"
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
                <CartesianGrid strokeDasharray="3 3" stroke="#24242E" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#71717A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#24242E' }}
                />
                <YAxis
                  stroke="#71717A"
                  fontSize={11}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickLine={false}
                  axisLine={{ stroke: '#24242E' }}
                  tickFormatter={(val) => `${val.toFixed(0)}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#16161D] border border-[#24242E] rounded-xl p-3 shadow-xl text-xs font-mono">
                          <div className="text-[#A1A1AA] mb-1">{data.fullDate}</div>
                          <div className="text-base font-bold text-[#C6FF3D]">
                            {data.weightKg} kg
                          </div>
                          {data.notes && (
                            <div className="text-[#F4F4F6] text-[11px] mt-1 font-sans">
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
                  stroke="#C6FF3D"
                  strokeWidth={2.5}
                  dot={{ fill: '#0B0B0F', stroke: '#C6FF3D', strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: '#C6FF3D', stroke: '#0B0B0F', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Metrics Footer */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#24242E]/60 text-center">
            <div className="p-2 rounded-xl bg-[#0B0B0F]/60 border border-[#24242E]">
              <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">Starting</span>
              <span className="font-mono text-sm font-bold text-[#F4F4F6]">
                {starting.toFixed(1)} kg
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#0B0B0F]/60 border border-[#24242E]">
              <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">Lowest</span>
              <span className="font-mono text-sm font-bold text-[#C6FF3D]">
                {stats.min?.toFixed(1) ?? '--'} kg
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#0B0B0F]/60 border border-[#24242E]">
              <span className="text-[10px] font-mono uppercase text-[#A1A1AA] block">Highest</span>
              <span className="font-mono text-sm font-bold text-amber-300">
                {stats.max?.toFixed(1) ?? '--'} kg
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#24242E] flex items-center justify-center text-[#A1A1AA] mb-3">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-[#F4F4F6] uppercase tracking-wide">
            No Weight History Yet
          </h3>
          <p className="text-xs text-[#A1A1AA] max-w-xs mt-1 leading-relaxed">
            Record regular weigh-ins to plot your weight trends, track body mass changes, and keep your BMI accurate.
          </p>
          <button
            onClick={onOpenLogModal}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#24242E] hover:bg-[#2e2e3a] text-[#C6FF3D] border border-[#C6FF3D]/30 transition-colors cursor-pointer"
          >
            Log First Weigh-in
          </button>
        </div>
      )}
    </div>
  );
};
