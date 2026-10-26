================================================================================
FITFORGE - EXERCISE IMAGE ASSETS SPECIFICATION & REGISTRY
================================================================================
This file indexes every exercise defined in the FitForge ExerciseLibrary across
all 7 workout splits (Push, Pull, Legs & Core, Full Body, Upper Body,
Home Bodyweight, Cardio HIIT).

All image assets are expected to be located at:
/exercises/<kebab-case-name>.jpg

Derived using the canonical nameToKebabCase rule in src/models/Exercise.ts:
name.toLowerCase().trim().replace(/[/\\()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '.jpg'

--------------------------------------------------------------------------------
1. PUSH SPLIT POOL
--------------------------------------------------------------------------------
1.  Barbell Flat Bench Press
    Expected Filename: /exercises/barbell-flat-bench-press.jpg
    Target Muscle: Chest | Equipment: Barbell | Difficulty: Intermediate

2.  Chest Press Machine
    Expected Filename: /exercises/chest-press-machine.jpg
    Target Muscle: Chest | Equipment: Machine | Difficulty: Beginner

3.  Incline Dumbbell Press
    Expected Filename: /exercises/incline-dumbbell-press.jpg
    Target Muscle: Chest | Equipment: Dumbbell | Difficulty: Intermediate

4.  Dumbbell Flat Bench Press
    Expected Filename: /exercises/dumbbell-flat-bench-press.jpg
    Target Muscle: Chest | Equipment: Dumbbell | Difficulty: Beginner

5.  Weighted Chest Dips
    Expected Filename: /exercises/weighted-chest-dips.jpg
    Target Muscle: Chest | Equipment: Bodyweight | Difficulty: Advanced

6.  Dumbbell Shoulder Press
    Expected Filename: /exercises/dumbbell-shoulder-press.jpg
    Target Muscle: Shoulders | Equipment: Dumbbell | Difficulty: Beginner

7.  Standing Overhead Barbell Press
    Expected Filename: /exercises/standing-overhead-barbell-press.jpg
    Target Muscle: Shoulders | Equipment: Barbell | Difficulty: Intermediate

8.  Dumbbell Lateral Raises
    Expected Filename: /exercises/dumbbell-lateral-raises.jpg
    Target Muscle: Shoulders | Equipment: Dumbbell | Difficulty: Beginner

9.  Cable Lateral Raises
    Expected Filename: /exercises/cable-lateral-raises.jpg
    Target Muscle: Shoulders | Equipment: Cable | Difficulty: Advanced

10. Cable Triceps Rope Pushdown
    Expected Filename: /exercises/cable-triceps-rope-pushdown.jpg
    Target Muscle: Triceps | Equipment: Cable | Difficulty: Beginner

11. Close-Grip Barbell Bench Press
    Expected Filename: /exercises/close-grip-barbell-bench-press.jpg
    Target Muscle: Triceps | Equipment: Barbell | Difficulty: Advanced

--------------------------------------------------------------------------------
2. PULL SPLIT POOL
--------------------------------------------------------------------------------
12. Lat Pulldown Machine
    Expected Filename: /exercises/lat-pulldown-machine.jpg
    Target Muscle: Back | Equipment: Machine | Difficulty: Beginner

13. Seated Cable Row
    Expected Filename: /exercises/seated-cable-row.jpg
    Target Muscle: Back | Equipment: Cable | Difficulty: Beginner

14. Barbell Bent-Over Row
    Expected Filename: /exercises/barbell-bent-over-row.jpg
    Target Muscle: Back | Equipment: Barbell | Difficulty: Intermediate

15. One-Arm Dumbbell Row
    Expected Filename: /exercises/one-arm-dumbbell-row.jpg
    Target Muscle: Back | Equipment: Dumbbell | Difficulty: Intermediate

16. Assisted Pull-Up Machine
    Expected Filename: /exercises/assisted-pull-up-machine.jpg
    Target Muscle: Back | Equipment: Machine | Difficulty: Advanced

17. Face Pulls
    Expected Filename: /exercises/face-pulls.jpg
    Target Muscle: Rear Delts | Equipment: Cable | Difficulty: Beginner

18. Reverse Pec Deck Fly
    Expected Filename: /exercises/reverse-pec-deck-fly.jpg
    Target Muscle: Rear Delts | Equipment: Machine | Difficulty: Beginner

19. Bent-Over Dumbbell Rear Delt Fly
    Expected Filename: /exercises/bent-over-dumbbell-rear-delt-fly.jpg
    Target Muscle: Rear Delts | Equipment: Dumbbell | Difficulty: Intermediate

20. Standing Dumbbell Biceps Curl
    Expected Filename: /exercises/standing-dumbbell-biceps-curl.jpg
    Target Muscle: Biceps | Equipment: Dumbbell | Difficulty: Beginner

21. Barbell Biceps Curl
    Expected Filename: /exercises/barbell-biceps-curl.jpg
    Target Muscle: Biceps | Equipment: Barbell | Difficulty: Intermediate

22. Incline Dumbbell Hammer Curl
    Expected Filename: /exercises/incline-dumbbell-hammer-curl.jpg
    Target Muscle: Biceps | Equipment: Dumbbell | Difficulty: Advanced

--------------------------------------------------------------------------------
3. LEGS & CORE SPLIT POOL
--------------------------------------------------------------------------------
23. Goblet Squat
    Expected Filename: /exercises/goblet-squat.jpg
    Target Muscle: Quads | Equipment: Dumbbell | Difficulty: Beginner

24. 45-Degree Leg Press
    Expected Filename: /exercises/45-degree-leg-press.jpg
    Target Muscle: Quads | Equipment: Machine | Difficulty: Beginner

25. Barbell Back Squat
    Expected Filename: /exercises/barbell-back-squat.jpg
    Target Muscle: Quads | Equipment: Barbell | Difficulty: Intermediate

26. Barbell Front Squat
    Expected Filename: /exercises/barbell-front-squat.jpg
    Target Muscle: Quads | Equipment: Barbell | Difficulty: Advanced

27. Romanian Deadlift
    Expected Filename: /exercises/romanian-deadlift.jpg
    Target Muscle: Hamstrings | Equipment: Barbell | Difficulty: Intermediate

28. Seated Leg Curl Machine
    Expected Filename: /exercises/seated-leg-curl-machine.jpg
    Target Muscle: Hamstrings | Equipment: Machine | Difficulty: Beginner

29. Barbell Hip Thrust
    Expected Filename: /exercises/barbell-hip-thrust.jpg
    Target Muscle: Glutes | Equipment: Barbell | Difficulty: Advanced

30. Dumbbell Walking Lunges
    Expected Filename: /exercises/dumbbell-walking-lunges.jpg
    Target Muscle: Glutes | Equipment: Dumbbell | Difficulty: Intermediate

31. Standing Machine Calf Raise
    Expected Filename: /exercises/standing-machine-calf-raise.jpg
    Target Muscle: Calves | Equipment: Machine | Difficulty: Beginner

32. Plank with Shoulder Taps
    Expected Filename: /exercises/plank-with-shoulder-taps.jpg
    Target Muscle: Core | Equipment: Bodyweight | Difficulty: Beginner

33. Hanging Knee Raises
    Expected Filename: /exercises/hanging-knee-raises.jpg
    Target Muscle: Core | Equipment: Bodyweight | Difficulty: Intermediate

34. Dragon Flags
    Expected Filename: /exercises/dragon-flags.jpg
    Target Muscle: Core | Equipment: Bodyweight | Difficulty: Advanced

--------------------------------------------------------------------------------
4. FULL BODY SPLIT POOL
--------------------------------------------------------------------------------
35. Goblet Squat
    Expected Filename: /exercises/goblet-squat.jpg
    Target Muscle: Quads | Equipment: Dumbbell | Difficulty: Beginner

36. Machine Chest Press
    Expected Filename: /exercises/machine-chest-press.jpg
    Target Muscle: Chest | Equipment: Machine | Difficulty: Beginner

37. Lat Pulldown Machine
    Expected Filename: /exercises/lat-pulldown-machine.jpg
    Target Muscle: Back | Equipment: Machine | Difficulty: Beginner

38. Barbell Back Squat
    Expected Filename: /exercises/barbell-back-squat.jpg
    Target Muscle: Quads | Equipment: Barbell | Difficulty: Intermediate

39. Barbell Bench Press
    Expected Filename: /exercises/barbell-bench-press.jpg
    Target Muscle: Chest | Equipment: Barbell | Difficulty: Intermediate

40. Bent-Over Barbell Row
    Expected Filename: /exercises/bent-over-barbell-row.jpg
    Target Muscle: Back | Equipment: Barbell | Difficulty: Intermediate

41. Dumbbell Shoulder Press
    Expected Filename: /exercises/dumbbell-shoulder-press.jpg
    Target Muscle: Shoulders | Equipment: Dumbbell | Difficulty: Beginner

42. Conventional Barbell Deadlift
    Expected Filename: /exercises/conventional-barbell-deadlift.jpg
    Target Muscle: Hamstrings | Equipment: Barbell | Difficulty: Advanced

43. Barbell Power Clean and Press
    Expected Filename: /exercises/barbell-power-clean-and-press.jpg
    Target Muscle: Full Body | Equipment: Barbell | Difficulty: Advanced

44. Kettlebell Russian Swings
    Expected Filename: /exercises/kettlebell-russian-swings.jpg
    Target Muscle: Glutes | Equipment: Dumbbell | Difficulty: Intermediate

45. Hanging Leg Raises
    Expected Filename: /exercises/hanging-leg-raises.jpg
    Target Muscle: Core | Equipment: Bodyweight | Difficulty: Advanced

--------------------------------------------------------------------------------
5. UPPER BODY SPLIT POOL
--------------------------------------------------------------------------------
46. Dumbbell Flat Bench Press
    Expected Filename: /exercises/dumbbell-flat-bench-press.jpg
    Target Muscle: Chest | Equipment: Dumbbell | Difficulty: Beginner

47. Incline Barbell Bench Press
    Expected Filename: /exercises/incline-barbell-bench-press.jpg
    Target Muscle: Chest | Equipment: Barbell | Difficulty: Intermediate

48. Weighted Chest Dips
    Expected Filename: /exercises/weighted-chest-dips.jpg
    Target Muscle: Chest | Equipment: Bodyweight | Difficulty: Advanced

49. Seated Cable Row
    Expected Filename: /exercises/seated-cable-row.jpg
    Target Muscle: Back | Equipment: Cable | Difficulty: Beginner

50. Weighted Pull-Ups
    Expected Filename: /exercises/weighted-pull-ups.jpg
    Target Muscle: Back | Equipment: Bodyweight | Difficulty: Advanced

51. Chest-Supported Machine Row
    Expected Filename: /exercises/chest-supported-machine-row.jpg
    Target Muscle: Back | Equipment: Machine | Difficulty: Intermediate

52. Dumbbell Shoulder Press
    Expected Filename: /exercises/dumbbell-shoulder-press.jpg
    Target Muscle: Shoulders | Equipment: Dumbbell | Difficulty: Beginner

53. Barbell Overhead Press
    Expected Filename: /exercises/barbell-overhead-press.jpg
    Target Muscle: Shoulders | Equipment: Barbell | Difficulty: Intermediate

54. Dumbbell Lateral Raises
    Expected Filename: /exercises/dumbbell-lateral-raises.jpg
    Target Muscle: Shoulders | Equipment: Dumbbell | Difficulty: Beginner

55. Incline Dumbbell Biceps Curls
    Expected Filename: /exercises/incline-dumbbell-biceps-curls.jpg
    Target Muscle: Biceps | Equipment: Dumbbell | Difficulty: Intermediate

56. Cable Triceps Rope Pushdown
    Expected Filename: /exercises/cable-triceps-rope-pushdown.jpg
    Target Muscle: Triceps | Equipment: Cable | Difficulty: Beginner

--------------------------------------------------------------------------------
6. HOME BODYWEIGHT SPLIT POOL (EQUIPMENT-FREE)
--------------------------------------------------------------------------------
57. Standard Push-Ups
    Expected Filename: /exercises/standard-push-ups.jpg
    Target Muscle: Chest | Equipment: Bodyweight | Difficulty: Beginner

58. Air Squats
    Expected Filename: /exercises/air-squats.jpg
    Target Muscle: Quads | Equipment: Bodyweight | Difficulty: Beginner

59. Glute Bridges
    Expected Filename: /exercises/glute-bridges.jpg
    Target Muscle: Glutes | Equipment: Bodyweight | Difficulty: Beginner

60. Forearm Plank
    Expected Filename: /exercises/forearm-plank.jpg
    Target Muscle: Core | Equipment: Bodyweight | Difficulty: Beginner

61. Walking Lunges
    Expected Filename: /exercises/walking-lunges.jpg
    Target Muscle: Quads | Equipment: Bodyweight | Difficulty: Beginner

62. Diamond Push-Ups
    Expected Filename: /exercises/diamond-push-ups.jpg
    Target Muscle: Triceps | Equipment: Bodyweight | Difficulty: Intermediate

63. Decline Push-Ups
    Expected Filename: /exercises/decline-push-ups.jpg
    Target Muscle: Chest | Equipment: Bodyweight | Difficulty: Intermediate

64. Doorway Inverted Rows
    Expected Filename: /exercises/doorway-inverted-rows.jpg
    Target Muscle: Back | Equipment: Bodyweight | Difficulty: Intermediate

65. Prone Superman Extensions
    Expected Filename: /exercises/prone-superman-extensions.jpg
    Target Muscle: Back | Equipment: Bodyweight | Difficulty: Beginner

66. Single-Leg Pistol Squats
    Expected Filename: /exercises/single-leg-pistol-squats.jpg
    Target Muscle: Quads | Equipment: Bodyweight | Difficulty: Advanced

67. Archer Push-Ups
    Expected Filename: /exercises/archer-push-ups.jpg
    Target Muscle: Chest | Equipment: Bodyweight | Difficulty: Advanced

--------------------------------------------------------------------------------
7. CARDIO HIIT SPLIT POOL (TIMED INTERVALS)
--------------------------------------------------------------------------------
68. Jumping Jacks
    Expected Filename: /exercises/jumping-jacks.jpg
    Target Muscle: Full Body | Equipment: Bodyweight | Difficulty: Beginner

69. Mountain Climbers
    Expected Filename: /exercises/mountain-climbers.jpg
    Target Muscle: Core | Equipment: Bodyweight | Difficulty: Beginner

70. High Knees Sprint in Place
    Expected Filename: /exercises/high-knees-sprint-in-place.jpg
    Target Muscle: Cardio | Equipment: Bodyweight | Difficulty: Beginner

71. Burpees with Jump
    Expected Filename: /exercises/burpees-with-jump.jpg
    Target Muscle: Full Body | Equipment: Bodyweight | Difficulty: Intermediate

72. Dumbbell Fast Swings
    Expected Filename: /exercises/dumbbell-fast-swings.jpg
    Target Muscle: Glutes | Equipment: Dumbbell | Difficulty: Intermediate

73. Jump Squats
    Expected Filename: /exercises/jump-squats.jpg
    Target Muscle: Quads | Equipment: Bodyweight | Difficulty: Intermediate

74. Lateral Skater Hops
    Expected Filename: /exercises/lateral-skater-hops.jpg
    Target Muscle: Glutes | Equipment: Bodyweight | Difficulty: Intermediate

75. Plank Jacks
    Expected Filename: /exercises/plank-jacks.jpg
    Target Muscle: Core | Equipment: Bodyweight | Difficulty: Beginner

76. Sprawls to Tuck Jump
    Expected Filename: /exercises/sprawls-to-tuck-jump.jpg
    Target Muscle: Full Body | Equipment: Bodyweight | Difficulty: Advanced

77. Plyometric Alternating Lunges
    Expected Filename: /exercises/plyometric-alternating-lunges.jpg
    Target Muscle: Quads | Equipment: Bodyweight | Difficulty: Advanced

78. Shadow Boxing with Light Dumbbells
    Expected Filename: /exercises/shadow-boxing-with-light-dumbbells.jpg
    Target Muscle: Cardio | Equipment: Dumbbell | Difficulty: Advanced
================================================================================
