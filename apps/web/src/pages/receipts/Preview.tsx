import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IELTS_IMMERSION_1M_AU, formatAUD, formatTWD } from '../../config/products';

const ReceiptPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const product = IELTS_IMMERSION_1M_AU;

  useEffect(() => {
    const token = localStorage.getItem('nightasaur_token');
    if (!token) navigate('/login');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <div className="inline-block bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-3 rounded-full mb-4">
                <span className="font-bold">PREVIEW — NOT PAID</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Nightasaur Receipt Preview</h1>
              <p className="text-white/70">收據格式預覽；目前沒有付款、訂單或正式收據號碼。</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Plan Details</h3>
                <div className="space-y-3">
                  <div className="font-bold">{product.name.en}</div>
                  <div className="text-sm text-white/70">{product.name['zh-TW']}</div>
                  <div className="flex justify-between pt-3 border-t border-white/10"><span>Access period</span><span>{product.accessDays} days</span></div>
                  <div className="flex justify-between"><span>Product code</span><span className="font-mono text-sm">{product.code}</span></div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Amount Preview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span>List price</span><span>{formatAUD(product.price)} AUD</span></div>
                  <div className="flex justify-between"><span>TWD reference</span><span>約 {formatTWD(product.referencePriceTwd)}</span></div>
                  <div className="text-xs text-white/45">台幣金額僅為參考換算；正式付款啟用後，以結帳頁實際顯示的幣別與金額為準。</div>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">⏳</div>
                  <div>
                    <div className="font-bold text-yellow-300">Payment Status: NOT PAID</div>
                    <div className="text-sm text-yellow-200/70">Early Access is currently separate from the future paid 30-day entitlement.</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
                <h4 className="font-bold mb-3 text-blue-300">Important Notes</h4>
                <ul className="space-y-2 text-sm text-white/80">
                  <li>• This page is a receipt-format preview only.</li>
                  <li>• A real receipt will be generated only after confirmed payment.</li>
                  <li>• No official receipt number, transaction ID or GST amount has been issued.</li>
                  <li>• Not a tax invoice.</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button onClick={() => navigate('/academy/category/ielts')} className="flex-1 px-6 py-4 bg-green-600/20 border border-green-500/30 rounded-lg text-green-200 hover:bg-green-600/30">
                開始 英語訓練對話 Early Access
              </button>
              <button onClick={() => navigate('/products/ielts-immersion')} className="flex-1 px-6 py-4 border border-white/20 rounded-lg hover:bg-white/5">
                返回方案頁
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewPage;
