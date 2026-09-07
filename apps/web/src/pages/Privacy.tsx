import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-white/80">
      <h1 className="text-3xl font-black text-white mb-8">隱私權政策</h1>
      <p className="text-white/50 mb-6">最後更新：2026 年 8 月</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-3">1. 我們收集的資訊</h2>
        <p className="mb-2">Nightasaur 僅收集您提供的必要資訊：</p>
        <ul className="list-disc pl-6 space-y-1 text-white/60">
          <li>Email 地址（用於帳號識別）</li>
          <li>使用者名稱（用於平台顯示）</li>
          <li>精靈資料（名稱、屬性、對話紀錄）</li>
          <li>社群發文內容（僅在您主動發布時）</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-3">2. AI 對話資料</h2>
        <p className="text-white/60">
          您與精靈的對話內容會傳送至本地 AI 引擎（Ollama）進行處理。
          對話紀錄僅儲存在本地伺服器，用於精靈的上下文記憶與經驗值計算。
          我們不會將對話內容分享給第三方。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-3">3. Facebook / Instagram 整合</h2>
        <p className="text-white/60">
          當您使用社群發布功能時，Nightasaur 會透過 Facebook Graph API
          將您選擇的內容發布到您的粉絲專頁或 Instagram 商業帳號。
          我們僅在您明確操作時才會發布內容。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-3">4. 資料安全</h2>
        <p className="text-white/60">
          所有密碼使用 bcrypt 雜湊儲存，無法逆向還原。
          認證使用 JWT (JSON Web Token) 機制，Token 有效期 7 天。
          伺服器與資料庫部署於安全環境中。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-3">5. 您的權利</h2>
        <p className="text-white/60">
          您可以隨時要求查看、修改或刪除您的個人資料與精靈紀錄。
          請聯繫管理員：admin@nightasaur.com
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-3">6. 聯絡我們</h2>
        <p className="text-white/60">
          如有任何隱私相關問題，請聯繫：admin@nightasaur.com
        </p>
      </section>

      <Link to="/" className="text-purple-400 hover:text-purple-300">← 返回首頁</Link>
    </div>
  );
}