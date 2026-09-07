// Nightasaur 忘記密碼系統 - 快速測試
const BASE_URL = "http://localhost:3002";

console.log("🔍 Nightasaur 忘記密碼系統測試");
console.log("=================================");

// 檢查服務器
async function checkServer() {
    try {
        const res = await fetch(`${BASE_URL}/api/health`);
        const data = await res.json();
        console.log(`✅ 服務器狀態: ${data.status}`);
        console.log(`📧 支援信箱: ${data.supportEmail}`);
        console.log(`🦖 版本: ${data.service}`);
        return true;
    } catch (error) {
        console.log("❌ 服務器未運行");
        console.log("💡 請先啟動服務器:");
        console.log("   cd apps/backend");
        console.log("   npx tsx auth-server.ts");
        return false;
    }
}

// 測試忘記密碼
async function testForgotPassword(email) {
    console.log(`\n📧 測試忘記密碼: ${email}`);
    
    try {
        const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        
        if (data.success) {
            console.log("✅ 請求成功:", data.message);
            
            if (data.resetLink) {
                const token = data.resetLink.split('token=')[1];
                console.log("🔗 重置令牌:", token.substring(0, 20) + "...");
                
                // 驗證令牌
                const validateRes = await fetch(`${BASE_URL}/api/auth/validate-reset-token?token=${token}`);
                const validateData = await validateRes.json();
                
                if (validateData.success) {
                    console.log("✅ 令牌驗證成功");
                    console.log("📧 目標郵箱:", validateData.email);
                    return token;
                } else {
                    console.log("❌ 令牌驗證失敗:", validateData.message);
                }
            }
        } else {
            console.log("❌ 請求失敗:", data.message);
        }
    } catch (error) {
        console.log("❌ 連線錯誤:", error.message);
    }
    
    return null;
}

// 測試重置密碼
async function testResetPassword(token, newPassword) {
    console.log(`\n🔄 測試重置密碼...`);
    
    try {
        const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword })
        });
        
        const data = await res.json();
        
        if (data.success) {
            console.log("✅ 密碼重置成功:", data.message);
            return true;
        } else {
            console.log("❌ 重置失敗:", data.message);
            return false;
        }
    } catch (error) {
        console.log("❌ 連線錯誤:", error.message);
        return false;
    }
}

// 測試登入
async function testLogin(email, password) {
    console.log(`\n🔑 測試登入: ${email}`);
    
    try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (data.success) {
            console.log("✅ 登入成功:", data.message);
            console.log("👤 用戶名:", data.user.username);
            console.log("🔐 令牌:", data.token.substring(0, 20) + "...");
            return true;
        } else {
            console.log("❌ 登入失敗:", data.message);
            return false;
        }
    } catch (error) {
        console.log("❌ 連線錯誤:", error.message);
        return false;
    }
}

// 主測試函數
async function main() {
    const serverOk = await checkServer();
    if (!serverOk) return;
    
    // 測試管理員帳號
    const adminEmail = "admin@nightasaur.com";
    const newPassword = "newpassword123";
    
    console.log("\n🧪 開始完整測試流程");
    console.log("======================");
    
    // 1. 測試忘記密碼
    const token = await testForgotPassword(adminEmail);
    
    if (token) {
        // 2. 測試重置密碼
        const resetOk = await testResetPassword(token, newPassword);
        
        if (resetOk) {
            // 3. 測試新密碼登入
            const loginOk = await testLogin(adminEmail, newPassword);
            
            if (loginOk) {
                console.log("\n🎉 所有測試通過！");
                console.log("======================");
                console.log("✅ 忘記密碼功能正常");
                console.log("✅ 重置密碼功能正常");
                console.log("✅ 新密碼登入正常");
                console.log("📧 支援信箱: service@nightasaur.com");
            }
        }
    }
    
    console.log("\n🌐 訪問以下網址:");
    console.log("  登入頁面: http://localhost:3002/");
    console.log("  忘記密碼: http://localhost:3002/forgot-password");
    console.log("  重置密碼: http://localhost:3002/reset-password");
    console.log("\n📞 支援: service@nightasaur.com");
}

// 運行測試
main().catch(console.error);