import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IELTS_IMMERSION_1M_AU, formatAUD } from '../../config/products';

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
            <h1 className="text-3xl font-bold mb-8 text-center">Checkout Preview</h1>
            
            {/* Product Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Product Summary</h2>
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{product.name.en}</h3>
                    <p className="text-white/70 text-sm">{product.name['zh-TW']}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatAUD(product.price)}</div>
                    <div className="text-sm text-white/70">{product.currency}</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Quantity:</span>
                    <span>1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Duration:</span>
                    <span>{product.accessDays} days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Payment Status</h2>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <span className="text-yellow-400">⏳</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-yellow-300">Payment Integration is Being Prepared</h3>
                    <p className="text-sm text-yellow-200/70">Real payment processing is not yet available</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="mb-8">
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold">Total Amount</div>
                    <div className="text-sm text-white/70">Including any applicable taxes</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{formatAUD(product.price)}</div>
                    <div className="text-sm text-white/70">{product.currency}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/products/ielts-immersion')}
                className="flex-1 px-6 py-4 border border-white/20 rounded-lg hover:bg-white/5 transition-colors text-center"
              >
                Back to Product
              </button>
              
              <button
                className="flex-1 px-6 py-4 bg-gray-600/50 border border-gray-600 rounded-lg text-gray-300 text-center cursor-not-allowed"
                disabled
              >
                Complete Payment (Coming Soon)
              </button>
            </div>

            {/* Important Notice */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-center text-sm text-white/50">
                <p className="mb-2">
                  This checkout preview is for demonstration purposes only.
                </p>
                <p>
                  A real payment integration will be implemented in a future update.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;