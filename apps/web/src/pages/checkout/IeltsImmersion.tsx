import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IELTS_IMMERSION_1M_AU, formatAUD, formatTWD } from '../../config/products';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const product = IELTS_IMMERSION_1M_AU;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nightasaur_token');
    if (!token) {
      navigate('/login', { state: { returnTo: '/checkout/ielts-immersion' } });
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8">
            <h1 className="text-3xl font-bold mb-3 text-center">30-Day Access Plan Preview</h1>
            <p className="text-center text-white/55 mb-8">正式付款尚未開放；登入會員目前可直接使用 英語訓練對話 Early Access。</p>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Plan Summary</h2>
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{product.name.en}</h3>
                    <p className="text-white/70 text-sm">{product.name['zh-TW']}</p>
                  </div>
                  <div className="md:text-right">
                    <div className="text-2xl font-bold">{formatAUD(product.price)} AUD</div>
                    <div className="text-lg text-white/75">約 {formatTWD(product.referencePriceTwd)} TWD</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-white/70">Duration:</span><span>{product.accessDays} days</span></div>
                  <div className="flex justify-between"><span className="text-white/70">Current access:</span><span className="text-green-300">Authenticated Early Access</span></div>
                  <div className="flex justify-between"><span className="text-white/70">Paid entitlement:</span><span className="text-yellow-300">Not activated</span></div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Payment Status</h2>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
                <h3 className="font-bold text-yellow-300">Payment Integration is Being Prepared</h3>
                <p className="text-sm text-yellow-200/70 mt-2">No payment, order, entitlement or official receipt will be created from this preview.</p>
              </div>
            </div>

            <div className="mb-8 bg-white/5 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div>
                  <div className="text-lg font-bold">Future paid plan</div>
                  <div className="text-sm text-white/70">Taxes and GST treatment, where applicable, will be confirmed before payment.</div>
                </div>
                <div className="md:text-right">
                  <div className="text-3xl font-bold">{formatAUD(product.price)} AUD</div>
                  <div className="text-sm text-white/55">參考：約 {formatTWD(product.referencePriceTwd)}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate('/academy/category/ielts')} className="flex-1 px-6 py-4 bg-green-600/20 border border-green-500/30 rounded-lg text-green-200 hover:bg-green-600/30">
                直接開始 英語訓練對話 Early Access
              </button>
              <button onClick={() => navigate('/receipts/preview')} className="flex-1 px-6 py-4 border border-purple-500/30 bg-purple-500/10 rounded-lg hover:bg-purple-500/20">
                查看收據格式
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
