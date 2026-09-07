#!/bin/bash
# Nightasaur 忘記密碼系統啟動腳本

echo "==========================================="
echo "🦖 Nightasaur 忘記密碼系統 v2.1"
echo "==========================================="

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 請安裝 Node.js"
    exit 1
fi

# 檢查依賴
echo "📦 檢查依賴..."
cd apps/backend

# 安裝依賴
if [ ! -d "node_modules" ]; then
    echo "安裝依賴..."
    npm install express cors bcryptjs jsonwebtoken crypto
    npm install -D typescript tsx @types/express @types/cors @types/bcryptjs @types/jsonwebtoken
fi

# 檢查 Prisma
if ! command -v npx prisma &> /dev/null; then
    echo "安裝 Prisma..."
    npm install prisma @prisma/client
fi

# 運行數據庫遷移
echo "🗄️  運行數據庫遷移..."
npx prisma migrate dev --name init_auth_system --skip-generate

# 啟動服務器
echo "🚀 啟動服務器..."
echo ""
echo "==========================================="
echo "服務器: http://localhost:3002"
echo "登入頁面: http://localhost:3002/"
echo "忘記密碼: http://localhost:3002/forgot-password"
echo "重置密碼: http://localhost:3002/reset-password"
echo "支援信箱: service@nightasaur.com"
echo "==========================================="
echo ""
echo "測試帳號:"
echo "  📧 admin@nightasaur.com"
echo "  🔑 admin123"
echo ""

# 啟動服務器
npx tsx auth-server.ts