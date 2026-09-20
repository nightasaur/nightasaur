// SPDX-License-Identifier: MIT
import {useState} from 'react';
import {Link} from 'react-router-dom';
export default function AdminPasswordReset() {
  const [code,setCode]=useState('');
  const [password,setPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  async function submit(e:React.FormEvent) {
    e.preventDefault();setError('');
    if(password!==confirmation) {setError('兩次密碼不一致');return;}
    setBusy(true);
    try {
      const r=await fetch('/api/auth/admin-password-reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,password}),cache:'no-store'});
      const result=await r.json();
      if(!r.ok) throw new Error(result.error||result.message||'重設失敗，請確認重設碼與密碼。');
      localStorage.removeItem('nightasaur_token');setCode('');setPassword('');setConfirmation('');setDone(true);
    } catch(e:any) {setError(e.message||'連線失敗，請稍後再試');}
    finally {setBusy(false);}
  }
  return <main className="max-w-md mx-auto px-6 py-12"><div className="glass-card">
    <h1 className="text-2xl font-bold mb-4">管理員密碼重設</h1>
    <p className="mb-4">帳號：admin@nightasaur.com</p>
    {done ? <><p role="status">密碼已更新，舊登入狀態已撤銷。</p><Link className="btn-primary mt-6 inline-block" to="/login">使用新密碼登入</Link></> : <>
      <p className="text-white/70 mb-6">需要管理者的一次性重設碼。新密碼至少 12 個字元；重設碼使用一次或到期後失效。</p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">一次性重設碼<input aria-label="一次性重設碼" type="password" autoComplete="off" required value={code} onChange={e=>setCode(e.target.value)} className="input-field w-full" disabled={busy}/></label>
        <label className="block">新密碼<input aria-label="新密碼" type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={password} onChange={e=>setPassword(e.target.value)} className="input-field w-full" disabled={busy}/></label>
        <label className="block">確認新密碼<input aria-label="確認新密碼" type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={confirmation} onChange={e=>setConfirmation(e.target.value)} className="input-field w-full" disabled={busy}/></label>
        {error&&<p role="alert" className="text-red-300">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy?'更新中…':'設定新密碼並撤銷舊登入'}</button>
      </form>
    </>}
  </div></main>;
}
