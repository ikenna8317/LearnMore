import React from 'react';
import { Card } from './UIComponents';
import { getLevelProgress } from '../services/progress';

interface LevelProgressProps {
  xp: number;
  className?: string;
  variant?: 'card' | 'minimal';
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ xp, className = "", variant = 'card' }) => {
  const { level, currentLevelXp, nextLevelXp, progressPercent } = getLevelProgress(xp);

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Lvl {level}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-none shadow-lg shadow-indigo-200 ${className}`}>
      <div className="flex justify-between items-end mb-4">
        <div>
          <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Current Level</p>
          <p className="text-5xl font-bold mt-1">{level}</p>
        </div>
        <div className="text-right">
          <p className="text-indigo-100 text-sm font-medium">Total XP</p>
          <p className="text-2xl font-bold">{xp}</p>
        </div>
      </div>
      
      <div className="relative pt-2">
        <div className="flex mb-2 items-center justify-between text-xs font-semibold text-indigo-100">
          <span>{currentLevelXp} XP</span>
          <span>{nextLevelXp} XP to Level {level + 1}</span>
        </div>
        <div className="overflow-hidden h-3 mb-1 text-xs flex rounded-full bg-black/20">
          <div 
            style={{ width: `${progressPercent}%` }} 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white/90 transition-all duration-700 ease-out"
          ></div>
        </div>
      </div>
    </Card>
  );
};
