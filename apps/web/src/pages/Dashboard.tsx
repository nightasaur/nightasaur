import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../api/client";
import Onboarding from "../components/Onboarding";
import SpiritSprite from "../components/SpiritSprite";

const CN: Record<string,string>={EGG:"🥚蛋",HATCHLING:"🐣幼體",JUVENILE:"🦎少年體",ADULT:"🦕成年體",ULTIMATE:"👑究極體",LEGENDARY:"🌟傳說體"};

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [showOnboard, setShowOnboard] = useState(false);

  useEffect(() => {
    authAPI.me().then((res) => {
      setProfile(res.data);
      // 第一次登入顯示新手指引
      const seen = localStorage.getItem("nightasaur_onboarded");
      if (!seen && res.data.spiritCount === 0) setShowOnboard(true);
    }).catch(console.error);
  }, []);

  if (!profile) return null;

  return (
    <>
      {showOnboard && <Onboarding onDone={()=>{setShowOnboard(false);localStorage.setItem("nightasaur_onboarded","1");}} />}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-black mb-2">歡迎回來，{profile.username} 🌙</h1>
        <p className="text-white/40 mb-8">訓練家等級 · {profile.role==="ADMIN"?"管理員":"訓練家"}</p>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card text-center"><p className="text-white/50 text-sm">精靈小隊</p><p className="text-4xl font-black mt-1">{profile.spiritCount}</p></div>
          <div className="glass-card text-center"><p className="text-white/50 text-sm">總對話次數</p><p className="text-4xl font-black mt-1">-</p></div>
          <div className="glass-card flex items-center justify-center"><Link to="/spirits/new" className="btn-primary w-full text-center">+ 孵化新精靈</Link></div>
        </div>

        <h2 className="text-xl font-bold mb-4">我的精靈小隊</h2>
        {profile.spirits?.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.spirits.map((sp: any) => (
              <Link to={`/spirits/${sp.id}`} key={sp.id} className="spirit-card group">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl glass flex items-center justify-center text-3xl group-hover:scale-110 transition-transform"><SpiritSprite species={sp.species} element={sp.element} stage={sp.stage} size={64} animate={false} /></div>
                  <div>
                    <p className="font-bold text-lg">{sp.name}</p>
                    <p className="text-white/40 text-xs">{CN[sp.stage]||sp.stage} · Lv.{sp.level}</p>
                    {sp.element && <p className="text-white/30 text-[10px]">{sp.element}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-card text-center py-12">
            <p className="text-6xl mb-4">🥚</p>
            <p className="text-white/50 mb-4">還沒有精靈！快來孵化第一隻吧</p>
            <Link to="/spirits/new" className="btn-primary inline-block">孵化精靈</Link>
          </div>
        )}
      </div>
    </>
  );
}