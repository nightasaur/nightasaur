import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IELTS_IMMERSION_1M_AU, formatAUD, formatTWD } from '../../config/products';

const ProductPage: React.FC = () => {
  const navigate = useNavigate();
  const product = IELTS_IMMERSION_1M_AU;

  const handleStartLearning = () => {
    const token = localStorage.getItem('nightasaur_token');
    const returnTo = '/academy/category/ielts';
    if (token) {
      navigate(returnTo);
    } else {
      navigate('/login', { state: { returnTo } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card p-8 mb-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-2/3">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h1 className="text-4xl font-black neon-text">{product.name.en}</h1>
                  <span className="bg-green-500/20 text-green-300 px-4 py-2 rounded-lg text-sm font-bold">
                    Early Access / 登入即可體驗
                  </span>
                  {product.salesStatus === 'preview' && (
                    <span className="bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-lg text-sm font-bold">
                      正式付款尚未開放
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-6 text-purple-300">{product.name['zh-TW']}</h2>

                <div className="mb-6">
                  <div className="text-5xl font-bold mb-2 gradient-text">{formatAUD(product.price)} AUD</div>
                  <div className="text-2xl font-bold text-white/85">約 {formatTWD(product.referencePriceTwd)} TWD</div>
                  <div className="text-sm text-white/45 mt-2">台幣為參考換算，正式收款金額以付款頁為準。</div>
                  <div className="text-lg text-white/70 mt-3">{product.accessDays} days access</div>
                </div>

                <p className="text-lg mb-6 text-white/80">{product.description.en}</p>
                <p className="mb-8 text-white/60">{product.description['zh-TW']}</p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleStartLearning}
                    className="btn-primary px-8 py-4 text-xl font-bold flex items-center justify-center gap-3"
                  >
                    <span className="text-2xl">🎓</span>
                    開始 IELTS 陪伴學習
                  </button>
                  <button
                    onClick={() => navigate('/checkout/ielts-immersion')}
                    className="btn-secondary px-8 py-4 text-lg font-bold"
                  >
                    查看 30 天方案預覽
                  </button>
                </div>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">30 天體驗內容</h3>
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
