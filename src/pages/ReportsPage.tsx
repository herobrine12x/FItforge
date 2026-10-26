import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Dumbbell,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  PieChart as PieChartIcon,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RecordManager } from '../models/RecordManager';
import { ReportGenerator } from '../models/ReportGenerator';

type DateRangeFilter = '7d' | '30d' | 'all';

const SPLIT_COLORS: Record<string, string> = {
  push: '#C6FF3D', // FitForge Lime
  pull: '#38BDF8', // Cyan
  legs_core: '#A78BFA', // Purple
  full_body: '#F59E0B', // Amber
  upper_body: '#34D399', // Emerald
  home_bodyweight: '#F472B6', // Pink
  cardio_hiit: '#FB7185', // Rose
};

const PALETTE = [
  '#C6FF3D',
  '#38BDF8',
  '#A78BFA',
  '#F59E0B',
  '#34D399',
  '#F472B6',
  '#FB7185',
  '#60A5FA',
];

export function ReportsPage() {
  const navigate = useNavigate();
  const { currentUser, currentProfile } = useAuth();
  const { success: toastSuccess } = useToast();

  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [recordManager] = useState(() => new RecordManager());
  const reportGenerator = useMemo(() => new ReportGenerator(recordManager), [recordManager]);

  // All user records
  const allRecords = useMemo(() => {
    if (!currentUser) return [];
    return recordManager.readAll(currentUser.id);
  }, [currentUser, recordManager]);

  // Filtered records based on active date range
  const filteredRecords = useMemo(() => {
    if (!currentUser) return [];
    return reportGenerator.getFilteredRecords(currentUser.id, dateRange);
  }, [currentUser, reportGenerator, dateRange]);

  // Summary metrics calculated via ReportGenerator
  const summary = useMemo(() => {
    if (!currentUser) {
      return {
        totalWorkouts: 0,
        totalMinutes: 0,
        totalCalories: 0,
        averageDuration: 0,
        mostUsedSplit: 'None',
        recordsCount: 0,
        avgRating: 5,
        totalTonnageKg: 0,
        completedSets: 0,
        bmi: 23.5,
        healthCategory: 'Normal weight',
        idealWeight: { minKg: 56.7, maxKg: 76.3 },
        bmr: 1680,
        tdee: 2604,
        dailyWaterLiters: 2.5,
        splitCounts: {},
        generatedAt: new Date().toISOString(),
      };
    }
    return reportGenerator.summary(currentUser.id, dateRange);
  }, [currentUser, reportGenerator, dateRange]);

  // Data for Bar Chart: Calories per workout (chronological order)
  const barChartData = useMemo(() => {
    const sorted = [...filteredRecords].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sorted.map((r, idx) => {
      const d = new Date(r.date);
      const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
      return {
        id: r.id,
        index: idx + 1,
        date: dateLabel,
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        split: r.splitName || 'Workout',
        calories: r.caloriesBurned || 0,
        duration: r.durationMinutes || 0,
      };
    });
  }, [filteredRecords]);

  // Data for Donut Chart: Workouts grouped by split
  const pieChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const split = r.splitName || 'Push';
      counts[split] = (counts[split] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value], index) => {
      const key = name.toLowerCase().replace(/[^a-z]/g, '');
      let color = SPLIT_COLORS[key] || PALETTE[index % PALETTE.length];
      return {
        name,
        value,
        color,
      };
    });
  }, [filteredRecords]);

  // Range text label
  const rangeLabel =
    dateRange === '7d'
      ? 'Last 7 Days'
      : dateRange === '30d'
      ? 'Last 30 Days'
      : 'All Time';

  // Export handlers
  const handleExportCSV = () => {
    if (!currentUser) return;
    const athleteName = currentProfile?.name || currentUser.username;
    reportGenerator.exportCSV(
      currentUser.id,
      `Workout_Report_${athleteName.replace(/\s+/g, '_')}`,
      dateRange
    );
    toastSuccess(`CSV report (${rangeLabel}) downloaded successfully!`);
  };

  const handleExportPDF = () => {
    if (!currentUser) return;
    const athleteName = currentProfile?.name || currentUser.username;
    reportGenerator.exportPDF(currentUser.id, athleteName, dateRange);
    toastSuccess(`PDF report (${rangeLabel}) downloaded successfully!`);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ================= PAGE HEADER & EXPORT ACTIONS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#24242E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#65a30d]/10 dark:bg-[#C6FF3D]/10 border border-[#65a30d]/30 dark:border-[#C6FF3D]/30 flex items-center justify-center text-[#65a30d] dark:text-[#C6FF3D] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
              Performance Reports
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-0.5">
              Analytical progress metrics, session distributions, and verified document exports.
            </p>
          </div>
        </div>

        {/* Date Range Selector & Real File Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Buttons */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16161D] hover:bg-slate-100 dark:hover:bg-[#24242E] border border-slate-200 dark:border-[#24242E] text-xs font-semibold text-slate-800 dark:text-[#F4F4F6] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-[#65a30d] dark:text-[#C6FF3D]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={filteredRecords.length === 0}
            className="px-4 py-2 rounded-xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/15 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download PDF document"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ================= DATE RANGE FILTER CONTROLS ================= */}
      <div className="p-3 sm:p-4 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
          <Filter className="w-4 h-4 text-[#65a30d] dark:text-[#C6FF3D]" />
          <span>Active Filter: <strong className="text-slate-900 dark:text-[#F4F4F6]">{rangeLabel}</strong></span>
          <span className="text-slate-500 dark:text-[#A1A1AA] hidden sm:inline">({filteredRecords.length} sessions)</span>
        </div>

        {/* Filter Segmented Control: 7d, 30d, all */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E]">
          {[
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'all', label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDateRange(tab.id as DateRangeFilter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dateRange === tab.id
                  ? 'bg-[#C6FF3D] text-[#0B0B0F] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#F4F4F6] hover:bg-slate-100 dark:hover:bg-[#16161D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= SUMMARY CARDS (5 METRICS) ================= */}
      {/* total workouts, total minutes, total calories, average duration, most-used split */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Workouts */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
            <Dumbbell className="w-4 h-4 text-[#65a30d] dark:text-[#C6FF3D]" />
            <span>Total Workouts</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-[#F4F4F6] tabular-nums">
            {summary.totalWorkouts}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">{rangeLabel}</div>
        </div>

        {/* Total Minutes */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Total Minutes</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-[#F4F4F6] tabular-nums">
            {summary.totalMinutes} <span className="text-sm font-sans text-slate-500 dark:text-[#A1A1AA]">m</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">
            {Math.round(summary.totalMinutes / 60)} hrs trained
          </div>
        </div>

        {/* Total Calories */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
            <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <span>Total Calories</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-[#F4F4F6] tabular-nums">
            {summary.totalCalories} <span className="text-sm font-sans text-slate-500 dark:text-[#A1A1AA]">kcal</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">Energy expenditure</div>
        </div>

        {/* Average Duration */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Avg Duration</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-[#F4F4F6] tabular-nums">
            {summary.averageDuration} <span className="text-sm font-sans text-slate-500 dark:text-[#A1A1AA]">m</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">Per session average</div>
        </div>

        {/* Most-Used Split */}
        <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-[#A1A1AA]">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Most-Used Split</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[#F4F4F6] truncate">
            {summary.mostUsedSplit}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">Favorite routine</div>
        </div>
      </div>

      {/* ================= CHARTS OR EMPTY STATE ================= */}
      {filteredRecords.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] text-center space-y-5 shadow-sm dark:shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] text-[#65a30d] dark:text-[#C6FF3D] flex items-center justify-center mx-auto shadow-inner">
            <BarChart3 className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-heading text-2xl font-bold uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6]">
              No Workout Data Available
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] leading-relaxed">
              {allRecords.length === 0
                ? "You haven't logged any workouts yet. Complete a live session or log past workouts to generate analytics and charts."
                : `No workouts were recorded in the selected range (${rangeLabel}). Switch to "All Time" to view full historical metrics.`}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {allRecords.length === 0 ? (
              <button
                type="button"
                onClick={() => navigate('/recommender')}
                className="px-6 py-3 rounded-2xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm dark:shadow-lg dark:shadow-[#C6FF3D]/15"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start your first workout</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDateRange('all')}
                className="px-5 py-2.5 rounded-xl bg-[#cbd5e1] hover:bg-[#94a3b8] text-slate-900 border border-slate-300 dark:border-transparent dark:bg-[#C6FF3D] dark:hover:bg-[#d4ff66] dark:text-[#0B0B0F] font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Switch to All Time
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Charts Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ================= BAR CHART: CALORIES PER WORKOUT (7 cols) ================= */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] shadow-sm dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                  <span>Calories Burned per Workout</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#A1A1AA]">
                  Chronological energy burn progression across {barChartData.length} sessions
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#4d7c0f] dark:text-[#C6FF3D] bg-[#65a30d]/10 dark:bg-[#C6FF3D]/10 px-2 py-0.5 rounded-md hidden sm:inline">
                {rangeLabel}
              </span>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-[#24242E]" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="p-3 rounded-2xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] shadow-2xl text-xs space-y-1 font-mono">
                            <div className="font-bold text-slate-900 dark:text-[#F4F4F6]">{item.split}</div>
                            <div className="text-[11px] text-slate-500 dark:text-[#A1A1AA]">{item.fullDate}</div>
                            <div className="text-emerald-600 dark:text-[#C6FF3D] font-bold pt-1">
                              {item.calories} kcal burned
                            </div>
                            <div className="text-cyan-600 dark:text-cyan-400 text-[10px]">
                              Duration: {item.duration} min
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="calories"
                    fill="#84cc16"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= DONUT CHART: WORKOUTS BY SPLIT (5 cols) ================= */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[#f8fafc] dark:bg-[#16161D] border border-slate-200 dark:border-[#24242E] shadow-sm dark:shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-0.5">
              <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-slate-900 dark:text-[#F4F4F6] flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span>Workouts by Split</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#A1A1AA]">
                Relative training distribution across routine types
              </p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#f8fafc" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        const total = filteredRecords.length;
                        const pct = total > 0 ? Math.round(((item.value as number) / total) * 100) : 0;
                        return (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] text-xs font-mono space-y-0.5 shadow-xl">
                            <div className="font-bold text-slate-900 dark:text-[#F4F4F6]">{item.name}</div>
                            <div className="text-emerald-600 dark:text-[#C6FF3D] font-bold">
                              {item.value} {item.value === 1 ? 'session' : 'sessions'} ({pct}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-200 dark:border-[#24242E]">
              {pieChartData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-[#0B0B0F] border border-slate-200 dark:border-[#24242E] text-[11px] font-mono shadow-sm"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-900 dark:text-[#F4F4F6] font-medium">{item.name}</span>
                  <span className="text-slate-500 dark:text-[#A1A1AA]">({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
