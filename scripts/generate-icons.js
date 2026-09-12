// 圖標生成配置
// 由於我們無法實際生成圖像文件，這裡提供圖標配置和說明

/*
Nightasaur 圖標設定指南

需要的圖標文件：
1. favicon.ico (32x32)
2. favicon-16x16.png
3. favicon-32x32.png
4. apple-touch-icon.png (180x180)
5. icon-192x192.png (PWA)
6. icon-512x512.png (PWA)
7. maskable-icon-192x192.png (PWA maskable)
8. maskable-icon-512x512.png (PWA maskable)
9. safari-pinned-tab.svg
10. og-image.png (1200x630)

設計規範：
- 主色: #0a0d14 (深藍黑)
- 強調色: #667eea (紫色)
- 次要色: #68d391 (綠色)
- 圖標: 🌙🦕 月亮和恐龍組合

快速生成方法：
1. 使用 Figma 或 Canva 設計
2. 使用 https://realfavicongenerator.net/ 生成 favicon
3. 使用 https://www.pwabuilder.com/imageGenerator 生成 PWA 圖標
4. 使用 https://maskable.app/editor 生成 maskable 圖標

暫時解決方案：
使用現有的 nightasaur.svg 作為所有圖標的基礎
*/

// 創建圖標目錄結構
const iconStructure = {
  "public/": [
    "manifest.json",
    "service-worker.js",
    "offline.html",
    "nightasaur.svg"
  ],
  "public/icons/": [
    "favicon.ico",
    "favicon-16x16.png", 
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "apple-touch-icon-152x152.png",
    "apple-touch-icon-180x180.png",
    "apple-touch-icon-167x167.png",
    "icon-192x192.png",
    "icon-512x512.png",
    "maskable-icon-192x192.png",
    "maskable-icon-512x512.png",
    "badge-72x72.png"
  ],
  "public/screenshots/": [
    "home.png",
    "dashboard.png"
  ]
};

console.log('📁 Nightasaur 圖標文件結構:');
console.log(JSON.stringify(iconStructure, null, 2));

console.log('\n🎨 圖標設計規範:');
console.log('- 主色: #0a0d14 (深藍黑)');
console.log('- 強調色: #667eea (紫色)');
console.log('- 圖標元素: 🌙🦕 月亮和恐龍');
console.log('- 風格: 簡約、現代、夜間主題');

console.log('\n🚀 快速開始:');
console.log('1. 複製 nightasaur.svg 到所有圖標文件');
console.log('2. 使用在線工具生成不同尺寸');
console.log('3. 或使用現有圖標暫時替代');

console.log('\n🔗 推薦工具:');
console.log('- Favicon 生成: https://realfavicongenerator.net/');
console.log('- PWA 圖標: https://www.pwabuilder.com/imageGenerator');
console.log('- Maskable 圖標: https://maskable.app/editor');
console.log('- OG 圖片: https://www.canva.com/');

// 檢查現有文件
const fs = require('fs');
const path = require('path');

function checkFiles() {
  const basePath = path.join(__dirname, '..', 'apps', 'web', 'public');
  
  console.log('\n📂 檢查現有文件:');
  
  for (const [folder, files] of Object.entries(iconStructure)) {
    const folderPath = path.join(basePath, folder.replace('public/', ''));
    
    if (!fs.existsSync(folderPath)) {
      console.log(`❌ 目錄不存在: ${folderPath}`);
      continue;
    }
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${folder}${file}`);
      } else {
        console.log(`❌ ${folder}${file} (缺失)`);
      }
    }
  }
}

// 只在直接運行時執行
if (require.main === module) {
  checkFiles();
}

module.exports = { iconStructure };