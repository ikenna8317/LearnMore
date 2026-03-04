import React, { useState, useEffect } from 'react';
import { Card, Button } from './UIComponents';
import { LevelProgress } from './LevelProgress';
import { UserStats, DailyActivity, AssessmentAttempt } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { assessmentService } from '../services/assessment';

interface StatsViewProps {
  stats: UserStats;
  onBack: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ stats, onBack }) => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);

  useEffect(() => {
    if (user) {
      const allAttempts = assessmentService.getAttempts(user.id);
      setAttempts(allAttempts);
    }
  }, [user]);

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const activity = stats.activityHistory.find(a => a.date === dateStr);
      const rawMinutes = activity ? activity.minutesSpent : 0;
      
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateStr,
        minutes: rawMinutes,
        displayMinutes: Math.ceil(rawMinutes), 
        count: activity ? activity.actionCount : 0
      });
    }
    return days;
  };

  const chartData = getLast7Days();
  const maxMinutesInWeek = Math.max(...chartData.map(d => d.minutes), 0);
  
  const getScaleConfig = (maxMins: number) => {
    const steps = [10, 20, 30, 45, 60, 90, 120, 180, 240];
    let ceiling = steps.find(s => maxMins < s);
    if (!ceiling) ceiling = Math.ceil((maxMins + 1) / 60) * 60;

    let interval = 10;
    if (ceiling === 10) interval = 5;
    else if (ceiling <= 30) interval = 10;
    else if (ceiling <= 60) interval = 15;
    else if (ceiling <= 120) interval = 30;
    else interval = 60;

    const ticks = [];
    for (let i = 0; i <= ceiling; i += interval) {
        ticks.push(i);
    }
    return { ceiling, ticks };
  };

  const { ceiling: chartCeiling, ticks } = getScaleConfig(maxMinutesInWeek);

  const StatCard = ({ label, value, icon, colorClass }: { label: string, value: string | number, icon: string, colorClass: string }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );

  const getAverageScore = (mode: 'test' | 'exam') => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentAttempts = attempts.filter(a =>
      a.mode === mode && a.timestamp >= sevenDaysAgo
    );

    if (recentAttempts.length === 0) return null;

    const totalPercentage = recentAttempts.reduce((sum, a) => {
      return sum + ((a.score / a.maxScore) * 100);
    }, 0);

    return Math.round(totalPercentage / recentAttempts.length);
  };

  const testAvg = getAverageScore('test');
  const examAvg = getAverageScore('exam');

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500';
    if (score >= 80) return 'bg-green-500 text-green-600 dark:text-green-400';
    if (score >= 50) return 'bg-indigo-500 text-indigo-600 dark:text-indigo-400';
    return 'bg-amber-500 text-amber-600 dark:text-amber-400';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Progress</h1>
      </div>

      <LevelProgress xp={stats.xp} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Day Streak" 
          value={stats.streakDays} 
          icon="🔥" 
          colorClass="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" 
        />
        <StatCard 
          label="Notes Created" 
          value={stats.materialsCreated} 
          icon="📝" 
          colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
        />
        <StatCard 
          label="Quizzes Taken" 
          value={stats.quizzesTaken} 
          icon="⚡️" 
          colorClass="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
        />
        <StatCard 
          label="Cards Reviewed" 
          value={stats.flashcardsReviewed} 
          icon="🗂" 
          colorClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex justify-between items-end mb-6">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white">Study Time (Last 7 Days)</h3>
          </div>
          
          <div className="flex h-64 pb-8 relative"> 
             <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col text-xs text-slate-400 dark:text-slate-500 font-medium pointer-events-none z-10">
                <span className="absolute -top-3 -left-1 text-[10px] uppercase tracking-wider text-slate-300 dark:text-slate-600">Minutes</span>
                {ticks.map((tick) => (
                    <span 
                        key={tick} 
                        className="absolute right-2 transform translate-y-1/2" 
                        style={{ bottom: `${(tick / chartCeiling) * 100}%` }}
                    >
                        {tick}
                    </span>
                ))}
             </div>

             <div className="ml-10 flex-1 relative border-l border-b border-slate-200 dark:border-slate-700">
                {ticks.map(tick => (
                    <div 
                        key={tick} 
                        className={`absolute w-full border-t ${tick === 0 ? 'border-transparent' : 'border-slate-100 dark:border-slate-700/50'}`} 
                        style={{ bottom: `${(tick / chartCeiling) * 100}%` }}
                    />
                ))}

                <div className="absolute inset-0 flex items-end justify-between pl-4 pr-2">
                    {chartData.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                             <div className="w-full max-w-[24px] h-full relative flex items-end justify-center">
                                <div 
                                    className="w-full bg-indigo-500 dark:bg-indigo-600 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 relative"
                                    style={{ 
                                        height: `${(day.minutes / chartCeiling) * 100}%`,
                                        minHeight: day.minutes > 0 ? '2px' : '0' 
                                    }}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
                                        {day.displayMinutes}m
                                    </div>
                                </div>
                             </div>
                             <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-3 absolute -bottom-8">{day.label}</span>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        </Card>

        <Card className="p-6">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Assessment Breakdown</h3>
           <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">Tests</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{stats.testsTaken} Lifetime Completed</span>
                    </div>
                    <div className="text-right">
                        <span className={`text-xl font-bold ${testAvg !== null ? getScoreColor(testAvg).split(' ')[1] : 'text-slate-300 dark:text-slate-600'}`}>
                           {testAvg !== null ? `${testAvg}%` : '—'}
                        </span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Avg Score (7d)</span>
                    </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(testAvg).split(' ')[0]} ${testAvg === null ? 'opacity-0' : 'opacity-80'}`}
                        style={{ width: testAvg !== null ? `${testAvg}%` : '0%' }}
                    ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">Exams</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{stats.examsTaken} Lifetime Completed</span>
                    </div>
                    <div className="text-right">
                        <span className={`text-xl font-bold ${examAvg !== null ? getScoreColor(examAvg).split(' ')[1] : 'text-slate-300 dark:text-slate-600'}`}>
                           {examAvg !== null ? `${examAvg}%` : '—'}
                        </span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Avg Score (7d)</span>
                    </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(examAvg).split(' ')[0]} ${examAvg === null ? 'opacity-0' : 'opacity-80'}`}
                        style={{ width: examAvg !== null ? `${examAvg}%` : '0%' }}
                    ></div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 dark:border-slate-700 mt-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    You have studied for a total of <span className="font-bold text-slate-900 dark:text-white">{Math.ceil(stats.activityHistory.reduce((acc, curr) => acc + curr.minutesSpent, 0))}</span> minutes across <span className="font-bold text-slate-900 dark:text-white">{stats.activityHistory.reduce((acc, curr) => acc + curr.actionCount, 0)}</span> sessions this year.
                  </p>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};