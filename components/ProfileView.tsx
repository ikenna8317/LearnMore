import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from './UIComponents';
import { useAuth } from '../contexts/AuthContext';
import { progressService } from '../services/progress';

interface ProfileViewProps {
  onNavigateSettings: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigateSettings }) => {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!user) return null;

  const stats = progressService.getStats(user.id);
  const totalMinutes = Math.ceil(stats.activityHistory.reduce((acc, curr) => acc + curr.minutesSpent, 0));

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300 py-8">
      <div className="text-center">
         <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4 shadow-xl shadow-indigo-200 dark:shadow-none">
            {user.name.charAt(0).toUpperCase()}
         </div>
         <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
         <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">@{user.username || user.email.split('@')[0]}</p>
         <Badge color="indigo">Lvl {stats.level} Scholar</Badge>
      </div>

      <Card className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">Identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Display Name</label>
                <p className="font-medium text-slate-800 dark:text-slate-200">{user.name}</p>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Username</label>
                <p className="font-medium text-slate-800 dark:text-slate-200">@{user.username || 'Not set'}</p>
            </div>
            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address</label>
                <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    {user.email}
                    <Badge color="slate">Read-only</Badge>
                </p>
            </div>
        </div>
      </Card>

      <Card className="space-y-6">
         <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">Account Summary</h2>
         <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                 <p className="text-xs text-slate-500 dark:text-slate-400">Joined</p>
                 <p className="font-semibold text-slate-900 dark:text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
             </div>
             <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                 <p className="text-xs text-indigo-600 dark:text-indigo-400">Level {stats.level}</p>
                 <p className="font-semibold text-indigo-900 dark:text-indigo-200">{stats.xp.toLocaleString()} XP</p>
             </div>
             <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                 <p className="text-xs text-orange-600 dark:text-orange-400">Current Streak</p>
                 <p className="font-semibold text-orange-900 dark:text-orange-200">{stats.streakDays} Days</p>
             </div>
             <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                 <p className="text-xs text-amber-600 dark:text-amber-400">Highest Streak</p>
                 <p className="font-semibold text-amber-900 dark:text-amber-200">{stats.highestStreak || stats.streakDays} Days</p>
             </div>
             <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                 <p className="text-xs text-slate-500 dark:text-slate-400">Total Study Time</p>
                 <p className="font-semibold text-slate-900 dark:text-white">{totalMinutes} Minutes</p>
             </div>
         </div>
      </Card>

      <div className="flex gap-4">
          <Button onClick={onNavigateSettings} className="flex-1">
              Settings
          </Button>
          <Button variant="outline" onClick={() => setShowLogoutModal(true)} className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20">
              Log out
          </Button>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign Out"
        footer={
            <>
                <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
                <Button variant="danger" onClick={handleLogout}>Sign Out</Button>
            </>
        }
      >
        <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to sign out? You will need to log in again to access your study materials.
        </p>
      </Modal>
    </div>
  );
};
