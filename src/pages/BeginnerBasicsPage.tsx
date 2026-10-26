import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Dumbbell,
  Heart,
  HelpCircle,
  Moon,
  Repeat,
  ShieldAlert,
  Sparkles,
  Wind,
  Zap,
} from 'lucide-react';

export const BeginnerBasicsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-[#24242E]">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C6FF3D]">
          <BookOpen className="w-4 h-4" />
          <span>Fundamental Training Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider font-heading text-[#F4F4F6]">
          Beginner Basics
        </h1>
        <p className="text-sm text-[#A1A1AA] max-w-2xl leading-relaxed">
          Welcome to FitForge! Everything you need to know about workout structure,
          proper pacing, weights, and staying safe as you build momentum.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm space-y-1">
          <p className="font-bold text-amber-300">
            Stop and rest if you feel sharp pain, dizziness or unwell.
          </p>
          <p className="text-amber-200/80 leading-relaxed">
            Listen to your body at every step. Fitness is built through consistency over months, not by pushing through pain in a single day.
          </p>
        </div>
      </div>

      {/* Grid of Core Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Card 1: Sets, Reps & Rest */}
        <div className="p-6 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                What Sets, Reps & Rest Mean
              </h2>
              <span className="text-[11px] font-mono text-[#A1A1AA]">The building blocks of routines</span>
            </div>
          </div>
          <div className="space-y-2.5 text-xs text-[#A1A1AA] leading-relaxed">
            <p>
              <strong className="text-[#F4F4F6]">Reps (Repetitions):</strong> The number of times you complete a single exercise movement from start to finish (e.g., 10 goblet squats in a row).
            </p>
            <p>
              <strong className="text-[#F4F4F6]">Sets:</strong> A group of reps performed together. 3 sets of 10 means you do 10 reps, take a breather, do 10 more, rest, and do the final 10.
            </p>
            <p>
              <strong className="text-[#F4F4F6]">Rest Interval:</strong> The recovery time (usually 60 to 90 seconds) between sets. Resting lets your muscles replenish short-term energy so you can perform the next set with crisp, safe form.
            </p>
          </div>
        </div>

        {/* Card 2: Choosing Starting Weight */}
        <div className="p-6 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                How to Choose a Starting Weight
              </h2>
              <span className="text-[11px] font-mono text-[#A1A1AA]">The Golden Rule</span>
            </div>
          </div>
          <div className="space-y-2.5 text-xs text-[#A1A1AA] leading-relaxed">
            <div className="p-3 rounded-2xl bg-[#0B0B0F] border border-[#C6FF3D]/30 text-[#F4F4F6] font-medium text-xs">
              "Pick a weight you can lift with good form for the target reps, and the last 2 reps should feel hard, not impossible."
            </div>
            <p>
              If your target is 10 reps and you could easily do 15 without slowing down, the weight is a bit too light. If your form breaks down on rep 6 or 7, lower the weight immediately.
            </p>
            <p>
              Always prioritize smooth, clean movement over heavy numbers. You can always increase weight next week as your confidence grows.
            </p>
          </div>
        </div>

        {/* Card 3: Warm Up and Cool Down */}
        <div className="p-6 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                Why Warm Up & Cool Down
              </h2>
              <span className="text-[11px] font-mono text-[#A1A1AA]">Preparing and resetting the body</span>
            </div>
          </div>
          <div className="space-y-2.5 text-xs text-[#A1A1AA] leading-relaxed">
            <p>
              <strong className="text-[#F4F4F6]">Warm-Up (3–5 min):</strong> Light walking, arm circles, or bodyweight squats raise core body temperature, lubricate joints with synovial fluid, and awaken neural motor pathways before resistance work.
            </p>
            <p>
              <strong className="text-[#F4F4F6]">Cool-Down (2–3 min):</strong> Gentle walking and light stretching bring your heart rate and blood pressure down smoothly, preventing dizziness after intense efforts.
            </p>
          </div>
        </div>

        {/* Card 4: Breathing Technique */}
        <div className="p-6 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                Breathing During Exercise
              </h2>
              <span className="text-[11px] font-mono text-[#A1A1AA]">Never hold your breath</span>
            </div>
          </div>
          <div className="space-y-2.5 text-xs text-[#A1A1AA] leading-relaxed">
            <p>
              Holding your breath (known as the Valsalva maneuver) spikes blood pressure and can cause lightheadedness or headaches.
            </p>
            <div className="p-3 rounded-2xl bg-[#0B0B0F] border border-[#24242E] text-xs space-y-1">
              <div className="text-[#C6FF3D] font-mono font-bold uppercase text-[10px]">
                The Simple Rule
              </div>
              <p className="text-[#F4F4F6]">
                <strong>Breathe OUT</strong> when exerting effort (pushing, pressing, pulling up).
              </p>
              <p className="text-[#F4F4F6]">
                <strong>Breathe IN</strong> as you return to the starting position (lowering the weight).
              </p>
            </div>
          </div>
        </div>

        {/* Card 5: Muscle Soreness vs. Pain */}
        <div className="p-6 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                Muscle Soreness vs. Pain
              </h2>
              <span className="text-[11px] font-mono text-[#A1A1AA]">Recognizing body signals</span>
            </div>
          </div>
          <div className="space-y-2.5 text-xs text-[#A1A1AA] leading-relaxed">
            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <span className="text-emerald-400 font-bold uppercase text-[10px] font-mono block">
                Normal: Mild Muscle Soreness (DOMS)
              </span>
              <p className="text-zinc-200">
                A dull, widespread tiredness or tenderness in the muscle belly that peaks 24 to 48 hours after training. It feels better once you move around.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-1">
              <span className="text-rose-400 font-bold uppercase text-[10px] font-mono block">
                Stop Signal: Sharp or Joint Pain
              </span>
              <p className="text-zinc-200">
                Any sharp, stabbing, pinching, or sudden twinge—especially inside joints like knees, shoulders, elbows, or lower back. If you feel this, stop the exercise immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Card 6: Schedule & Rest Days */}
        <div className="p-6 rounded-3xl bg-[#16161D] border border-[#24242E] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#F4F4F6] uppercase tracking-wide">
                How Many Days & What to Do on Rest Days
              </h2>
              <span className="text-[11px] font-mono text-[#A1A1AA]">Recovery builds muscle</span>
            </div>
          </div>
          <div className="space-y-2.5 text-xs text-[#A1A1AA] leading-relaxed">
            <p>
              <strong className="text-[#F4F4F6]">How Many Days?</strong> As a beginner, 2 to 3 workout sessions per week with at least one full day of rest in between is the sweet spot (e.g. Monday, Wednesday, Friday).
            </p>
            <p>
              <strong className="text-[#F4F4F6]">What to Do on Rest Days?</strong> Muscles do not grow in the gym—they grow while resting. Rest days do not mean lying still all day. Active recovery like a casual 20-minute walk, light stretching, drinking plenty of water, and getting 7–8 hours of sound sleep will speed up recovery.
            </p>
          </div>
        </div>
      </div>

      {/* CTA to Workout Recommender */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#16161D] via-[#16161D] to-[#24242E] border border-[#24242E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-xl font-bold uppercase text-[#F4F4F6]">
            Ready to Try Your First Session?
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Generate a personalized 5-exercise beginner routine calibrated to your equipment.
          </p>
        </div>
        <Link
          to="/recommender"
          className="px-5 py-2.5 rounded-xl bg-[#C6FF3D] hover:bg-[#d5ff6a] text-[#0B0B0F] font-heading font-black uppercase text-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-md shadow-[#C6FF3D]/10"
        >
          <span>Open Recommender</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Required Disclaimer */}
      <footer className="pt-6 border-t border-[#24242E] text-center">
        <p className="text-xs text-[#71717A] max-w-2xl mx-auto leading-relaxed">
          This is general information, not medical advice. If you have a health condition, check with your doctor before starting or changing an exercise routine.
        </p>
      </footer>
    </div>
  );
};
export default BeginnerBasicsPage;
