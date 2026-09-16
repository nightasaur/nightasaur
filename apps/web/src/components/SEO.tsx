import React from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterCard?: string;
  twitterSite?: string;
  robots?: string;
  canonical?: string;
  locale?: string;
  jsonLd?: Record<string, any>;
}

export default function SEO({
  title = 'Nightasaur - AI 數位精靈夥伴',
  description = '每人註冊即可生成專屬 AI 精靈，像數碼寶貝一樣成長進化，陪你對話冒險！支援多語言、夜間主題、PWA 安裝。',
  image = '/nightasaur-og.png',
  url = 'https://nightasaur.com',
  type = 'website',
  siteName = 'Nightasaur',
  twitterCard = 'summary_large_image',
  twitterSite = '@nightasaur',
  robots = 'index, follow',
  canonical = '',
  locale = 'zh_TW',
  jsonLd,
}: SEOProps) {
  const keywords = 'AI精靈,數位寵物,虛擬夥伴,中文AI,夜間主題,PWA,多語言,數碼寶貝,AI對話,精靈養成';
  const fullUrl = canonical || url;

  React.useEffect(() => {
    // 設置頁面標題
    document.title = title;

    // 設置 meta 標籤
    const setMetaTag = (name: string, content: string, property?: string) => {
      let meta = document.querySelector(property ? `meta[property="${property}"]` : `meta[name="${name}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', name);
        }
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // 基本 meta 標籤
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('robots', robots);

    // OpenGraph 標籤
    setMetaTag('', title, 'og:title');
    setMetaTag('', description, 'og:description');
    setMetaTag('', image, 'og:image');
    setMetaTag('', fullUrl, 'og:url');
    setMetaTag('', type, 'og:type');
    setMetaTag('', siteName, 'og:site_name');
    setMetaTag('', locale, 'og:locale');

    // Twitter 卡片標籤
    setMetaTag('twitter:card', twitterCard);
    setMetaTag('twitter:site', twitterSite);
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);

    // 規範化連結
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (link) {
        link.setAttribute('href', canonical);
      } else {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', canonical);
        document.head.appendChild(link);
      }
    }

    // 設置 viewport
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }

    // 添加 JSON-LD 結構化數據
    if (jsonLd) {
      // 移除現有的 JSON-LD
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, image, url, type, siteName, twitterCard, twitterSite, robots, canonical, locale, jsonLd]);

  return null; // 這個組件不渲染任何內容
}