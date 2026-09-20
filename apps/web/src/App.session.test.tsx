import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import App from './App';
const mock = vi.hoisted(()=>({me:vi.fn()}));
vi.mock('./api/client',()=>({authAPI:{me:mock.me},languageAPI:{getUserPreference:vi.fn(async()=>({data:{preference:{primaryLang:'zh-TW'}}}))}}));
afterEach(()=>{cleanup();localStorage.clear();vi.clearAllMocks();});
it('keeps the session credential on network failure and blocks protected rendering pending retry',async()=>{
 localStorage.setItem('nightasaur_token','fixture-token');mock.me.mockRejectedValue({code:'ECONNABORTED'});
 render(<App/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('暫時無法確認登入狀態');
 expect(localStorage.getItem('nightasaur_token')).toBe('fixture-token');
 expect(screen.getByRole('button',{name:'重新連線 / Retry'})).toBeEnabled();
});
it('removes a rejected session on 401',async()=>{
 localStorage.setItem('nightasaur_token','fixture-token');mock.me.mockRejectedValue({response:{status:401}});
 render(<App/>);await waitFor(()=>expect(localStorage.getItem('nightasaur_token')).toBeNull());
 expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
