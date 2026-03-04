import React, { useState } from 'react';
import { Card, Button, Modal } from './UIComponents';
import { useAuth } from '../contexts/AuthContext';
import { UserPreferences } from '../types';

interface SettingsViewProps {
  onBack: () => void;
  onViewPrivacy?: () => void;
  onViewTerms?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onViewPrivacy, onViewTerms }) => {
  const { user, updateUser, changePassword } = useAuth();
  
  // Local state for form fields
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>(user?.preferences || {
      theme: 'system',
      assessmentLength: 'medium',
      noteLength: 'standard',
      emailNotifications: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  
  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveAccount = async () => {
    setIsSaving(true);
    try {
        await updateUser({ name, username, email });
        // Optional: Add toast notification here
    } catch (e) {
        alert("Failed to update account details");
    } finally {
        setIsSaving(false);
    }
  };

  const handlePreferenceChange = async (key: keyof UserPreferences, value: any) => {
      const newPrefs = { ...preferences, [key]: value };
      setPreferences(newPrefs);
      // Auto-save preferences
      try {
          await updateUser({ preferences: newPrefs });
      } catch (e) {
          console.error("Failed to save preference");
      }
  };

  const handlePasswordReset = () => {
      setPasswordModalOpen(false);
      alert(`A password reset link has been sent to ${user?.email}`);
  };

  const handleChangePasswordSubmit = async () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
          setPasswordError("All fields are required.");
          return;
      }
      if (newPassword !== confirmPassword) {
          setPasswordError("New passwords do not match.");
          return;
      }
      if (newPassword.length < 6) {
          setPasswordError("Password must be at least 6 characters.");
          return;
      }

      setIsChangingPassword(true);
      setPasswordError(null);

      try {
          await changePassword(currentPassword, newPassword);
          setChangePasswordModalOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          alert("Password updated successfully.");
      } catch (e: any) {
          setPasswordError(e.message || "Failed to update password.");
      } finally {
          setIsChangingPassword(false);
      }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>← Back to Profile</Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
      </div>

      {/* Account Settings */}
      <Card className="space-y-6">
         <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">Account Settings</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                 <input 
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                 />
             </div>
             <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                 <input 
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                 />
             </div>
             <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                 <input 
                    type="email"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                 />
                 <p className="text-xs text-slate-400 mt-1">Changing your email requires verification.</p>
             </div>
         </div>

         <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700 mt-2">
            <div className="flex gap-4 text-sm font-medium">
                <button 
                    onClick={() => setChangePasswordModalOpen(true)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                >
                    Change Password
                </button>
                <button 
                    onClick={() => setPasswordModalOpen(true)}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
                >
                    Forgot Password?
                </button>
            </div>
            <Button onClick={handleSaveAccount} isLoading={isSaving}>Save Changes</Button>
         </div>
      </Card>

      {/* Appearance */}
      <Card className="space-y-6">
         <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">Appearance</h2>
         
         <div className="flex gap-4">
             {['system', 'light', 'dark'].map((theme) => (
                 <button
                    key={theme}
                    onClick={() => handlePreferenceChange('theme', theme)}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium capitalize transition-all ${
                        preferences.theme === theme 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' 
                        : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600'
                    }`}
                 >
                    {theme}
                 </button>
             ))}
         </div>
      </Card>

      {/* Study Preferences */}
      <Card className="space-y-6">
         <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">Study Preferences</h2>
         <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4">Set your defaults for AI generation.</p>

         <div className="space-y-4">
             {/* Assessment Length */}
             <div className="flex items-center justify-between">
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Assessment Length</span>
                 <select 
                    value={preferences.assessmentLength}
                    onChange={(e) => handlePreferenceChange('assessmentLength', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
                 >
                     <option value="short">Short</option>
                     <option value="medium">Medium</option>
                     <option value="long">Long</option>
                 </select>
             </div>

             {/* Note Length */}
             <div className="flex items-center justify-between">
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Note Detail Level</span>
                 <select 
                    value={preferences.noteLength}
                    onChange={(e) => handlePreferenceChange('noteLength', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"
                 >
                     <option value="short">Short</option>
                     <option value="standard">Standard</option>
                     <option value="detailed">Detailed</option>
                 </select>
             </div>
         </div>
      </Card>

      {/* Notifications */}
      <Card className="space-y-6">
         <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">Notifications</h2>
         
         <div className="flex items-center justify-between">
             <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Email Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Receive product updates and study tips.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={preferences.emailNotifications}
                    onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
         </div>
         <p className="text-xs text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
             Note: You will always receive security emails and password reset instructions.
         </p>
      </Card>

      {/* About & Legal */}
      <div className="text-center py-6 border-t border-slate-200 dark:border-slate-800">
          <p className="font-medium text-slate-500 dark:text-slate-400 mb-2">Learn More v2.0 (Beta)</p>
          <div className="flex justify-center gap-4 text-sm">
              <button 
                onClick={onViewPrivacy}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Privacy Policy
              </button>
              <button 
                onClick={onViewTerms}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Terms of Use
              </button>
          </div>
      </div>

      {/* Password Reset Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Reset Password"
        footer={
            <>
                <Button variant="ghost" onClick={() => setPasswordModalOpen(false)}>Cancel</Button>
                <Button onClick={handlePasswordReset}>Send Reset Link</Button>
            </>
        }
      >
          <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                  We'll send a password reset link to <span className="font-bold text-slate-900 dark:text-white">{user.email}</span>.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                  Please check your inbox and spam folder.
              </p>
          </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        title="Change Password"
        footer={
            <>
                <Button variant="ghost" onClick={() => setChangePasswordModalOpen(false)} disabled={isChangingPassword}>Cancel</Button>
                <Button onClick={handleChangePasswordSubmit} isLoading={isChangingPassword}>Update Password</Button>
            </>
        }
      >
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
              </div>
              {passwordError && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{passwordError}</p>
              )}
          </div>
      </Modal>
    </div>
  );
};
