import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function SEO({
  title = 'Nightasaur - AI 數位精靈夥伴',
  description = '每人註冊即可生成專屬 AI 精靈，像數碼寶貝一樣成長進化，陪你對話冒險！支援多語言、夜間主題、PWA 安裝。',
  image = '/nightasaur-og.png',
  url = 'https://nightasaur.com',
  type = 'website',
}: SEOProps) {
  const keywords = 'AI精靈,數位寵物,虛擬夥伴,中文AI,夜間主題,PWA,多語言,數碼寶貝,AI對話,精靈養成';

  return (
    <Helmet>
      {/* 基本元資料 */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Nightasaur Team" />
      <meta name="robots" content="index, follow" />
      
      {/* Open Graph (Facebook, LinkedIn) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Nightasaur" />
      <meta property="og:locale" content="zh_TW" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@nightasaur" />
      <meta name="twitter:creator" content="@nightasaur" />
      
      {/* PWA 相關 */}
      <meta name="theme-color" content="#0a0d14" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Nightasaur" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content="Nightasaur" />
      
      {/* 結構化資料 */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Nightasaur",
          "description": description,
          "url": url,
          "applicationCategory": "GameApplication",
          "operatingSystem": "Any",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "creator": {
            "@type": "Organization",
            "name": "Nightasaur Team",
            "url": url
          },
          "featureList": [
            "AI精靈生成",
            "多階段進化",
            "多語言對話",
            "夜間主題",
            "PWA支援",
            "離線模式"
          ]
        })}
      </script>
      
      {/* 額外元資料 */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="zh-TW" />
      <link rel="canonical" href={url} />
    </Helmet>
  );
}