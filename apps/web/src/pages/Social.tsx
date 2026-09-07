import { useEffect, useState } from "react";
import { socialAPI, spiritsAPI } from "../api/client";

export default function Social() {
  const [posts, setPosts] = useState<any[]>([]);
  const [spirits, setSpirits] = useState<any[]>([]);
  const [form, setForm] = useState({
    content: "", spiritId: "", platform: "FACEBOOK", imageUrl: "",
  });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    socialAPI.getUserPosts().then((res) => setPosts(res.data)).catch(console.error);
    spiritsAPI.list().then((res) => setSpirits(res.data)).catch(console.error);
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setPosting(true);
    try {
      await socialAPI.createPost({
        content: form.content,
        spiritId: form.spiritId || undefined,
        platform: form.platform,
        imageUrl: form.imageUrl || undefined,
      });
      const res = await socialAPI.getUserPosts();
      setPosts(res.data);
      setForm({ content: "", spiritId: "", platform: "FACEBOOK", imageUrl: "" });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-black mb-8">社群發布 📱</h1>

      <div className="glass-card mb-8">
        <h2 className="font-bold mb-4">新增貼文</h2>
        <form onSubmit={handlePost} className="space-y-4">
          <div>
            <label className="text-sm text-white/50 mb-1 block">平台</label>
            <select className="input-field"
              value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
              <option value="FACEBOOK">Facebook 粉專</option>
              <option value="INSTAGRAM">Instagram 商業帳號</option>
            </select>
          </div>

          {spirits.length > 0 && (
            <div>
              <label className="text-sm text-white/50 mb-1 block">相關精靈（選填）</label>
              <select className="input-field"
                value={form.spiritId} onChange={(e) => setForm({ ...form, spiritId: e.target.value })}>
                <option value="">無</option>
                {spirits.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <textarea className="input-field h-32 resize-none" placeholder="寫下你想分享的故事..."
            value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />

          <input className="input-field" placeholder="圖片 URL（選填）"
            value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />

          <button className="btn-primary" type="submit" disabled={posting}>
            {posting ? "發布中..." : `發布到 ${form.platform}`}
          </button>
        </form>
      </div>

      <h2 className="text-xl font-bold mb-4">發布記錄</h2>
      {posts.length === 0 ? (
        <div className="glass-card text-center py-8 text-white/40">尚無貼文</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post: any) => (
            <div key={post.id} className="glass-card">
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <span className="text-sm glass px-2 py-0.5 rounded-full">{post.platform}</span>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${
                    post.status === "PUBLISHED" ? "bg-green-500/20 text-green-400"
                    : post.status === "DRAFT" ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                  }`}>
                    {post.status === "PUBLISHED" ? "已發布" : post.status === "DRAFT" ? "草稿" : "失敗"}
                  </span>
                </div>
                <span className="text-xs text-white/30">{new Date(post.createdAt).toLocaleString("zh-TW")}</span>
              </div>
              <p className="text-white/70 text-sm">{post.content.slice(0, 150)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}