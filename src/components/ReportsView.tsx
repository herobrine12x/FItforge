import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Download,
  Dumbbell,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { MemberProfile } from '../models/MemberProfile';
import { RecordManager } from '../models/RecordManager';
import { ReportGenerator } from '../models/ReportGenerator';
import { User } from '../models/User';

interface ReportsViewProps {
  currentUser: User | null;
  currentProfile: MemberProfile | null;
  recordManager: RecordManager;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentUser,
  currentProfile,
  recordManager,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!currentUser || !currentProfile) return null;

  const reportGen = new ReportGenerator(recordManager);
  const summary = reportGen.generateSummary(currentUser.id, currentProfile);

  const handleExportCSV = () => {
    reportGen.exportToCSV(currentUser.id, `FitForge_${currentProfile.fullName.replace(/\s+/g, '_')}`);
    setDownloadSuccess('CSV fitness logs downloaded successfully');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleExportPDF = () => {
    reportGen.exportToPDF();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            Data Export Engine · ReportGenerator Module
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Fitness Analytics & Export Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Generates standardized CSV datasets and academic evaluation reports.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-md bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF Document</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-2.5 rounded border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Official Academic Report Container */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/40 p-6 sm:p-8 space-y-6 print:bg-white print:text-black print:border-none">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-4 border-b border-gray-800 print:border-gray-300">
          <div>
            <h2 className="text-base font-bold text-white print:text-black tracking-tight">
              FITFORGE FITNESS PROGRESS EVALUATION REPORT
            </h2>
            <div className="text-xs font-mono text-gray-400 print:text-gray-600 mt-1 space-x-2">
              <span>FitForge · Workout Recommender and Progress Tracker</span>
              <span>·</span>
              <span>SDF04 Object-Oriented Programming</span>
              <span>·</span>
              <span>Instructor: Jessa Evangelista</span>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs font-mono text-gray-400 print:text-gray-600">
            <div>
              Date:{' '}
              <span className="text-white print:text-black">
                {new Date(summary.generatedAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              Athlete / Member:{' '}
              <span className="text-emerald-400 print:text-emerald-800 font-semibold">
                {summary.profileName}
              </span>
            </div>
          </div>
        </div>

        {/* Biometrics Summary */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase text-gray-400 tracking-wider">
            Biometric Profiler Assessment
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 border border-gray-800 rounded bg-gray-950/50 divide-y md:divide-y-0 md:divide-x divide-gray-800 print:divide-gray-300 print:border-gray-300 print:bg-gray-50">
            <div className="p-3.5">
              <span className="text-[10px] font-mono uppercase text-gray-400 block">
                Computed BMI
              </span>
              <div className="text-2xl font-bold font-mono text-white print:text-black mt-0.5">
                {summary.bmi}
              </div>
              <span className="text-xs text-emerald-400 print:text-emerald-800 font-medium">
                {summary.healthCategory}
              </span>
            </div>

            <div className="p-3.5">
              <span className="text-[10px] font-mono uppercase text-gray-400 block">
                Target Weight
              </span>
              <div className="text-2xl font-bold font-mono text-white print:text-black mt-0.5">
                {summary.idealWeight.minKg}–{summary.idealWeight.maxKg} kg
              </div>
              <span className="text-[11px] text-gray-400">Normal 18.5–24.9</span>
            </div>

            <div className="p-3.5">
              <span className="text-[10px] font-mono uppercase text-gray-400 block">
                Basal BMR
              </span>
              <div className="text-2xl font-bold font-mono text-white print:text-black mt-0.5">
                {summary.bmr}
              </div>
              <span className="text-[11px] text-gray-400">kcal/day basal</span>
            </div>

            <div className="p-3.5">
              <span className="text-[10px] font-mono uppercase text-gray-400 block">
                Daily TDEE
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400 print:text-emerald-800 mt-0.5">
                {summary.tdee}
              </div>
              <span className="text-[11px] text-gray-400">kcal expenditure</span>
            </div>
          </div>
        </div>

        {/* Volume Analytics */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase text-gray-400 tracking-wider">
            Workout Volume & Adherence Metrics
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 border border-gray-800 rounded bg-gray-950/50 divide-y md:divide-y-0 md:divide-x divide-gray-800 print:divide-gray-300 print:border-gray-300 print:bg-gray-50">
            <div className="p-3.5">
              <span className="text-[10px] font-mono uppercase text-gray-400 block">
                Logged Sessions
              </span>
              <div className="text-2xl font-bold font-mono text-white print:text-black mt-0.5">
                {summary.totalWorkouts}
              </div>
              <span className="text-[11px] text-gray-400">{summary.totalMinutes} total mins</span>
            </div>

            <div className="p-3.5">
              <span className="text-[10px] font-mono uppercase text-gray-400 block">
                Calories Burned
              </span>
              <div className="text-2xl font-bold font-mono text-white print:text-black mt-0.5">
                {summary.totalCalories}
              </div>
              <span className="text-[11px] text-gray-400">kcal total</span>
            </div>

            <div className="p-3.5">
              <span className="text-[10px] font-mono uppercase text-gray-400 block">
                Total Tonnage
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400 print:text-emerald-800 mt-0.5">
                {summary.totalTonnageKg.toLocaleString()} kg
              </div>
              <span className="text-[11px] text-gray-400">Cumulative load</span>
            </div>

            <div className="p-3.5">
              <span className="text-[10px] font-mono uppercase text-gray-400 block">
                Average Rating
              </span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                {summary.avgRating} <span className="text-xs text-gray-400">/ 5.0</span>
              </div>
              <span className="text-[11px] text-gray-400">Athlete quality</span>
            </div>
          </div>
        </div>

        {/* Split Distribution */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase text-gray-400 tracking-wider">
            Split Breakdown
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { name: 'Push Split', count: summary.splitCounts.push },
              { name: 'Pull Split', count: summary.splitCounts.pull },
              { name: 'Legs & Core', count: summary.splitCounts.legs_core },
              { name: 'Full Body', count: summary.splitCounts.full_body },
            ].map((s) => (
              <div
                key={s.name}
                className="p-2.5 rounded border border-gray-800 bg-gray-950/40 flex justify-between items-center text-xs font-mono"
              >
                <span className="text-gray-300 print:text-black">{s.name}</span>
                <span className="font-bold text-white print:text-black">{s.count} logs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signoff */}
        <div className="pt-4 border-t border-gray-800 print:border-gray-300 flex justify-between items-center text-[11px] font-mono text-gray-400 print:text-gray-600">
          <div>Author: Malo, Kent S. (BSCS / LFCA311M111)</div>
          <div>FitForge OOP & Relational Database System</div>
        </div>
      </div>
    </div>
  );
};
