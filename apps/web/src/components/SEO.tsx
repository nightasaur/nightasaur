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
  title = 'Nightasaur — AI Spirit for Learning, Creation and Real-World Growth',
  description = 'Nightasaur — 陪你學習、創作與現實成長的 AI Spirit。讓 AI Spirit 陪你在真實世界一起成長，從學習、創作、職業技能到日常工作，Spirit 會記住你的歷程、理解你的習慣，並隨著你們共同完成的真實任務逐步成長。',
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
  const keywords = 'AI Spirit,AI學習,AI創作,職業技能,現實成長,AI夥伴,多語言,PWA,深色主題,學習夥伴';
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