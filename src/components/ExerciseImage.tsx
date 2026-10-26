import React, { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import { nameToKebabCase } from '../models/Exercise';

export interface ExerciseImageProps {
  exerciseName: string;
  targetMuscle: string;
  imageUrl?: string;
  className?: string;
}

/**
 * ExerciseImage Component
 * Renders exercise demonstration photos with lazy/async loading,
 * strict aspect-ratio space reservation to prevent layout shift,
 * and a styled dark/lime fallback card upon load error or missing image.
 */
export const ExerciseImage: React.FC<ExerciseImageProps> = ({
  exerciseName,
  targetMuscle,
  imageUrl,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when exerciseName or imageUrl changes
  useEffect(() => {
    setHasError(false);
  }, [exerciseName, imageUrl]);

  // Derive normalized image path matching /public/exercises convention
  const resolvedSrc = imageUrl || `/exercises/${nameToKebabCase(exerciseName)}.jpg`;

  // Respect explicit width/height/aspect-ratio in className or default to aspect-[16/9] w-full
  const hasExplicitSizeOrAspect =
    className.includes('aspect-') || (className.includes('h-') && className.includes('w-'));
  const aspectClass = hasExplicitSizeOrAspect ? '' : 'w-full aspect-[16/9]';

  return (
    <div
      className={`relative overflow-hidden bg-[#16161D] flex items-center justify-center shrink-0 ${aspectClass} ${className}`}
    >
      {hasError ? (
        <div className="w-full h-full bg-[#16161D] border border-[#24242E] flex flex-col items-center justify-center p-2 text-center select-none">
          <Dumbbell className="w-6 h-6 text-[#C6FF3D] shrink-0" />
          {targetMuscle && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#0B0B0F] border border-[#24242E] text-[#A1A1AA] mt-1.5 truncate max-w-[90%]">
              {targetMuscle}
            </span>
          )}
        </div>
      ) : (
        <img
          src={resolvedSrc}
          alt={`${exerciseName} demonstration, targeting ${targetMuscle}`}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};
