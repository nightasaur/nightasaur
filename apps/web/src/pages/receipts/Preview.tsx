import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IELTS_IMMERSION_1M_AU, formatAUD } from '../../config/products';

const ReceiptPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const product = IELTS_IMMERSION_1M_AU;

  useEffect(() => {
    const token = localStorage.getItem('nightasaur_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <div className="inline-block bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-3 rounded-full mb-4">
                <span className="font-bold">PREVIEW - NOT PAID</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Nightasaur Receipt Preview</h1>
              <p className="text-white/70">No actual payment has been processed</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Item Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">{product.name.en}</div>
                      <div className="text-sm text-white/70">{product.name['zh-TW']}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatAUD(product.price)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">⏳</div>
                  <div>
                    <div className="font-bold text-yellow-300">Payment Status: NOT PAID</div>
                    <div className="text-sm text-yellow-200/70">Preview only - no payment processed</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>{formatAUD(product.price)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-4 border-t border-white/10">
                    <span>Total:</span>
                    <span>{formatAUD(product.price)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
                <h4 className="font-bold mb-3 text-blue-300">Important Notes:</h4>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Preview only - no payment processed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Final receipt generated after confirmed payment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Not a tax invoice</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={() => navigate('/products/ielts-immersion')}
                className="flex-1 px-6 py-4 border border-white/20 rounded-lg hover:bg-white/5 transition-colors text-center"
              >
                View Product
              </button>
              
              <button
                onClick={() => navigate('/checkout/ielts-immersion')}
                className="flex-1 px-6 py-4 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-600/30 transition-colors text-center"
              >
                Go to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewPage;