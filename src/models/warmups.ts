/**
 * Pre-Workout Warm-up Models and Routine Generator
 * Provides beginner-friendly 4-6 move warm-up routines (approx 5 minutes)
 * tailored to the muscle groups in the workout.
 */

export interface WarmUpMove {
  id: string;
  name: string;
  category: 'upper' | 'lower' | 'core' | 'full' | 'cardio';
  targetMuscles: string;
  durationOrReps: string;
  description: string;
  tip?: string;
}

export interface WarmUpRoutine {
  splitKey: string;
  title: string;
  subtitle: string;
  targetArea: string;
  estimatedMinutes: number;
  moves: WarmUpMove[];
  firstExerciseWarmupNote: string;
}

const SESSION_SKIP_KEY = 'fitforge_skip_warmup';

/**
 * Check if the user has opted to skip warm-ups for this browser session.
 */
export function isWarmUpSkippedForSession(): boolean {
  try {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(SESSION_SKIP_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Persist or clear the user's skip choice for the current browser session only.
 */
export function setWarmUpSkippedForSession(skipped: boolean): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    if (skipped) {
      sessionStorage.setItem(SESSION_SKIP_KEY, 'true');
    } else {
      sessionStorage.removeItem(SESSION_SKIP_KEY);
    }
  } catch {
    // safe
  }
}

// ------------------- WARM-UP MOVES LIBRARY -------------------

export const WARMUP_MOVES: Record<string, WarmUpMove> = {
  arm_circles: {
    id: 'arm_circles',
    name: 'Arm Circles',
    category: 'upper',
    targetMuscles: 'Shoulders & Rotator Cuff',
    durationOrReps: '30 seconds (15s forward, 15s backward)',
    description: 'Hold arms straight out to your sides. Make small to medium circles, keeping shoulders relaxed away from your ears.',
    tip: 'Reverse direction halfway through to warm up all sides of the shoulder joints.',
  },
  band_pull_aparts: {
    id: 'band_pull_aparts',
    name: 'Band Pull-Aparts / Chest Openers',
    category: 'upper',
    targetMuscles: 'Upper Back & Rear Shoulders',
    durationOrReps: '12–15 reps',
    description: 'Hold a light band or towel with straight arms in front of your chest. Pull your hands apart until the band touches your chest, squeezing your shoulder blades.',
    tip: 'If you do not have a band, simply open your arms wide with thumbs pointing back and squeeze your shoulder blades.',
  },
  scapular_pushups: {
    id: 'scapular_pushups',
    name: 'Scapular Push-ups / Wall Slides',
    category: 'upper',
    targetMuscles: 'Serratus, Chest & Shoulders',
    durationOrReps: '10–12 reps',
    description: 'In a high plank or against a wall, keep arms locked straight. Squeeze your shoulder blades together, then push the ground or wall away to spread them wide.',
    tip: 'Your elbows do not bend—the movement happens entirely in your upper back and shoulders.',
  },
  torso_twists: {
    id: 'torso_twists',
    name: 'Gentle Torso Twists',
    category: 'upper',
    targetMuscles: 'Spine & Core Mobility',
    durationOrReps: '30 seconds',
    description: 'Stand with feet shoulder-width apart, hands lightly on your chest or hips. Slowly twist your torso from side to side in a relaxed, rhythmic motion.',
    tip: 'Let your back heel pivot naturally as you turn to keep your knees comfortable.',
  },
  wrist_forearm_rolls: {
    id: 'wrist_forearm_rolls',
    name: 'Wrist & Forearm Rotations',
    category: 'upper',
    targetMuscles: 'Wrists & Forearms',
    durationOrReps: '30 seconds',
    description: 'Clasp your fingers together and roll your wrists in a figure-8 motion. Then gently bend wrists backward and forward.',
    tip: 'Crucial for barbell presses, push-ups, and dumbbell curls to prevent wrist strain.',
  },
  cat_cow_stretch: {
    id: 'cat_cow_stretch',
    name: 'Cat-Cow Mobility',
    category: 'upper',
    targetMuscles: 'Spine, Upper Back & Neck',
    durationOrReps: '8–10 gentle cycles',
    description: 'On all fours, inhale while dropping your belly and lifting your chest (Cow). Then exhale while rounding your spine toward the ceiling (Cat).',
    tip: 'Move slowly with your breathing to release tension in the mid-back and neck.',
  },
  bodyweight_squats: {
    id: 'bodyweight_squats',
    name: 'Bodyweight Squats',
    category: 'lower',
    targetMuscles: 'Hips, Quads & Glutes',
    durationOrReps: '10–12 smooth reps',
    description: 'Stand with feet shoulder-width apart. Push your hips back and bend knees like sitting into a sturdy chair, then stand back up.',
    tip: 'Keep your chest tall and heels firmly planted on the floor.',
  },
  hip_circles: {
    id: 'hip_circles',
    name: 'Hip Circles & Open the Gate',
    category: 'lower',
    targetMuscles: 'Hip Flexors & Glutes',
    durationOrReps: '10 reps per leg',
    description: 'Stand tall (hold a wall if needed). Lift your knee up, circle it out to the side, and place it down. Then reverse the circle.',
    tip: 'Lubricates the hip socket and unlocks tight hip flexors before squats and lunges.',
  },
  leg_swings: {
    id: 'leg_swings',
    name: 'Dynamic Leg Swings',
    category: 'lower',
    targetMuscles: 'Hamstrings, Hip Flexors & Adductors',
    durationOrReps: '10 swings per leg',
    description: 'Lightly touch a wall for balance. Gently swing one leg forward and backward like a pendulum, then across your body side to side.',
    tip: 'Start small and gradually increase the range of motion as your legs loosen up.',
  },
  glute_bridges: {
    id: 'glute_bridges',
    name: 'Glute Bridges',
    category: 'lower',
    targetMuscles: 'Gluteals & Lower Back',
    durationOrReps: '10–12 reps with 2s hold',
    description: 'Lie on your back with knees bent and feet flat on the floor. Squeeze your buttocks and lift your hips until your thighs and torso form a straight line.',
    tip: 'Wakes up your glutes so your lower back does not do all the work during your lifts.',
  },
  ankle_mobility: {
    id: 'ankle_mobility',
    name: 'Ankle Rotations & Calf Bounces',
    category: 'lower',
    targetMuscles: 'Ankles & Calves',
    durationOrReps: '30 seconds',
    description: 'Rotate each ankle in slow circles 5 times in each direction, followed by 15 seconds of gentle bouncing on the balls of your feet.',
    tip: 'Good ankle mobility lets you squat deeper with better form and zero knee pinch.',
  },
  inchworms: {
    id: 'inchworms',
    name: 'Inchworms to Plank',
    category: 'full',
    targetMuscles: 'Hamstrings, Shoulders & Core',
    durationOrReps: '5–6 reps',
    description: 'Stand tall, hinge at your hips, and touch the floor. Walk your hands forward into a high plank, pause for a second, then walk your hands back.',
    tip: 'Bend your knees slightly if your hamstrings feel tight—focus on a smooth crawl.',
  },
  high_knees_march: {
    id: 'high_knees_march',
    name: 'Brisk March / Light High Knees',
    category: 'cardio',
    targetMuscles: 'Total Body & Cardiovascular',
    durationOrReps: '45–60 seconds',
    description: 'March or gently jog in place, driving your knees upward toward your waist and swinging your arms naturally.',
    tip: 'Keep it gentle and low impact—we want to raise your body temperature, not tire you out.',
  },
  dynamic_side_lunges: {
    id: 'dynamic_side_lunges',
    name: 'Dynamic Side Lunges',
    category: 'lower',
    targetMuscles: 'Groin, Quads & Inner Thighs',
    durationOrReps: '10 reps (5 each side)',
    description: 'Take a wide step out to the side, sink your hips back on that leg while keeping the other leg straight, then push back to center and switch.',
    tip: 'Opens the groin and prepares your hips for lateral stability.',
  },
};

/**
 * Classify workout into Upper, Lower, Full Body, or Cardio based on split key and exercise targets.
 */
export function classifyWorkoutFocus(
  splitKey?: string | null,
  exercises?: { targetMuscle?: string; name?: string }[]
): 'upper' | 'lower' | 'full' | 'cardio' {
  const normalizedKey = (splitKey || '').toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (normalizedKey.includes('cardio') || normalizedKey.includes('hiit') || normalizedKey.includes('walk')) {
    return 'cardio';
  }

  if (normalizedKey.includes('leg') || normalizedKey.includes('lower')) {
    return 'lower';
  }

  if (
    normalizedKey.includes('push') ||
    normalizedKey.includes('pull') ||
    normalizedKey.includes('upper')
  ) {
    return 'upper';
  }

  if (normalizedKey.includes('full') || normalizedKey.includes('home') || normalizedKey.includes('bodyweight')) {
    return 'full';
  }

  // Inspect exercise list if split is custom or unclassified
  if (exercises && exercises.length > 0) {
    let upperCount = 0;
    let lowerCount = 0;

    exercises.forEach((ex) => {
      const target = (ex.targetMuscle || '').toLowerCase();
      const name = (ex.name || '').toLowerCase();
      const combined = `${target} ${name}`;

      if (
        combined.includes('chest') ||
        combined.includes('shoulder') ||
        combined.includes('delt') ||
        combined.includes('back') ||
        combined.includes('lat') ||
        combined.includes('bicep') ||
        combined.includes('tricep') ||
        combined.includes('press') ||
        combined.includes('row') ||
        combined.includes('pull')
      ) {
        upperCount++;
      }

      if (
        combined.includes('leg') ||
        combined.includes('quad') ||
        combined.includes('hamstring') ||
        combined.includes('glute') ||
        combined.includes('calf') ||
        combined.includes('squat') ||
        combined.includes('lunge') ||
        combined.includes('hip')
      ) {
        lowerCount++;
      }
    });

    if (upperCount >= 3 && lowerCount <= 1) return 'upper';
    if (lowerCount >= 3 && upperCount <= 1) return 'lower';
    return 'full';
  }

  return 'full';
}

/**
 * Generates an appropriate 4–6 move warm-up routine (~5 minutes)
 * with beginner-friendly wording, reps/duration, and a first-exercise priming note.
 */
export function getWarmUpRoutine(
  splitKey?: string | null,
  exercises?: { targetMuscle?: string; name?: string }[]
): WarmUpRoutine {
  const focus = classifyWorkoutFocus(splitKey, exercises);
  const firstExercise = exercises && exercises.length > 0 ? exercises[0].name : 'your first exercise';

  const firstExerciseWarmupNote = `Tip for your first exercise: Before starting your heavy working sets on ${firstExercise}, do 1–2 light warm-up sets using an empty bar or very light weight for 8–10 easy reps. This primes your nervous system and reinforces safe form.`;

  switch (focus) {
    case 'upper':
      return {
        splitKey: splitKey || 'upper',
        title: 'Upper Body Warm-up',
        subtitle: 'Shoulders, chest, upper back, and wrists',
        targetArea: 'Upper Torso & Arms',
        estimatedMinutes: 5,
        moves: [
          WARMUP_MOVES.arm_circles,
          WARMUP_MOVES.band_pull_aparts,
          WARMUP_MOVES.scapular_pushups,
          WARMUP_MOVES.torso_twists,
          WARMUP_MOVES.wrist_forearm_rolls,
        ],
        firstExerciseWarmupNote,
      };

    case 'lower':
      return {
        splitKey: splitKey || 'lower',
        title: 'Lower Body & Core Warm-up',
        subtitle: 'Hips, knees, ankles, glutes, and thighs',
        targetArea: 'Legs, Hips & Core',
        estimatedMinutes: 5,
        moves: [
          WARMUP_MOVES.bodyweight_squats,
          WARMUP_MOVES.hip_circles,
          WARMUP_MOVES.leg_swings,
          WARMUP_MOVES.glute_bridges,
          WARMUP_MOVES.ankle_mobility,
        ],
        firstExerciseWarmupNote,
      };

    case 'cardio':
      return {
        splitKey: splitKey || 'cardio',
        title: 'Cardio & Mobility Warm-up',
        subtitle: 'Gradual heart rate increase and joint dynamic stretches',
        targetArea: 'Cardiovascular & Full Body',
        estimatedMinutes: 5,
        moves: [
          WARMUP_MOVES.high_knees_march,
          WARMUP_MOVES.arm_circles,
          WARMUP_MOVES.bodyweight_squats,
          WARMUP_MOVES.dynamic_side_lunges,
          WARMUP_MOVES.torso_twists,
        ],
        firstExerciseWarmupNote,
      };

    case 'full':
    default:
      return {
        splitKey: splitKey || 'full',
        title: 'Full Body Dynamic Warm-up',
        subtitle: 'Total body mobility, joint priming, and circulation',
        targetArea: 'Total Body',
        estimatedMinutes: 5,
        moves: [
          WARMUP_MOVES.high_knees_march,
          WARMUP_MOVES.arm_circles,
          WARMUP_MOVES.bodyweight_squats,
          WARMUP_MOVES.hip_circles,
          WARMUP_MOVES.inchworms,
        ],
        firstExerciseWarmupNote,
      };
  }
}
