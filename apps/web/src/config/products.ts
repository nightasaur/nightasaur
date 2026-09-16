// Nightasaur 商業產品配置

export interface CommercialProduct {
  code: string;
  name: {
    en: string;
    'zh-TW': string;
  };
  market: string;
  currency: string;
  price: number; // 主要單位價格
  unitAmountMinor: number; // 次要單位價格（用於支付處理）
  accessDays: number;
  description: {
    en: string;
    'zh-TW': string;
  };
  features: string[];
  status: 'active' | 'coming_soon' | 'archived';
}

// AUD 格式化器
export const formatAUD = (amount: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// 主要雅思沉浸體驗產品
export const IELTS_IMMERSION_1M_AU: CommercialProduct = {
  code: 'IELTS_IMMERSION_1M_AU',
  name: {
    en: 'Nightasaur Deep IELTS Immersion Experience — 1 Month',
    'zh-TW': 'nightasaur深度雅思沉浸體驗一個月',
  },
  market: 'AU',
  currency: 'AUD',
  price: 5000.00,
  unitAmountMinor: 500000, // 5000.00 AUD 轉換為次要單位
  accessDays: 30,
  description: {
    en: 'A premium deep immersion experience for IELTS preparation, combining AI-powered personalized learning with Nightasaur\'s unique companion approach.',
    'zh-TW': '為雅思準備設計的深度沉浸體驗，結合AI驅動的個性化學習與Nightasaur獨特的夥伴陪伴方式。',
  },
  features: [
    'AI-powered personalized study journey',
    'Speaking practice with feedback',
    'Writing assessment and improvement',
    'Reading comprehension training',
    'Listening skill development',
    'Learning history tracking',
    'Future Spirit Companion integration',
    'Progress analytics dashboard',
  ],
  status: 'active',
};

// 所有產品列表
export const PRODUCTS: Record<string, CommercialProduct> = {
  IELTS_IMMERSION_1M_AU,
};

// 根據代碼獲取產品
export const getProductByCode = (code: string): CommercialProduct | null => {
  return PRODUCTS[code] || null;
};

// 獲取活躍產品列表
export const getActiveProducts = (): CommercialProduct[] => {
  return Object.values(PRODUCTS).filter(product => product.status === 'active');
};