import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('nightasaur_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await authAPI.me();
        if (response.data) {
          setUser(response.data);
        }
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('nightasaur_token');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">My Account</h1>
              <button
                onClick={handleLogout}
                className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
              >
                Logout
              </button>
            </div>

            <div className="space-y-8">
              {/* Profile */}
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Profile</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{user?.username || 'User'}</div>
                    <div className="text-white/70">{user?.email || 'No email'}</div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Quick Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/products/ielts-immersion')}
                    className="p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors text-left"
                  >
                    <div className="font-bold">IELTS Immersion</div>
                    <div className="text-sm text-white/70">Start learning journey</div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/receipts/preview')}
                    className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-left"
                  >
                    <div className="font-bold">Receipt Preview</div>
                    <div className="text-sm text-white/70">View receipt format</div>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Account Status</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="text-yellow-400">No active plan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;