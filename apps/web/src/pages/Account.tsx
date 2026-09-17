import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client';
import { IELTS_IMMERSION_1M_AU, formatAUD, formatTWD } from '../config/products';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const product = IELTS_IMMERSION_1M_AU;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('nightasaur_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await authAPI.me();
        if (response.data) setUser(response.data);
      } catch {
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
    } catch {
      // Logout endpoint is best-effort; local token removal is authoritative for the web client.
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
              <div>
                <h1 className="text-3xl font-bold gradient-text">My Account</h1>
                <p className="text-white/50 mt-1">帳號、學習授權方案與收據中心</p>
              </div>
              <button onClick={handleLogout} className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
                Logout
              </button>
            </div>

            <div className="space-y-8">
              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 gradient-text">Profile</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center"><span className="text-2xl">👤</span></div>
                  <div>
                    <div className="text-lg font-bold">{user?.username || 'User'}</div>
                    <div className="text-white/70">{user?.email || 'No email'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/25 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div>
                    <div className="text-sm text-green-300 font-bold mb-2">IELTS EARLY ACCESS</div>
                    <h2 className="text-xl font-bold">登入會員目前可直接使用 IELTS 陪伴學習</h2>
                    <p className="text-white/60 mt-2">正式 30 天授權與付款機制尚未啟用；目前 Early Access 不代表已付款或已建立正式訂單。</p>
                  </div>
                  <button onClick={() => navigate('/academy/category/ielts')} className="btn-primary px-6 py-3 whitespace-nowrap">
                    開始 IELTS 學習
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 gradient-text">30-Day Access Plan / 30 天授權方案</h2>
                <div className="space-y-3">
                  <div className="flex justify-between gap-4"><span>Plan:</span><span className="text-right">{product.name['zh-TW']}</span></div>
                  <div className="flex justify-between"><span>List price:</span><span>{formatAUD(product.price)} AUD</span></div>
                  <div className="flex justify-between"><span>TWD reference:</span><span>約 {formatTWD(product.referencePriceTwd)}</span></div>
                  <div className="flex justify-between"><span>Duration:</span><span>{product.accessDays} days</span></div>
                  <div className="flex justify-between"><span>Sales:</span><span className="text-yellow-300">Preview — payment not open</span></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  <button onClick={() => navigate('/products/ielts-immersion')} className="flex-1 px-5 py-3 border border-white/20 rounded-lg hover:bg-white/5">查看方案</button>
                  <button onClick={() => navigate('/receipts/preview')} className="flex-1 px-5 py-3 border border-purple-500/30 bg-purple-500/10 rounded-lg hover:bg-purple-500/20">查看收據格式</button>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 gradient-text">Orders & Receipts</h2>
                <div className="space-y-3">
                  <div className="flex justify-between"><span>Orders:</span><span className="text-white/50">No paid orders yet</span></div>
                  <div className="flex justify-between"><span>Receipts:</span><span className="text-white/50">No official receipts yet</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => navigate('/spirits')} className="p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 text-left">
                  <div className="font-bold">💞 My Spirit</div><div className="text-sm text-white/70">Spirit companion</div>
                </button>
                <button onClick={() => navigate('/assistant')} className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 text-left">
                  <div className="font-bold">🤖 AI Assistant</div><div className="text-sm text-white/70">Learning support</div>
                </button>
                <button onClick={() => navigate('/academy')} className="p-4 bg-yellow-600/20 border border-yellow-500/30 rounded-lg hover:bg-yellow-600/30 text-left">
                  <div className="font-bold">📚 Learning</div><div className="text-sm text-white/70">Explore learning paths</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
