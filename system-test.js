// Nightasaur 完整系統測試
const BASE_URL = "http://localhost:3002";

console.log("🦖 Nightasaur 系統測試");
console.log("======================");
console.log("服務器: " + BASE_URL);
console.log("支援: service@nightasaur.com");
console.log("");

// 帳號資訊
const ADMIN = {email:"admin@nightasaur.com", username:"admin", password:"admin123"};
const TEST = {email:"test@nightasaur.com", username:"testuser", password:"test123"};

console.log("📋 帳號資訊:");
console.log("管理員: " + ADMIN.email + " / " + ADMIN.password);
console.log("測試用戶: " + TEST.email + " / " + TEST.password);
console.log("");

async function checkServer() {
    try {
        const res = await fetch(BASE_URL + "/api/health");
        const data = await res.json();
        console.log("✅ 服務器: " + data.status);
        console.log("📧 支援: " + data.supportEmail);
        return true;
    } catch {
        console.log("❌ 服務器未運行");
        return false;
    }
}

async function testLogin(email, password) {
    try {
        const res = await fetch(BASE_URL + "/api/auth/login", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({email, password})
        });
        const data = await res.json();
        if(data.success) {
            console.log("✅ 登入成功: " + email);
            return {success:true, token:data.token};
        } else {
            console.log("❌ 登入失敗: " + data.message);
            return {success:false};
        }
    } catch(error) {
        console.log("❌ 連線錯誤");
        return {success:false};
    }
}

async function testRegister(email, username, password) {
    try {
        const res = await fetch(BASE_URL + "/api/auth/register", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({email, username, password})
        });
        const data = await res.json();
        if(data.success) {
            console.log("✅ 註冊成功: " + username);
            return {success:true, token:data.token};
        } else {
            console.log("❌ 註冊失敗: " + data.message);
            return {success:false};
        }
    } catch {
        console.log("❌ 連線錯誤");
        return {success:false};
    }
}

async function testForgotPassword(email) {
    try {
        const res = await fetch(BASE_URL + "/api/auth/forgot-password", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({email})
        });
        const data = await res.json();
        if(data.success) {
            console.log("✅ 忘記密碼請求成功");
            if(data.resetLink) {
                const token = data.resetLink.split('token=')[1];
                console.log("🔗 令牌: " + token.substring(0,20) + "...");
                return {success:true, token};
            }
        } else {
            console.log("❌ 請求失敗: " + data.message);
        }
    } catch {
        console.log("❌ 連線錯誤");
    }
    return {success:false};
}

async function runTests() {
    console.log("🧪 開始測試...");
    
    if(!await checkServer()) return;
    
    console.log("\n1. 測試管理員登入");
    const adminLogin = await testLogin(ADMIN.email, ADMIN.password);
    
    if(adminLogin.success) {
        console.log("\n2. 測試忘記密碼");
        const forgot = await testForgotPassword(ADMIN.email);
        
        if(forgot.success) {
            console.log("\n3. 測試註冊新用戶");
            await testRegister(TEST.email, TEST.username, TEST.password);
            
            console.log("\n4. 測試新用戶登入");
            await testLogin(TEST.email, TEST.password);
        }
    }
    
    console.log("\n🎉 測試完成");
    console.log("=============");
    console.log("🌐 訪問網址:");
    console.log("  登入: http://localhost:3002/");
    console.log("  忘記密碼: http://localhost:3002/forgot-password");
    console.log("📞 支援: service@nightasaur.com");
}

runTests().catch(console.error);