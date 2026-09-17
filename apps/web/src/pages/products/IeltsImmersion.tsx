import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IELTS_IMMERSION_1M_AU, formatAUD } from '../../config/products';

const ProductPage: React.FC = () => {
  const navigate = useNavigate();
  const product = IELTS_IMMERSION_1M_AU;

  const handleStartJourney = () => {
    const token = localStorage.getItem('nightasaur_token');
    if (token) {
      navigate('/checkout/ielts-immersion');
    } else {
      navigate('/login', { state: { returnTo: '/checkout/ielts-immersion' } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="glass-card p-8 mb-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-2/3">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-4xl font-black mb-4 neon-text">{product.name.en}</h1>
                  {product.salesStatus === 'preview' && (
                    <div className="bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-lg text-sm font-bold">
                      Preview / 尚未開放正式付款
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-6 text-purple-300">{product.name['zh-TW']}</h2>
                
                <div className="mb-6">
                  <div className="text-5xl font-bold mb-2 gradient-text">{formatAUD(product.price)}</div>
                  <div className="text-lg text-white/70">{product.accessDays} days access • {product.currency}</div>
                </div>

                <p className="text-lg mb-6 text-white/80">{product.description.en}</p>
                <p className="mb-8 text-white/60">{product.description['zh-TW']}</p>

                <button
                  onClick={handleStartJourney}
                  className="btn-primary px-8 py-4 text-xl font-bold flex items-center gap-3"
                >
                  <span className="text-2xl">🚀</span>
                  Start your journey / 開始旅程
                </button>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">Features Included:</h3>
                  <ul className="space-y-3">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;