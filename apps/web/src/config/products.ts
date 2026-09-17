// Nightasaur 商業產品配置

export interface CommercialProduct {
  code: string;
  name: {
    en: string;
    'zh-TW': string;
  };
  market: string;
  currency: string;
  price: number;
  unitAmountMinor: number;
  referencePriceTwd: number;
  accessDays: number;
  accessMode: 'authenticated_early_access' | 'entitlement_required';
  description: {
    en: string;
    'zh-TW': string;
  };
  features: string[];
  displayStatus: 'visible' | 'hidden';
  salesStatus: 'available' | 'preview' | 'coming_soon' | 'sold_out';
}

export const formatAUD = (amount: number): string => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatTWD = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const IELTS_IMMERSION_1M_AU: CommercialProduct = {
  code: 'IELTS_IMMERSION_1M_AU',
  name: {
    en: 'Nightasaur Deep IELTS Immersion Experience — 1 Month',
    'zh-TW': 'Nightasaur 深度雅思沉浸體驗一個月',
  },
  market: 'AU',
  currency: 'AUD',
  price: 5000.00,
  unitAmountMinor: 500000,
  referencePriceTwd: 113400,
  accessDays: 30,
  accessMode: 'authenticated_early_access',
  description: {
    en: 'A premium deep immersion experience for IELTS preparation, combining AI-powered personalized learning with Nightasaur\'s unique companion approach.',
    'zh-TW': '為雅思準備設計的深度沉浸體驗，結合 AI 個人化學習與 Nightasaur Spirit 陪伴。',
  },
  features: [
    'Personal assessment and learning path',
    '30-day personalized learning journey',
    'Daily AI-guided missions and practice',
    'Speaking feedback with pronunciation analysis',
    'Writing assessment with improvement suggestions',
    'Reading comprehension training',
    'Listening skill development',
    'Learning history and progress tracking',
    'Progress analytics and insights',
    'Spirit-enabled learning direction',
    '30-day progress summary report',
  ],
  displayStatus: 'visible',
  salesStatus: 'preview',
};

export const PRODUCTS: Record<string, CommercialProduct> = {
  IELTS_IMMERSION_1M_AU,
};

export const getProductByCode = (code: string): CommercialProduct | null => {
  return PRODUCTS[code] || null;
};

export const getVisibleProducts = (): CommercialProduct[] => {
  return Object.values(PRODUCTS).filter(product => product.displayStatus === 'visible');
};

export const getAvailableProducts = (): CommercialProduct[] => {
  return Object.values(PRODUCTS).filter(product => product.salesStatus === 'available');
};
