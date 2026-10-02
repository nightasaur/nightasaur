import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { spiritsAPI } from "../api/client";
import SpiritSprite from "../components/SpiritSprite";
import SpiritWorldShell from "../components/SpiritWorldShell";

import { spiritText } from "../utils/spiritCopy";
import { useLanguage } from "../contexts/LanguageContext";

export default function Spirits() {
  const { currentLanguage } = useLanguage();
  const t = (key: string) => spiritText(currentLanguage, key);
  const [spirits, setSpirits] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    spiritsAPI.list().then(r => setSpirits(r.data)).catch(console.error);
  }, []);

  // 列表页发送文字 → 直接跳到第一只精靈继续对话
  const handleSend = () => {
    if (spirits.length > 0) {
      navigate(`/spirits/${spirits[0].id}`);
    }
  };

  return (
    <SpiritWorldShell onSend={handleSend}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
          <h1 className="text-3xl font-black">{t("我的精灵小队")}</h1>
          <Link to="/spirits/new" className="btn-primary">{t("+ 孵化精灵")}</Link>
        </div>

        {spirits.length === 0 ? (
          <div className="glass-card text-center py-12">
            <p className="text-6xl mb-4">🥚</p>
            <p className="text-white/50">{t("还没有精灵喔～")}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spirits.map((sp: any) => (
              <Link to={`/spirits/${sp.id}`} key={sp.id} className="spirit-card block group">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl glass flex items-center justify-center group-hover:scale-110 transition-transform">
                    <SpiritSprite species={sp.species} element={sp.element} stage={sp.stage} size={60} animate={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate">{sp.name}</h3>
                    <p className="text-white/40 text-xs">{t(sp.stage)} · Lv.{sp.level}</p>
                    <p className="text-white/30 text-[10px]">{sp.element}{sp.species ? ` | ${sp.species}` : ""}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SpiritWorldShell>
  );
}