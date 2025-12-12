import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const accentColor = '#00FFA3';
const backgroundClasses = 'bg-gradient-to-br from-gray-900 via-black to-gray-800';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleAuthSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!data.session) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: new URLSearchParams(window.location.hash).get('#access_token'),
          refresh_token: new URLSearchParams(window.location.hash).get('refresh_token'),
        });

        if (sessionError) {
          setError(sessionError.message || "Invalid or expired session.");
        }
      }
    };
    handleAuthSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className={`${backgroundClasses} min-h-screen flex items-center justify-center`}>
        <div className="bg-[rgba(0,0,0,0.6)] backdrop-blur-lg p-8 rounded-3xl text-center max-w-sm w-full">
          <h2 className="text-2xl font-bold text-white mb-4">Password Updated</h2>
          <a href="/auth" className="inline-block px-6 py-2 rounded-lg font-semibold text-black" style={{ background: accentColor }}>
            Back to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`${backgroundClasses} min-h-screen flex items-center justify-center`}>
      <div className="bg-[rgba(0,0,0,0.6)] backdrop-blur-lg p-8 rounded-3xl max-w-sm w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Set a New Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input
            type="password"
            placeholder="New Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-transparent border border-gray-600 rounded-lg text-white focus:border-white transition"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full p-3 bg-transparent border border-gray-600 rounded-lg text-white focus:border-white transition"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-lg font-semibold transform hover:scale-105 transition"
            style={{ background: accentColor }}
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
