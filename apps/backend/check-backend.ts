// 快速測試後端是否運行
import http from 'http';

async function checkBackend() {
  console.log('=== 檢查後端狀態 ===\n');

  return new Promise((resolve) => {
    const req = http.get('http://localhost:3002/api/health', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ 後端運行正常`);
        console.log(`   狀態碼: ${res.statusCode}`);
        console.log(`   回應: ${data}`);
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.log(`❌ 後端未運行或無法連接`);
      console.log(`   錯誤: ${err.message}`);
      console.log(`\n💡 請啟動後端:`);
      console.log(`   cd apps/backend`);
      console.log(`   npm run dev`);
      resolve(false);
    });

    req.setTimeout(3000, () => {
      console.log(`⏱️  連接超時`);
      console.log(`💡 後端可能未啟動`);
      req.destroy();
      resolve(false);
    });
  });
}

checkBackend();