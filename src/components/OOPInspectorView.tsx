import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Database,
  Layers,
} from 'lucide-react';
import { SCHEMA_TABLES, SQL_SCHEMA_DDL } from '../models/DatabaseSchema';

export const OOPInspectorView: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeConcept, setActiveConcept] = useState<'encapsulation' | 'inheritance' | 'polymorphism' | 'abstraction'>('inheritance');

  const copySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_DDL.trim());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const oopPillars = [
    {
      id: 'encapsulation' as const,
      title: '1. Encapsulation',
      badge: 'Data Hiding & Validation',
      summary:
        'Biometric attributes and credentials are kept strictly private with validated getters and setters to enforce business invariants.',
      codeSnippet: `// File: src/models/BMICalculator.ts
export class BMICalculator {
  private _heightCm: number;
  private _weightKg: number;
  private _age: number;

  constructor(heightCm: number, weightKg: number, age: number) {
    this.validateInputs(heightCm, weightKg, age);
    this._heightCm = heightCm;
    this._weightKg = weightKg;
    this._age = age;
  }

  // Positive numeric validation method
  public validateInputs(heightCm: number, weightKg: number, age: number): void {
    if (isNaN(heightCm) || heightCm <= 0 || heightCm > 300) {
      throw new Error('Height must be a positive number between 1 and 300 cm.');
    }
    if (isNaN(weightKg) || weightKg <= 0 || weightKg > 500) {
      throw new Error('Weight must be a positive number between 1 and 500 kg.');
    }
  }

  public set heightCm(value: number) {
    this.validateInputs(value, this._weightKg, this._age);
    this._heightCm = value;
  }
}`,
    },
    {
      id: 'inheritance' as const,
      title: '2. Inheritance',
      badge: 'Class Hierarchies',
      summary:
        'Base WorkoutPlan provides foundational set and repetition rules inherited by PushSplit, PullSplit, LegsSplit, and FullBodySplit.',
      codeSnippet: `// File: src/models/WorkoutPlan.ts -> src/models/PushSplit.ts
export abstract class WorkoutPlan {
  protected _splitType: SplitType;
  protected _experienceLevel: ExperienceLevel;
  protected _fitnessGoal: FitnessGoal;

  public getRecommendedSets(): number { ... }
  public getRecommendedReps(): number { ... }
  public abstract generateRoutine(): ExerciseItem[];
  public abstract calculateEstimatedCalories(dur: number, wt: number): number;
}

export class PushSplit extends WorkoutPlan {
  constructor(experience: ExperienceLevel, goal: FitnessGoal) {
    super('push', experience, goal);
  }
}`,
    },
    {
      id: 'polymorphism' as const,
      title: '3. Polymorphism',
      badge: 'Dynamic Method Dispatch',
      summary:
        'Subclasses override generateRoutine() to produce split-specific 5-exercise routines and calculate custom MET caloric burn rates.',
      codeSnippet: `// Polymorphic invocation at runtime:
const plan: WorkoutPlan = WorkoutPlanFactory.create(selectedSplit, experience, goal);

// Method call dispatches to PushSplit, PullSplit, or LegsSplit implementation:
const fiveExercises = plan.generateRoutine(); 
const calories = plan.calculateEstimatedCalories(durationMinutes, bodyWeightKg);`,
    },
    {
      id: 'abstraction' as const,
      title: '4. Abstraction',
      badge: 'Separation of Concerns',
      summary:
        'GUI components interact strictly with managers and interfaces, decoupling database persistence and mathematical models from UI views.',
      codeSnippet: `// GUI triggers high-level domain operations:
const authManager = new AuthManager();
const recordManager = new RecordManager();
const reportGen = new ReportGenerator(recordManager);

// Abstraction isolates storage, validation, and analytics from the view
const summary = reportGen.generateSummary(user.id, profile);`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            Academic Documentation · SDF04 Project
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            OOP Architecture & Relational Schema
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Class hierarchy, OOP principles, and normalized SQLite/MySQL schema for instructor defense.
          </p>
        </div>

        <div className="font-mono text-xs text-gray-400 shrink-0">
          <div>Author: Malo, Kent S.</div>
          <div>Instructor: Jessa Evangelista</div>
        </div>
      </div>

      {/* 4 OOP Pillars Viewer */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/40 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-gray-300">
            Object-Oriented Programming Principles
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Select a principle to inspect verified domain class implementation:
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {oopPillars.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveConcept(p.id)}
              className={`p-3 text-left border rounded transition-colors cursor-pointer ${
                activeConcept === p.id
                  ? 'border-emerald-500 bg-gray-900 text-white'
                  : 'border-gray-800 bg-gray-950/60 text-gray-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-semibold">{p.title}</div>
              <div className="text-[10px] font-mono text-emerald-400 mt-0.5">{p.badge}</div>
            </button>
          ))}
        </div>

        {/* Active Concept Details */}
        {(() => {
          const active = oopPillars.find((p) => p.id === activeConcept)!;
          return (
            <div className="border border-gray-800 rounded bg-gray-950 p-4 space-y-3">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase text-gray-200">
                  {active.title} — Architectural Pattern
                </h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{active.summary}</p>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-gray-400 mb-1">
                  Source Code Implementation:
                </div>
                <pre className="p-3.5 rounded border border-gray-800 bg-gray-900 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {active.codeSnippet}
                </pre>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Relational Database Schema */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/40 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-gray-300">
              Relational Database Tables (SQLite / MySQL)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Corresponds to Section 4 & 6 of the SDF04 Project Proposal.
            </p>
          </div>

          <button
            onClick={copySql}
            className="px-3 py-1.5 rounded border border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied SQL DDL!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL DDL</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SCHEMA_TABLES.map((table) => (
            <div
              key={table.tableName}
              className="border border-gray-800 rounded bg-gray-950 p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-cyan-400">
                  table: {table.tableName}
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  PK: {table.primaryKey}
                </span>
              </div>
              <p className="text-xs text-gray-400">{table.purpose}</p>

              {table.foreignKeys.length > 0 && (
                <div className="text-[11px] font-mono text-amber-400/90">
                  FK: {table.foreignKeys.join(', ')}
                </div>
              )}

              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="pb-1 font-medium">Column</th>
                      <th className="pb-1 font-medium">Type</th>
                      <th className="pb-1 text-right font-medium">Constraints</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40 text-gray-300">
                    {table.attributes.map((attr) => (
                      <tr key={attr.name}>
                        <td className="py-1 text-gray-200">{attr.name}</td>
                        <td className="py-1 text-gray-400">{attr.type}</td>
                        <td className="py-1 text-right text-emerald-400 text-[10px]">
                          {attr.constraints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
