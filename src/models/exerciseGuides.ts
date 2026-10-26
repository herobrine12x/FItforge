import { nameToKebabCase } from './Exercise';

export interface ExerciseGuide {
  setup: string[];
  steps: string[];
  breathing: string;
  commonMistakes: string[];
  safetyTips: string[];
  easierOption: string;
  harderOption: string;
  feelsLike: string;
}

export const SAFETY_WORDING = 'Stop and rest if you feel sharp pain, dizziness or unwell.';

// Curated beginner-friendly exercise guides keyed by canonical kebab-case name
const GUIDES_BY_SLUG: Record<string, ExerciseGuide> = {
  // ================= PUSH BEGINNER EXERCISES =================
  'chest-press-machine': {
    setup: [
      'Adjust seat height so handles sit level with your mid-chest.',
      'Sit with back and head flat against the back pad, feet firmly on the floor.',
      'Grip handles firmly with elbows slightly below shoulder height.',
    ],
    steps: [
      'Press handles away until arms are almost straight without locking elbows.',
      'Pause briefly for a count of one while squeezing your chest.',
      'Slowly return the handles back until you feel a gentle chest stretch.',
    ],
    breathing: 'Breathe out as you press away; breathe in as you lower the weight back.',
    commonMistakes: [
      'Shrugging shoulders up toward your ears during the press.',
      'Bouncing the weight stack at the bottom of the movement.',
      'Arching your lower back off the pad.',
    ],
    safetyTips: [
      'Set the starting pin so your hands do not get pulled behind your chest.',
      'Keep your wrists straight in line with your forearms.',
    ],
    easierOption: 'Reduce pin weight or push with a slightly smaller range of motion.',
    harderOption: 'Hold the press for 2 seconds at full extension before slowly returning.',
    feelsLike: 'You should feel effort across the middle of your chest and back of your arms. Mild muscle fatigue is normal, but sharp pain in your front shoulder is not.',
  },

  'dumbbell-flat-bench-press': {
    setup: [
      'Sit on flat bench with dumbbells resting on your thighs.',
      'Lie back smoothly, bringing dumbbells over your chest with palms facing forward.',
      'Plant feet flat on the floor and keep shoulder blades pulled together.',
    ],
    steps: [
      'Lower dumbbells slowly until elbows reach about bench level (45-degree angle to body).',
      'Pause briefly with dumbbells just outside your chest.',
      'Press dumbbells smoothly back up until arms are extended above your chest.',
    ],
    breathing: 'Breathe in as you lower the dumbbells; breathe out as you press them up.',
    commonMistakes: [
      'Flaring elbows straight out to the sides at 90 degrees.',
      'Clanking dumbbells together at the top of the movement.',
      'Lifting your feet off the floor.',
    ],
    safetyTips: [
      'Choose weights you can control without needing to jerk your body.',
      'To finish, bring knees up to catch dumbbells before sitting up.',
    ],
    easierOption: 'Use lighter dumbbells or try the chest press machine for extra guidance.',
    harderOption: 'Add a 3-second lowering count on every repetition.',
    feelsLike: 'You should feel tension in your chest and the front of your shoulders. Mild muscle burn is normal, but sharp shoulder joint pain is not.',
  },

  'dumbbell-shoulder-press': {
    setup: [
      'Sit upright on a bench with back support, feet flat on the ground.',
      'Hold dumbbells at shoulder height with elbows under your wrists.',
      'Keep your chest up and tighten your stomach muscles gently.',
    ],
    steps: [
      'Press dumbbells straight up overhead in a smooth arch until arms are long.',
      'Stop just before your elbows lock out.',
      'Lower the weights with control back to ear level.',
    ],
    breathing: 'Breathe out as you press upward; breathe in as you lower the weights.',
    commonMistakes: [
      'Arching your lower back off the bench to push heavier weight.',
      'Letting elbows drop too far below shoulder height at the bottom.',
      'Pressing dumbbells far in front of your head.',
    ],
    safetyTips: [
      'If your shoulders pinch, turn palms slightly inward toward each other.',
      'Do not tilt your head back or strain your neck.',
    ],
    easierOption: 'Perform one arm at a time or use lighter dumbbells with elbows turned slightly inward.',
    harderOption: 'Pause for 1 second at the top overhead position before lowering.',
    feelsLike: 'You should feel work on top of your shoulders and triceps. Mild muscular burning is normal, but sharp pinching in the shoulder joint is not.',
  },

  'dumbbell-lateral-raises': {
    setup: [
      'Stand tall with feet hip-width apart and knees soft.',
      'Hold light dumbbells at your sides with palms facing your thighs.',
      'Brace your core and roll your shoulders back and down.',
    ],
    steps: [
      'Raise both arms out to the sides with a slight bend in your elbows.',
      'Lift until your hands are level with your shoulders.',
      'Lower the dumbbells slowly back down to your sides.',
    ],
    breathing: 'Breathe out as your arms lift out; breathe in as you lower them down.',
    commonMistakes: [
      'Swinging your hips and torso to build momentum.',
      'Lifting arms higher than shoulder height.',
      'Using dumbbells that are too heavy.',
    ],
    safetyTips: [
      'Keep your elbows slightly in front of your body rather than straight out to the sides.',
      'Think of pouring water out of a pitcher at the top.',
    ],
    easierOption: 'Use very light weights or do the movement seated on a bench.',
    harderOption: 'Pause for a full 2-second hold at shoulder level before lowering.',
    feelsLike: 'You should feel your outer shoulder muscles burning. Mild muscle ache is normal, but neck strain or sharp shoulder joint pain is not.',
  },

  'cable-triceps-rope-pushdown': {
    setup: [
      'Attach a rope handle to a high cable pulley and face the stack.',
      'Grip the rope ends with palms facing each other and take a small step back.',
      'Tuck elbows in close to your ribs and hinge forward slightly from your hips.',
    ],
    steps: [
      'Push the rope down by straightening your elbows toward the floor.',
      'Spread the rope ends slightly outward at the bottom of the movement.',
      'Slowly let hands rise back up to chest height while keeping elbows pinned.',
    ],
    breathing: 'Breathe out as you push down; breathe in as you let hands return up.',
    commonMistakes: [
      'Allowing your elbows to swing forward and backward like hinges.',
      'Leaning your whole body weight over the cable stack to push.',
      'Letting the rope pull your arms up too fast.',
    ],
    safetyTips: [
      'Keep your wrists locked and steady throughout each rep.',
      'Stay balanced on both feet without hunching your spine.',
    ],
    easierOption: 'Step closer to the pulley or lower the weight pin.',
    harderOption: 'Hold the bottom lockout for 2 seconds on every repetition.',
    feelsLike: 'You should feel tension in the backs of your arms (triceps). Mild muscle soreness is normal, but elbow joint discomfort is not.',
  },

  // ================= PULL BEGINNER EXERCISES =================
  'lat-pulldown-machine': {
    setup: [
      'Sit facing the machine and slide your thighs under the padded roller snugly.',
      'Stand up briefly to grip the wide bar slightly wider than your shoulders.',
      'Sit back down with chest tall and feet flat on the floor.',
    ],
    steps: [
      'Pull the bar down toward your upper chest, leading with your elbows.',
      'Squeeze your shoulder blades down and back as the bar nears your collarbone.',
      'Slowly allow the bar to rise back up until your arms are fully extended.',
    ],
    breathing: 'Breathe out as you pull the bar down; breathe in as the bar rises.',
    commonMistakes: [
      'Pulling the bar behind your neck (always pull to the front).',
      'Leaning way back and using body swing to move the bar.',
      'Letting the weight plates crash at the top.',
    ],
    safetyTips: [
      'Adjust thigh pads firmly so your knees do not lift off the floor.',
      'Keep your chest proud and do not hunch forward.',
    ],
    easierOption: 'Choose a lighter pin weight or try an underhand narrow grip.',
    harderOption: 'Take 3 full seconds to return the bar to the top on every rep.',
    feelsLike: 'You should feel work under your armpits and across your upper back. Mild muscle fatigue is normal, but neck or shoulder pinch is not.',
  },

  'seated-cable-row': {
    setup: [
      'Sit on the bench facing the low pulley and place feet on footrests with soft knees.',
      'Reach forward with a flat back and grip the double-D handle.',
      'Sit upright with spine tall, shoulders back, and arms straight.',
    ],
    steps: [
      'Pull the handle toward your belly button by driving elbows backward.',
      'Pinch your shoulder blades together firmly at the end of the pull.',
      'Control the handle as it travels back forward, stopping before your back rounds.',
    ],
    breathing: 'Breathe out as you pull the handle in; breathe in as arms straighten out.',
    commonMistakes: [
      'Rocking back and forth from your hips on every repetition.',
      'Rounding your lower back as the weight pulls you forward.',
      'Pulling the handle up toward your throat.',
    ],
    safetyTips: [
      'Never lock your knees out straight on the footrests.',
      'Keep your torso still and let your arms and back do the pulling.',
    ],
    easierOption: 'Lighten the weight and focus solely on the shoulder-blade squeeze.',
    harderOption: 'Pause and squeeze your shoulder blades for 2 seconds at your belly button.',
    feelsLike: 'You should feel your mid-back muscles working between your shoulder blades. Mild fatigue is expected, but lower-back tightness or strain is not.',
  },

  'face-pulls': {
    setup: [
      'Set the cable pulley to eye height and attach a rope attachment.',
      'Grip the rope with thumbs pointing backward toward your face.',
      'Step back so the cable is tight and stagger your feet for balance.',
    ],
    steps: [
      'Pull the center of the rope straight toward the bridge of your nose.',
      'Flare your elbows high and pull the rope ends apart past your ears.',
      'Slowly return hands forward until arms are long.',
    ],
    breathing: 'Breathe out as you pull toward your face; breathe in as hands return forward.',
    commonMistakes: [
      'Using heavy weight that causes your torso to lean back.',
      'Dropping your elbows down by your ribs instead of keeping them high.',
      'Rushing through the movement without feeling the rear shoulders.',
    ],
    safetyTips: [
      'Use light weight; this is for shoulder posture and rotator cuff health.',
      'Keep your chin tucked and neck relaxed.',
    ],
    easierOption: 'Use a lighter resistance band anchored to a post.',
    harderOption: 'Hold the rear contraction behind your ears for a full 2-second count.',
    feelsLike: 'You should feel tension in the backs of your shoulders and upper back. Mild warmth is normal, but neck pinch is not.',
  },

  'reverse-pec-deck-fly': {
    setup: [
      'Sit facing into the machine pad with your chest supported.',
      'Adjust seat height so handles are level with your mid-chest.',
      'Reach forward and hold the vertical handles with a slight bend in your elbows.',
    ],
    steps: [
      'Sweep your arms out and backward in a wide circle.',
      'Squeeze the backs of your shoulders as your arms reach your sides.',
      'Slowly guide handles back to the start without letting the weight stack slam.',
    ],
    breathing: 'Breathe out as you sweep arms back; breathe in as they return forward.',
    commonMistakes: [
      'Bending and straightening your elbows instead of keeping them softly fixed.',
      'Lifting your chest off the support pad.',
      'Shrugging your shoulders upward.',
    ],
    safetyTips: [
      'Keep your head neutral without pressing your forehead into the pad.',
      'Keep your wrists firm and neutral.',
    ],
    easierOption: 'Reduce pin weight and focus on a smooth, wide sweep.',
    harderOption: 'Add a 2-second hold at the furthest point backward.',
    feelsLike: 'You should feel the back edge of your shoulders working. Muscle fatigue is expected, but neck ache or sharp joint twinges are not.',
  },

  'standing-dumbbell-biceps-curl': {
    setup: [
      'Stand tall with feet shoulder-width apart and knees slightly unlocked.',
      'Hold a dumbbell in each hand by your thighs, palms facing each other.',
      'Pull shoulders back, tuck elbows near your ribs, and brace your core.',
    ],
    steps: [
      'Curl the dumbbells up toward your shoulders, turning palms up as you lift.',
      'Squeeze your biceps at the top without letting elbows move forward.',
      'Lower the weights slowly until your arms are straight again.',
    ],
    breathing: 'Breathe out as you curl upward; breathe in as you lower the weights.',
    commonMistakes: [
      'Swinging your torso back and forth to hoist the dumbbells.',
      'Drifting elbows forward in front of your body to make the rep easier.',
      'Dropping the weights down quickly instead of controlling the descent.',
    ],
    safetyTips: [
      'Keep wrists straight so you do not strain your forearm tendons.',
      'If you have to swing, the weight is too heavy.',
    ],
    easierOption: 'Curl one dumbbell at a time or sit on a bench with back support.',
    harderOption: 'Take 3 slow seconds to lower the dumbbells on every single rep.',
    feelsLike: 'You should feel effort directly in the front of your upper arms (biceps). Mild muscle tightness is normal, but wrist or elbow pain is not.',
  },

  // ================= LEGS & CORE BEGINNER EXERCISES =================
  'goblet-squat': {
    setup: [
      'Hold one dumbbell vertically against your chest with both hands under the top plate.',
      'Stand with feet slightly wider than shoulder-width, toes pointed slightly outward.',
      'Brace your stomach muscles as if preparing for a gentle bump.',
    ],
    steps: [
      'Bend knees and push hips back as if sitting into a sturdy chair.',
      'Lower down until your thighs are parallel with the floor or as comfortable.',
      'Push through your entire foot to stand back up to a tall position.',
    ],
    breathing: 'Breathe in as you sit down; breathe out forcefully as you stand up.',
    commonMistakes: [
      'Letting your knees cave inward toward each other.',
      'Lifting your heels off the floor when descending.',
      'Rounding your upper back and letting the dumbbell pull you forward.',
    ],
    safetyTips: [
      'Keep your chest high and gaze forward.',
      'Only squat as deep as you can while keeping your heels flat on the floor.',
    ],
    easierOption: 'Squat to a bench or chair, or perform bodyweight air squats first.',
    harderOption: 'Pause at the bottom of the squat for 2 seconds before standing up.',
    feelsLike: 'You should feel your thighs, hips, and core working together. Mild burning in the thigh muscles is normal, but knee joint pain is not.',
  },

  '45-degree-leg-press': {
    setup: [
      'Sit in the machine with your back and hips firmly pressed into the seat.',
      'Place feet flat on the sled platform hip-width apart in the center.',
      'Release the safety catch handles while keeping your feet flat.',
    ],
    steps: [
      'Slowly bend your knees to lower the sled toward your chest until knees reach 90 degrees.',
      'Pause for a beat without letting your lower back peel off the back pad.',
      'Press through the middle of your feet to push the sled back to start.',
    ],
    breathing: 'Breathe in as the sled lowers toward you; breathe out as you push it away.',
    commonMistakes: [
      'Locking your knees out completely straight at the top (never lock knees).',
      'Placing feet so low on the plate that your heels rise off the platform.',
      'Letting your lower back curl off the bottom of the seat cushion.',
    ],
    safetyTips: [
      'Always keep a micro-bend in your knees at the top of every rep.',
      'Engage the safety catch whenever you are done or need to rest.',
    ],
    easierOption: 'Reduce plate weight and focus on smooth, steady knee bending.',
    harderOption: 'Slow down the lowering phase to a count of 3 seconds.',
    feelsLike: 'You should feel strong effort in your quadriceps and glutes. Mild muscle burn is normal, but pressure inside the knee joint is not.',
  },

  'seated-leg-curl-machine': {
    setup: [
      'Sit with your back against the backrest and knee joint aligned with the machine pivot.',
      'Adjust the padded leg lever so it rests just below your calves above your ankles.',
      'Lower the top thigh pad snugly against your thighs to hold you secure.',
    ],
    steps: [
      'Pull your heels backward and under the seat by bending your knees.',
      'Squeeze the backs of your thighs firmly at the bottom of the curl.',
      'Slowly let your legs straighten back out with control.',
    ],
    breathing: 'Breathe out as you curl heels inward; breathe in as your legs return.',
    commonMistakes: [
      'Kicking or jerking the pad with momentum.',
      'Lifting your hips up off the seat during the curl.',
      'Allowing the weight plates to crash down between reps.',
    ],
    safetyTips: [
      'Make sure the machine pivot point matches the bend of your knees.',
      'Hold the side handgrips to keep your hips anchored.',
    ],
    easierOption: 'Lighten the weight stack to ensure you can reach a full curl.',
    harderOption: 'Hold the peak hamstring squeeze under the seat for 2 seconds.',
    feelsLike: 'You should feel the backs of your legs (hamstrings) contracting. Muscle tiredness is expected, but pulling behind the knee joint is not.',
  },

  'standing-machine-calf-raise': {
    setup: [
      'Step onto the calf block with the balls of your feet on the edge and heels hanging off.',
      'Position shoulder pads comfortably over your shoulders and stand tall.',
      'Release the safety bar and keep your knees straight but not snapped shut.',
    ],
    steps: [
      'Lower your heels toward the floor to feel a deep stretch in your calves.',
      'Press through the balls of your feet to raise your heels as high as possible.',
      'Pause for a count of one at the very top on your tiptoes.',
    ],
    breathing: 'Breathe out as you rise up onto your toes; breathe in as heels sink down.',
    commonMistakes: [
      'Bouncing rapidly at the bottom without controlling the stretch.',
      'Bending and straightening knees instead of moving only from the ankles.',
      'Rolling ankles outward to the sides.',
    ],
    safetyTips: [
      'Maintain a small bend in knees to protect the knee joint.',
      'Keep your core braced so your lower back does not arch.',
    ],
    easierOption: 'Perform on flat ground or without extra shoulder weight first.',
    harderOption: 'Pause for 2 full seconds in the bottom stretch before rising.',
    feelsLike: 'You should feel your calf muscles working hard and stretching. Mild burn is expected, but sharp Achilles tendon pain is not.',
  },

  'plank-with-shoulder-taps': {
    setup: [
      'Start in a push-up position with hands directly under your shoulders.',
      'Spread your feet slightly wider than shoulder-width for a stable base.',
      'Squeeze your stomach, glutes, and thighs to form a straight line from head to heels.',
    ],
    steps: [
      'Shift weight slightly to your left hand without letting your hips tilt.',
      'Lift your right hand and tap your left shoulder lightly.',
      'Place right hand back on the floor, then tap right shoulder with left hand.',
    ],
    breathing: 'Breathe steadily and evenly through your nose and mouth; never hold your breath.',
    commonMistakes: [
      'Rocking hips side to side like a boat during taps.',
      'Sagging the lower back down toward the floor.',
      'Sticking your hips high into the air.',
    ],
    safetyTips: [
      'Keep your hands right below your shoulders to prevent wrist strain.',
      'Widen your feet if you find it hard to keep your hips level.',
    ],
    easierOption: 'Drop knees to the ground into a modified knee-plank while tapping shoulders.',
    harderOption: 'Bring your feet closer together to challenge your core balance.',
    feelsLike: 'You should feel your stomach, shoulders, and hips working to keep you still. Core fatigue is expected, but lower back pinching is not.',
  },

  // ================= HOME BODYWEIGHT BEGINNER EXERCISES =================
  'standard-push-ups': {
    setup: [
      'Place hands on the floor slightly wider than your shoulders with fingers forward.',
      'Step feet back so your body forms a straight line from head to heels.',
      'Tighten your abs and glutes so your hips do not sag.',
    ],
    steps: [
      'Lower your chest toward the floor by bending elbows back at a 45-degree angle.',
      'Stop when your chest hovers about two inches above the ground.',
      'Push through your palms to press your body back up to the top.',
    ],
    breathing: 'Breathe in as you lower down; breathe out as you push the floor away.',
    commonMistakes: [
      'Sagging the hips or arching the lower back.',
      'Flaring elbows out wide in a T-shape next to your neck.',
      'Craning your neck down to touch your chin to the floor first.',
    ],
    safetyTips: [
      'Keep your neck neutral by looking at a spot a few inches ahead of your hands.',
      'If your form breaks, take a short rest or move to an incline.',
    ],
    easierOption: 'Place hands on a wall, counter, or sturdy bench to reduce bodyweight load.',
    harderOption: 'Slow down to a 3-second descent on every rep.',
    feelsLike: 'You should feel work across your chest, front shoulders, and triceps. Muscle exhaustion is normal, but shoulder or wrist pain is not.',
  },

  'air-squats': {
    setup: [
      'Stand with feet shoulder-width apart, toes pointing slightly outward.',
      'Keep your chest proud and hands together in front of your chest or at your hips.',
      'Distribute your weight evenly across your whole foot.',
    ],
    steps: [
      'Hinge at your hips and bend your knees as if sitting back into an armchair.',
      'Lower down until thighs are roughly parallel to the floor.',
      'Push through the middle of your feet to stand straight back up.',
    ],
    breathing: 'Breathe in as you lower down; breathe out as you push up to stand.',
    commonMistakes: [
      'Letting your knees collapse inward on the way down or up.',
      'Rising onto your toes and lifting your heels.',
      'Rounding your lower back as you reach bottom depth.',
    ],
    safetyTips: [
      'Keep your chest facing forward rather than staring at your shoes.',
      'Squat only as deep as you can maintain good upright posture.',
    ],
    easierOption: 'Squat to a chair or bench, sitting down gently and standing up.',
    harderOption: 'Hold the bottom position for 2 seconds before standing.',
    feelsLike: 'You should feel work in your thighs and glutes. Mild muscle tiredness is normal, but knee joint pain is not.',
  },

  'glute-bridges': {
    setup: [
      'Lie on your back on a mat with knees bent and feet flat on the floor hip-width apart.',
      'Place arms flat by your sides with palms down.',
      'Position feet so fingertips can lightly brush your heels.',
    ],
    steps: [
      'Press through your heels and squeeze your glutes to lift your hips toward the ceiling.',
      'Raise hips until your body makes a straight line from shoulders to knees.',
      'Hold the top position for a count of one, then slowly lower hips back to the mat.',
    ],
    breathing: 'Breathe out as you lift your hips; breathe in as you lower down.',
    commonMistakes: [
      'Over-arching your lower back at the top instead of squeezing your glutes.',
      'Pushing off your toes rather than through your heels.',
      'Letting your knees splay out wide or fall inward.',
    ],
    safetyTips: [
      'Keep your neck and shoulders relaxed flat on the mat.',
      'Stop raising hips if you feel tension shifting into your lower back.',
    ],
    easierOption: 'Place feet slightly wider or lift hips only halfway up.',
    harderOption: 'Perform single-leg glute bridges with one leg extended in the air.',
    feelsLike: 'You should feel your glutes (buttocks) and backs of thighs working. Muscle tightness is expected, but lower-back aching is not.',
  },

  'forearm-plank': {
    setup: [
      'Lie face down on a mat and place elbows directly beneath your shoulders.',
      'Rest forearms flat on the floor pointing straight forward.',
      'Tuck toes and lift your knees and torso so only forearms and toes touch the ground.',
    ],
    steps: [
      'Squeeze your stomach, glutes, and thighs together tightly.',
      'Maintain a rigid straight line from the back of your head to your heels.',
      'Hold this steady posture without moving for the target duration.',
    ],
    breathing: 'Take slow, steady breaths in through your nose and out through your mouth.',
    commonMistakes: [
      'Holding your breath (always keep breathing smoothly).',
      'Sagging your hips toward the floor.',
      'Poking your hips high into the air.',
    ],
    safetyTips: [
      'Do not allow your shoulder blades to collapse together; press gently away from the floor.',
      'If your lower back starts to ache, drop knees down immediately.',
    ],
    easierOption: 'Drop knees to the mat while keeping hips in line with your shoulders.',
    harderOption: 'Alternate lifting one foot an inch off the floor for 5 seconds at a time.',
    feelsLike: 'You should feel your entire abdominal wall and shoulders bracing. Core shaking is normal, but lower back pinching is not.',
  },

  'walking-lunges': {
    setup: [
      'Stand tall with feet hip-width apart and hands on your hips or by your sides.',
      'Pick a spot straight ahead to look at for balance.',
      'Engage your abdominal muscles gently.',
    ],
    steps: [
      'Step forward with your right foot about 2 to 3 feet.',
      'Bend both knees to lower your body until back knee gently hovers above the floor.',
      'Push off your front heel to step your back leg forward into the next lunge.',
    ],
    breathing: 'Breathe in as you step and lower; breathe out as you push up and forward.',
    commonMistakes: [
      'Stepping on a tightrope (keep feet hip-width wide for balance).',
      'Letting the front knee shoot far past your front toes.',
      'Slamming the back knee into the hard floor.',
    ],
    safetyTips: [
      'Keep your torso upright and avoid leaning forward over your front thigh.',
      'Hold onto a wall or handrail if you feel unsteady.',
    ],
    easierOption: 'Perform stationary reverse lunges in place next to a wall for support.',
    harderOption: 'Hold light dumbbells in each hand as you lunge forward.',
    feelsLike: 'You should feel work in both front thighs and hips. Mild leg fatigue is normal, but knee joint pain is not.',
  },

  'prone-superman-extensions': {
    setup: [
      'Lie face down on a comfortable mat with legs straight.',
      'Extend arms straight overhead along the floor.',
      'Keep your neck neutral with gaze pointing directly at the mat.',
    ],
    steps: [
      'Gently lift your chest, arms, and feet 2 to 3 inches off the ground.',
      'Squeeze your glutes and lower back muscles at the top.',
      'Hold for 2 seconds, then smoothly lower back down to the floor.',
    ],
    breathing: 'Breathe out as you lift up; breathe in as you lower back down.',
    commonMistakes: [
      'Jerking your neck up toward the ceiling.',
      'Trying to lift too high and hyper-extending the spine.',
      'Holding your breath during the hold.',
    ],
    safetyTips: [
      'Keep movements small, gentle, and controlled.',
      'Keep your forehead looking down at the mat to protect your neck.',
    ],
    easierOption: 'Lift only your arms, or only your legs, rather than both together.',
    harderOption: 'Hold the top lifted position for a full 4 seconds before lowering.',
    feelsLike: 'You should feel gentle tension down the length of your spine and in your glutes. Mild engagement is normal, but sharp back twinges are not.',
  },

  // ================= CARDIO HIIT BEGINNER EXERCISES =================
  'jumping-jacks': {
    setup: [
      'Stand tall with feet together and arms hanging at your sides.',
      'Keep your knees soft and stay light on the balls of your feet.',
      'Look straight ahead with shoulders relaxed.',
    ],
    steps: [
      'Hop your feet out to the sides while raising arms overhead until hands clap or meet.',
      'Land softly on the balls of your feet with knees gently bent.',
      'Hop your feet back together while bringing arms back to your sides.',
    ],
    breathing: 'Breathe in rhythm with your hops in a steady cadence.',
    commonMistakes: [
      'Landing heavily with locked knees on flat feet.',
      'Letting your arms flop halfway up instead of reaching overhead.',
      'Holding your breath as heart rate rises.',
    ],
    safetyTips: [
      'Wear supportive athletic shoes to cushion each landing.',
      'Slow down your pace if you feel your breathing becoming ragged.',
    ],
    easierOption: 'Step one foot out to the side at a time without jumping (step jacks).',
    harderOption: 'Speed up your hopping tempo while maintaining a full overhead arm reach.',
    feelsLike: 'You should feel your heart pumping, lungs working, and calves springy. Deep breathing is normal, but dizziness or chest tightness is not.',
  },

  'mountain-climbers': {
    setup: [
      'Start in a push-up position with hands directly under your shoulders.',
      'Keep your body in a straight plank with feet hip-width apart.',
      'Grip the floor with your fingers and brace your core.',
    ],
    steps: [
      'Drive your right knee forward toward your chest without touching the floor.',
      'Quickly step the right foot back while driving the left knee forward.',
      'Continue alternating legs in a steady, rhythmic cadence.',
    ],
    breathing: 'Breathe continuously in a steady rhythm with your alternating steps.',
    commonMistakes: [
      'Bouncing your hips high in the air.',
      'Letting your shoulders drift behind your wrists.',
      'Stomping your toes hard into the ground.',
    ],
    safetyTips: [
      'Keep your wrists right under your shoulders to avoid arm fatigue.',
      'Prioritize a flat back over fast leg speed.',
    ],
    easierOption: 'Slow down to single steps, or place hands on an elevated bench.',
    harderOption: 'Increase your cadence into a quick sprint pace while keeping hips level.',
    feelsLike: 'You should feel your abdominal muscles, shoulders, and cardiovascular system working hard. Heavy breathing is normal, but wrist or lower-back ache is not.',
  },

  'high-knees-sprint-in-place': {
    setup: [
      'Stand tall with feet hip-width apart and arms bent at 90 degrees.',
      'Stay light on the balls of your feet with chest up.',
      'Look straight ahead and engage your core.',
    ],
    steps: [
      'Drive one knee up toward your hip level while pumping the opposite arm.',
      'Land lightly on the ball of your foot and immediately drive the opposite knee up.',
      'Continue running in place with high knees in a bouncy rhythm.',
    ],
    breathing: 'Breathe rhythmically in through your nose and out through your mouth.',
    commonMistakes: [
      'Leaning backward as you lift your knees.',
      'Slapping feet down flat and heavily.',
      'Keeping knees low instead of lifting toward waist height.',
    ],
    safetyTips: [
      'Keep a slight forward lean from the ankles, not from the waist.',
      'Land softly with bent knees to absorb impact.',
    ],
    easierOption: 'March in place, lifting each knee high without hopping.',
    harderOption: 'Pump arms faster and bring knees above hip height on every stride.',
    feelsLike: 'You should feel your heart beating fast, hip flexors working, and calves springing. Sweating and heavy breathing are normal, but dizziness is not.',
  },

  'plank-jacks': {
    setup: [
      'Assume a forearm or high push-up plank position with feet together.',
      'Hands or elbows should be directly underneath your shoulders.',
      'Squeeze your core and glutes to keep your back flat.',
    ],
    steps: [
      'Hop both feet out wide to the sides, similar to a jumping jack.',
      'Land softly on your toes with hips remaining level.',
      'Immediately hop both feet back together to the center.',
    ],
    breathing: 'Exhale as you hop feet outward; inhale as you hop back together.',
    commonMistakes: [
      'Letting your hips bounce up and down with each hop.',
      'Allowing your lower back to sag toward the floor.',
      'Moving your hands around during the foot hops.',
    ],
    safetyTips: [
      'Keep your head neutral and focus on locking your torso steady.',
      'Step rather than jump if your lower back feels tired.',
    ],
    easierOption: 'Step one foot out to the side at a time, then back to center.',
    harderOption: 'Speed up the hopping pace without any hip bounce.',
    feelsLike: 'You should feel your stomach, shoulders, and calves burning. Elevated heart rate is expected, but lower back strain is not.',
  },
};

/**
 * Generates a helpful generic guide based on equipment and target muscle
 * to ensure that ANY exercise in the library always has a complete, clear instruction set.
 */
function buildGenericGuide(
  exerciseName: string,
  equipment: string = 'General',
  targetMuscle: string = 'Full Body'
): ExerciseGuide {
  const isBodyweight = equipment.toLowerCase().includes('bodyweight');
  const isDumbbell = equipment.toLowerCase().includes('dumbbell');
  const isBarbell = equipment.toLowerCase().includes('barbell');
  const isMachine = equipment.toLowerCase().includes('machine');
  const isCable = equipment.toLowerCase().includes('cable');

  let setup: string[];
  if (isMachine) {
    setup = [
      `Adjust the machine seat and pads so the pivot aligns naturally with your joints.`,
      `Sit or position your body with spine flat and supported against the back cushion.`,
      `Select a light starting weight and grip the handles firmly.`,
    ];
  } else if (isCable) {
    setup = [
      `Set the cable pulley height and attach the appropriate handle.`,
      `Grip the attachment firmly and take a small step back to establish line tension.`,
      `Stand with a balanced stance and tighten your core for stability.`,
    ];
  } else if (isDumbbell) {
    setup = [
      `Select a pair of dumbbells you can lift with steady control.`,
      `Stand or sit tall with feet flat on the floor and shoulders relaxed down.`,
      `Hold the weights firmly with wrists straight in line with your forearms.`,
    ];
  } else if (isBarbell) {
    setup = [
      `Position the bar at collarbone or mid-shin height according to the lift.`,
      `Grip the bar evenly with thumbs wrapped securely around the knurling.`,
      `Plant feet firmly, brace your abdomen, and pull shoulder blades back.`,
    ];
  } else {
    // Bodyweight
    setup = [
      `Find an open, flat floor space with enough clearance to move freely.`,
      `Set your feet or hands securely in position with fingers or toes spread.`,
      `Brace your core muscles to create a rigid, stable torso.`,
    ];
  }

  const steps = [
    `Initiate the movement by contracting your ${targetMuscle.toLowerCase()} muscles with steady control.`,
    `Move through a comfortable, full range of motion without jerking or using body swing.`,
    `Pause for one count at the peak contraction while maintaining good posture.`,
    `Lower or return to the starting position in a slow, controlled cadence.`,
  ];

  const breathing = `Breathe out during the effort phase; breathe in smoothly as you return to the start.`;

  const commonMistakes = [
    `Using momentum or swinging your body instead of working the ${targetMuscle.toLowerCase()}.`,
    `Rushing through the return phase instead of lowering with control.`,
    `Holding your breath during the repetition.`,
  ];

  const safetyTips = [
    `Keep your spine in a natural neutral alignment throughout each repetition.`,
    `Start with light resistance until the movement pattern feels completely natural.`,
  ];

  const easierOption = isBodyweight
    ? 'Perform a modified version with reduced range of motion or with elevated hands/knees.'
    : 'Lower the weight resistance by 20% to master technique first.';

  const harderOption =
    'Add a 2-second pause at the peak contraction point on every repetition.';

  const feelsLike = `You should feel the primary work in your ${targetMuscle.toLowerCase()}. Mild muscle tiredness is normal, but sharp or sudden pain is not.`;

  return {
    setup,
    steps,
    breathing,
    commonMistakes,
    safetyTips,
    easierOption,
    harderOption,
    feelsLike,
  };
}

/**
 * Retrieves the complete guide for an exercise.
 * Looks up by canonical kebab-case name, and falls back to a tailored generic guide
 * so that no exercise ever shows an empty instruction set.
 */
export function getExerciseGuide(
  exerciseName: string,
  equipment: string = 'Bodyweight',
  targetMuscle: string = 'Full Body'
): ExerciseGuide {
  const slug = nameToKebabCase(exerciseName);
  if (GUIDES_BY_SLUG[slug]) {
    return GUIDES_BY_SLUG[slug];
  }

  return buildGenericGuide(exerciseName, equipment, targetMuscle);
}
