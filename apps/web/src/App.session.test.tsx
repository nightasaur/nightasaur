import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
const mock = vi.hoisted(()=>({me:vi.fn(),login:vi.fn()}));
vi.mock('./api/client',()=>({authAPI:{me:mock.me,login:mock.login},languageAPI:{getUserPreference:vi.fn(async()=>({data:{preference:{primaryLang:'zh-TW'}}}))}}));
vi.mock('./pages/Dashboard',()=>({default:()=> <h1>Protected dashboard</h1>}));
afterEach(()=>{cleanup();localStorage.clear();vi.clearAllMocks();window.history.replaceState({}, '', '/');});
it('keeps the public homepage usable while session verification is pending',()=>{
 window.history.replaceState({}, '', '/');
 localStorage.setItem('nightasaur_token','fixture-token');mock.me.mockReturnValue(new Promise(()=>{}));
 render(<App/>);
 expect(screen.getByRole('heading',{name:'Nightasaur'})).toBeVisible();
 expect(screen.getByRole('link',{name:'登入'})).toHaveAttribute('href','/login');
});
it('keeps the login form available when the previous session check times out',async()=>{
 window.history.replaceState({}, '', '/login');
 localStorage.setItem('nightasaur_token','fixture-token');mock.me.mockRejectedValue({code:'ECONNABORTED'});
 render(<App/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('暫時無法確認登入狀態');
 expect(screen.getByRole('textbox',{name:'Email address'})).toBeEnabled();
});
it('keeps the session credential on network failure and blocks protected rendering pending retry',async()=>{
 window.history.replaceState({}, '', '/dashboard');
 localStorage.setItem('nightasaur_token','fixture-token');mock.me.mockRejectedValue({code:'ECONNABORTED'});
 render(<App/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('暫時無法確認登入狀態');
 expect(localStorage.getItem('nightasaur_token')).toBe('fixture-token');
 expect(screen.getByRole('button',{name:'重新連線 / Retry'})).toBeEnabled();
 expect(screen.queryByRole('heading',{name:'Protected dashboard'})).not.toBeInTheDocument();
});
it('keeps protected content hidden until a retry verifies the session',async()=>{
 window.history.replaceState({}, '', '/dashboard');
 localStorage.setItem('nightasaur_token','fixture-token');
 mock.me.mockRejectedValueOnce({code:'ECONNABORTED'}).mockResolvedValueOnce({data:{username:'fixture'}});
 render(<App/>);
 await screen.findByRole('alert');
 expect(screen.queryByRole('heading',{name:'Protected dashboard'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'重新連線 / Retry'}));
 expect(await screen.findByRole('heading',{name:'Protected dashboard'})).toBeVisible();
});
it('shows a usable return link while protected session verification is pending',()=>{
 window.history.replaceState({}, '', '/dashboard');
 localStorage.setItem('nightasaur_token','fixture-token');mock.me.mockReturnValue(new Promise(()=>{}));
 render(<App/>);
 expect(screen.getByRole('status')).toHaveTextContent('正在確認登入狀態');
 expect(screen.queryByRole('heading',{name:'Protected dashboard'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('link',{name:'返回首頁 / Home'}));
 expect(screen.getByRole('heading',{name:'Nightasaur'})).toBeVisible();
});
it('does not overwrite a new login when an older session check later fails',async()=>{
 window.history.replaceState({}, '', '/login');
 localStorage.setItem('nightasaur_token','old-fixture');
 let rejectOld: (value: unknown) => void;
 mock.me.mockReturnValue(new Promise((_,reject)=>{rejectOld=reject;}));
 mock.login.mockResolvedValue({data:{token:'new-fixture',user:{username:'new-user'}}});
 render(<App/>);
 fireEvent.change(screen.getByRole('textbox',{name:'Email address'}),{target:{value:'qa@example.invalid'}});
 fireEvent.change(screen.getByLabelText('Password'),{target:{value:'test-fixture-only'}});
 fireEvent.click(screen.getByRole('button',{name:'登入'}));
 expect(await screen.findByRole('heading',{name:'Protected dashboard'})).toBeVisible();
 await act(async()=>{rejectOld!({response:{status:401}});});
 expect(localStorage.getItem('nightasaur_token')).toBe('new-fixture');
 expect(screen.getByRole('heading',{name:'Protected dashboard'})).toBeVisible();
});
it('removes a rejected session on 401',async()=>{
 localStorage.setItem('nightasaur_token','fixture-token');mock.me.mockRejectedValue({response:{status:401}});
 render(<App/>);await waitFor(()=>expect(localStorage.getItem('nightasaur_token')).toBeNull());
 expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
