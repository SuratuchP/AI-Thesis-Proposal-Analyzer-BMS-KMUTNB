
import React from 'react';
import { StarIcon } from './icons';

interface ScoreRatingProps {
  score: number;
  maxScore?: number;
}

export const ScoreRating: React.FC<ScoreRatingProps> = ({ score, maxScore = 10 }) => {
  return (
    <div className="flex items-center">
      {Array.from({ length: maxScore }, (_, index) => (
        <StarIcon key={index} filled={index < score} />
      ))}
    </div>
  );
};