import { Exercise } from './Exercise';

/**
 * OOP Principle: Abstraction & Information Hiding
 * ExerciseLibrary encapsulates the curated global catalog of exercises.
 * Subclasses of WorkoutPlan query this catalog for their domain-specific pools
 * without exposing internal data storage details.
 */
export class ExerciseLibrary {
  private static _instance: ExerciseLibrary;

  // Pools keyed by normalized split name
  private _pools: Map<string, Exercise[]> = new Map();

  constructor() {
    this.initializePools();
  }

  public static getInstance(): ExerciseLibrary {
    if (!ExerciseLibrary._instance) {
      ExerciseLibrary._instance = new ExerciseLibrary();
    }
    return ExerciseLibrary._instance;
  }

  private initializePools(): void {
    // 1. PUSH POOL (11 exercises: Chest, Shoulders, Triceps across Beginner, Intermediate, Advanced)
    this._pools.set('push', [
      new Exercise('push_01', 'Barbell Flat Bench Press', 'Chest', 'Barbell', 'Intermediate', 'Retract scapulae and drive heels into the floor.'),
      new Exercise('push_02', 'Chest Press Machine', 'Chest', 'Machine', 'Beginner', 'Align handles with mid-chest and push with control.'),
      new Exercise('push_03', 'Incline Dumbbell Press', 'Chest', 'Dumbbell', 'Intermediate', 'Set bench to 30 degrees to bias the clavicular upper chest.'),
      new Exercise('push_04', 'Dumbbell Flat Bench Press', 'Chest', 'Dumbbell', 'Beginner', 'Keep elbows at 45 degrees and plant feet flat.'),
      new Exercise('push_05', 'Weighted Chest Dips', 'Chest', 'Bodyweight', 'Advanced', 'Lean slightly forward to maximize lower pectoral load.'),
      new Exercise('push_06', 'Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell', 'Beginner', 'Press vertically in an arch without banging dumbbells.'),
      new Exercise('push_07', 'Standing Overhead Barbell Press', 'Shoulders', 'Barbell', 'Intermediate', 'Tighten glutes and press bar straight overhead in line with spine.'),
      new Exercise('push_08', 'Dumbbell Lateral Raises', 'Shoulders', 'Dumbbell', 'Beginner', 'Lead with elbows and pour the pitcher slightly at the apex.'),
      new Exercise('push_09', 'Cable Lateral Raises', 'Shoulders', 'Cable', 'Advanced', 'Maintain constant cable tension behind the torso.'),
      new Exercise('push_10', 'Cable Triceps Rope Pushdown', 'Triceps', 'Cable', 'Beginner', 'Pin elbows by ribs and flare rope outward at the bottom.'),
      new Exercise('push_11', 'Close-Grip Barbell Bench Press', 'Triceps', 'Barbell', 'Advanced', 'Keep grip shoulder-width and elbows tucked close to torso.'),
    ]);

    // 2. PULL POOL (11 exercises: Back, Biceps, Rear Delts across Beginner, Intermediate, Advanced)
    this._pools.set('pull', [
      new Exercise('pull_01', 'Lat Pulldown Machine', 'Back', 'Machine', 'Beginner', 'Pull bar to collarbone while maintaining an upright chest.'),
      new Exercise('pull_02', 'Seated Cable Row', 'Back', 'Cable', 'Beginner', 'Sit tall and pull handle to lower abdomen without leaning back.'),
      new Exercise('pull_03', 'Barbell Bent-Over Row', 'Back', 'Barbell', 'Intermediate', 'Hinge at hips at 45 degrees and pull elbows toward hip pockets.'),
      new Exercise('pull_04', 'One-Arm Dumbbell Row', 'Back', 'Dumbbell', 'Intermediate', 'Support hand on bench and pull elbow smoothly up to rib cage.'),
      new Exercise('pull_05', 'Bodyweight Pull-Ups', 'Back', 'Bodyweight', 'Advanced', 'Full lockout at bottom to chin clearly clearing the bar at top.'),
      new Exercise('pull_06', 'Face Pulls', 'Rear Delts', 'Cable', 'Beginner', 'Pull rope to bridge of nose with high flared elbows for rotator cuff health.'),
      new Exercise('pull_07', 'Reverse Pec Deck Fly', 'Rear Delts', 'Machine', 'Beginner', 'Squeeze shoulder blades together with a slight elbow bend.'),
      new Exercise('pull_08', 'Bent-Over Dumbbell Rear Delt Fly', 'Rear Delts', 'Dumbbell', 'Intermediate', 'Hinge torso parallel to floor and sweep dumbbells wide.'),
      new Exercise('pull_09', 'Standing Dumbbell Biceps Curl', 'Biceps', 'Dumbbell', 'Beginner', 'Supinate wrists as you curl, keeping upper arms motionless.'),
      new Exercise('pull_10', 'Barbell Biceps Curl', 'Biceps', 'Barbell', 'Intermediate', 'Keep wrists neutral and control the lowering eccentric phase.'),
      new Exercise('pull_11', 'Incline Dumbbell Hammer Curl', 'Biceps', 'Dumbbell', 'Advanced', 'Lean back on incline to target the long head and brachialis.'),
    ]);

    // 3. LEGS & CORE POOL (12 exercises: Quads, Hamstrings, Glutes, Calves, Core across levels)
    this._pools.set('legs_core', [
      new Exercise('leg_01', 'Goblet Squat', 'Quads', 'Dumbbell', 'Beginner', 'Hold dumbbell against chest and sit back between your heels.'),
      new Exercise('leg_02', '45-Degree Leg Press', 'Quads', 'Machine', 'Beginner', 'Place feet shoulder-width and avoid locking knees at full extension.'),
      new Exercise('leg_03', 'Barbell Back Squat', 'Quads', 'Barbell', 'Intermediate', 'Break at hips and knees simultaneously; break parallel depth.'),
      new Exercise('leg_04', 'Barbell Front Squat', 'Quads', 'Barbell', 'Advanced', 'Maintain high elbows in clean grip and upright spinal angle.'),
      new Exercise('leg_05', 'Romanian Deadlift', 'Hamstrings', 'Barbell', 'Intermediate', 'Hinge backward at hips with soft knees; feel deep hamstring stretch.'),
      new Exercise('leg_06', 'Seated Leg Curl Machine', 'Hamstrings', 'Machine', 'Beginner', 'Curl heels beneath seat and control the return phase.'),
      new Exercise('leg_07', 'Barbell Hip Thrust', 'Glutes', 'Barbell', 'Advanced', 'Drive hips to full extension at top while keeping chin tucked.'),
      new Exercise('leg_08', 'Dumbbell Walking Lunges', 'Glutes', 'Dumbbell', 'Intermediate', 'Take long strides with front knee staying behind front toes.'),
      new Exercise('leg_09', 'Standing Machine Calf Raise', 'Calves', 'Machine', 'Beginner', 'Pause for 1 second at full bottom stretch before driving onto toes.'),
      new Exercise('leg_10', 'Plank with Shoulder Taps', 'Core', 'Bodyweight', 'Beginner', 'Maintain rigid flat hips and alternate tapping opposite shoulder.'),
      new Exercise('leg_11', 'Hanging Knee Raises', 'Core', 'Bodyweight', 'Intermediate', 'Curl pelvis upward toward ribcage rather than just swinging legs.'),
      new Exercise('leg_12', 'Dragon Flags', 'Core', 'Bodyweight', 'Advanced', 'Brace core completely and pivot off upper back with a straight body line.'),
    ]);

    // 4. FULL BODY POOL (11 exercises: Balanced mix across muscle groups)
    this._pools.set('full_body', [
      new Exercise('full_01', 'Goblet Squat', 'Quads', 'Dumbbell', 'Beginner', 'Keep torso upright and drive through heels on ascent.'),
      new Exercise('full_02', 'Machine Chest Press', 'Chest', 'Machine', 'Beginner', 'Press handles forward smoothly without shrugging shoulders.'),
      new Exercise('full_03', 'Lat Pulldown Machine', 'Back', 'Machine', 'Beginner', 'Draw shoulder blades down and back as bar reaches upper chest.'),
      new Exercise('full_04', 'Barbell Back Squat', 'Quads', 'Barbell', 'Intermediate', 'Take deep belly breath into belt and descend with control.'),
      new Exercise('full_05', 'Barbell Bench Press', 'Chest', 'Barbell', 'Intermediate', 'Lower bar with forearms vertical to protect shoulders.'),
      new Exercise('full_06', 'Bent-Over Barbell Row', 'Back', 'Barbell', 'Intermediate', 'Pull bar to abdomen while maintaining flat lumbar spine.'),
      new Exercise('full_07', 'Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell', 'Beginner', 'Keep elbows under dumbbells and press smoothly overhead.'),
      new Exercise('full_08', 'Conventional Barbell Deadlift', 'Hamstrings', 'Barbell', 'Advanced', 'Engage lats, push floor away, and stand tall.'),
      new Exercise('full_09', 'Barbell Power Clean and Press', 'Full Body', 'Barbell', 'Advanced', 'Explosively triple-extend hips, rack on shoulders, and drive overhead.'),
      new Exercise('full_10', 'Kettlebell Russian Swings', 'Glutes', 'Dumbbell', 'Intermediate', 'Snap hips forcefully forward; the weight floats on hip momentum.'),
      new Exercise('full_11', 'Hanging Leg Raises', 'Core', 'Bodyweight', 'Advanced', 'Lift toes smoothly to the bar without momentum.'),
    ]);

    // 5. UPPER BODY POOL (11 exercises: Chest, Back, Shoulders, Arms)
    this._pools.set('upper_body', [
      new Exercise('upper_01', 'Dumbbell Flat Bench Press', 'Chest', 'Dumbbell', 'Beginner', 'Squeeze pectorals at top and control descent.'),
      new Exercise('upper_02', 'Incline Barbell Bench Press', 'Chest', 'Barbell', 'Intermediate', 'Touch upper chest and press forcefully to lockout.'),
      new Exercise('upper_03', 'Weighted Chest Dips', 'Chest', 'Bodyweight', 'Advanced', 'Keep elbows tucked and dip until chest is parallel with hands.'),
      new Exercise('upper_04', 'Seated Cable Row', 'Back', 'Cable', 'Beginner', 'Pinch shoulder blades together at end of movement.'),
      new Exercise('upper_05', 'Weighted Pull-Ups', 'Back', 'Bodyweight', 'Advanced', 'Use dipping belt for high-intensity vertical pulling.'),
      new Exercise('upper_06', 'Chest-Supported Machine Row', 'Back', 'Machine', 'Intermediate', 'Chest pad takes stress off lower back; pull elbows high.'),
      new Exercise('upper_07', 'Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell', 'Beginner', 'Press without arching your back off the bench.'),
      new Exercise('upper_08', 'Barbell Overhead Press', 'Shoulders', 'Barbell', 'Intermediate', 'Lock overhead with barbell directly centered above crown.'),
      new Exercise('upper_09', 'Dumbbell Lateral Raises', 'Shoulders', 'Dumbbell', 'Beginner', 'Focus on side delt contraction rather than heavy swinging.'),
      new Exercise('upper_10', 'Incline Dumbbell Biceps Curls', 'Biceps', 'Dumbbell', 'Intermediate', 'Arms hang vertically behind torso for maximum bicep stretch.'),
      new Exercise('upper_11', 'Cable Triceps Rope Pushdown', 'Triceps', 'Cable', 'Beginner', 'Lock elbows in place throughout the full range of motion.'),
    ]);

    // 6. HOME BODYWEIGHT POOL (11 exercises: No equipment needed)
    this._pools.set('home_bodyweight', [
      new Exercise('home_01', 'Standard Push-Ups', 'Chest', 'Bodyweight', 'Beginner', 'Rigid body line from heels to ears; touch chest to floor.'),
      new Exercise('home_02', 'Air Squats', 'Quads', 'Bodyweight', 'Beginner', 'Descend to parallel, keep heels flat, and stand tall.'),
      new Exercise('home_03', 'Glute Bridges', 'Glutes', 'Bodyweight', 'Beginner', 'Drive through heels, squeeze glutes at top for 2 seconds.'),
      new Exercise('home_04', 'Forearm Plank', 'Core', 'Bodyweight', 'Beginner', 'Tuck pelvis, contract abs tightly, and breathe steadily.'),
      new Exercise('home_05', 'Walking Lunges', 'Quads', 'Bodyweight', 'Beginner', 'Step forward smoothly; lower back knee gently to floor.'),
      new Exercise('home_06', 'Diamond Push-Ups', 'Triceps', 'Bodyweight', 'Intermediate', 'Thumbs and index fingers touching under sternum.'),
      new Exercise('home_07', 'Decline Push-Ups', 'Chest', 'Bodyweight', 'Intermediate', 'Elevate feet on chair/couch to shift resistance to upper chest.'),
      new Exercise('home_08', 'Reverse Lunges with Knee Drive', 'Glutes', 'Bodyweight', 'Intermediate', 'Step back into lunge, then explode up driving knee to chest.'),
      new Exercise('home_09', 'Side Plank with Hip Pulse', 'Core', 'Bodyweight', 'Intermediate', 'Stack feet and pulse hips upward to fire obliques.'),
      new Exercise('home_10', 'Single-Leg Pistol Squats', 'Quads', 'Bodyweight', 'Advanced', 'Extend non-working leg forward and squat down on one foot.'),
      new Exercise('home_11', 'Archer Push-Ups', 'Chest', 'Bodyweight', 'Advanced', 'Slide one arm straight out while lowering onto opposite chest.'),
    ]);

    // 7. CARDIO HIIT POOL (11 exercises: Timed intervals, high heart rate stimulus)
    this._pools.set('cardio_hiit', [
      new Exercise('hiit_01', 'Jumping Jacks', 'Full Body', 'Bodyweight', 'Beginner', 'Fast, springy footwork and wide overhead arm swings.'),
      new Exercise('hiit_02', 'Mountain Climbers', 'Core', 'Bodyweight', 'Beginner', 'Drive knees alternately toward chest in high plank tempo.'),
      new Exercise('hiit_03', 'High Knees Sprint in Place', 'Cardio', 'Bodyweight', 'Beginner', 'Pump arms and bring knees up to waist height quickly.'),
      new Exercise('hiit_04', 'Burpees with Jump', 'Full Body', 'Bodyweight', 'Intermediate', 'Drop chest to floor, snap feet in, and jump with reach.'),
      new Exercise('hiit_05', 'Dumbbell Fast Swings', 'Glutes', 'Dumbbell', 'Intermediate', 'Rapid hip drive and explosive glute contraction.'),
      new Exercise('hiit_06', 'Jump Squats', 'Quads', 'Bodyweight', 'Intermediate', 'Squat to 90 degrees and explode upward into full extension.'),
      new Exercise('hiit_07', 'Lateral Skater Hops', 'Glutes', 'Bodyweight', 'Intermediate', 'Bound side to side, absorbing landing on outside foot.'),
      new Exercise('hiit_08', 'Plank Jacks', 'Core', 'Bodyweight', 'Beginner', 'Hold rigid plank while hopping feet wide and narrow.'),
      new Exercise('hiit_09', 'Sprawls to Tuck Jump', 'Full Body', 'Bodyweight', 'Advanced', 'Drop down into sprawl, rebound up, and tuck knees to chest.'),
      new Exercise('hiit_10', 'Plyometric Alternating Lunges', 'Quads', 'Bodyweight', 'Advanced', 'Switch lunge legs dynamically in mid-air with soft landing.'),
      new Exercise('hiit_11', 'Shadow Boxing with Light Dumbbells', 'Cardio', 'Dumbbell', 'Advanced', 'Rapid punch combos while staying light and agile on toes.'),
    ]);
  }

  /**
   * Retrieves the full exercise pool for a given split key
   */
  public getPool(splitKey: string): Exercise[] {
    const normalized = splitKey.toLowerCase().replace(/[^a-z]/g, '');

    if (normalized.includes('push')) return [...(this._pools.get('push') || [])];
    if (normalized.includes('pull')) return [...(this._pools.get('pull') || [])];
    if (normalized.includes('leg')) return [...(this._pools.get('legs_core') || [])];
    if (normalized.includes('full')) return [...(this._pools.get('full_body') || [])];
    if (normalized.includes('upper')) return [...(this._pools.get('upper_body') || [])];
    if (normalized.includes('home') || normalized.includes('bodyweight')) return [...(this._pools.get('home_bodyweight') || [])];
    if (normalized.includes('cardio') || normalized.includes('hiit')) return [...(this._pools.get('cardio_hiit') || [])];

    // Default fallback
    return [...(this._pools.get('push') || [])];
  }

  /**
   * Returns all unique exercises cataloged across all pools
   */
  public getAllExercises(): Exercise[] {
    const map = new Map<string, Exercise>();
    this._pools.forEach((pool) => {
      pool.forEach((ex) => {
        if (!map.has(ex.name)) {
          map.set(ex.name, ex);
        }
      });
    });
    return Array.from(map.values());
  }
}
