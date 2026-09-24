import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SpiritDetail from './pages/SpiritDetail';
import { LanguageProvider } from './contexts/LanguageContext';
import { progression, growthValue, STAGES } from './utils/spiritPresentation';
const fixtures = vi.hoisted(() => ({stage:'HATCHLING', level:2, message:'A real server reply'}));
vi.mock('./api/client', () => ({
  spiritsAPI: {getById: vi.fn(async () => ({data:{id:'fixture',name:'Fixture',stage:fixtures.stage,level:fixtures.level,element:'WATER',species:null,customization:{}}}))},
  generationAPI: {get:vi.fn(async () => ({data:{status:'PENDING'}}))},
  dialogueAPI: {chat:vi.fn(async () => ({data:{message:fixtures.message,spiritName:'Fixture'}}))}, languageAPI: {}
}));
vi.mock('./components/SpiritSprite', () => ({default:()=> <span>sprite</span>}));
vi.mock('./components/VoiceChat', () => ({VoiceChat:()=>null,useVoiceOutput:()=>({speak:vi.fn(),isSpeaking:false})}));
beforeEach(()=>{localStorage.clear();fixtures.stage='HATCHLING';fixtures.level=2;fixtures.message='A real server reply';Element.prototype.scrollIntoView=vi.fn();});
afterEach(cleanup);
function mount(language='zh-TW') {
 localStorage.setItem('nightasaur_language',language);
 render(<LanguageProvider><MemoryRouter initialEntries={['/spirits/fixture']}><Routes><Route path='/spirits/:id' element={<SpiritDetail/>}/></Routes></MemoryRouter></LanguageProvider>);
}
it('renders the backend message field instead of a fabricated ellipsis',async()=>{
 mount();await screen.findByRole('heading',{name:'Fixture'});
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Synthetic greeting'}});
 fireEvent.click(screen.getByRole('button',{name:'傳送'}));
 expect(await screen.findByText('A real server reply')).toBeInTheDocument();
 expect(screen.queryByText('...')).not.toBeInTheDocument();
});
it('shows failure and restores input when the backend returns no message',async()=>{
 fixtures.message='';mount();await screen.findByRole('heading',{name:'Fixture'});
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Synthetic greeting'}});
 fireEvent.click(screen.getByRole('button',{name:'傳送'}));
 expect(await screen.findByText(/連線中斷/)).toBeInTheDocument();
 expect(screen.getByRole('textbox')).toBeEnabled();
 expect(screen.queryByText('...')).not.toBeInTheDocument();
});
it('renders canonical hatchling at level 2 without negative growth or egg evolution',async()=>{
 mount();await screen.findByRole('heading',{name:'Fixture'});
 expect(screen.getByRole('button',{name:'需要 Lv.5 才能進化'})).toBeDisabled();
 expect(screen.getByText('34')).toBeInTheDocument();
 expect(screen.getByText(/尚未設定物種/)).toBeInTheDocument();
 expect(screen.queryByText('-6')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:/進化到 蛋/})).not.toBeInTheDocument();
 expect(screen.getByRole('link',{name:'🎯 學習挑戰'})).toHaveAttribute('href','/academy');
});
it('fails closed for unknown stages and invalid levels',()=>{
 for(const [stage,level] of [['unknown',2],['HATCHLING',-1],['HATCHLING',NaN]] as const){
  expect(progression(stage,level).canEvolve).toBe(false);expect(growthValue(stage,level,7,20)).toBeNull();
 }
 expect(progression('LEGENDARY',60).next).toBeUndefined();
 expect(progression('HATCHLING',5).next).toBe('JUVENILE');
 expect(progression('HATCHLING',5).canEvolve).toBe(true);
 for(const stage of STAGES) expect(growthValue(stage,1,7,20)).toBeGreaterThanOrEqual(0);
});
describe.each([
 ['zh-TW','生成精靈圖片','需要 Lv.5 才能進化'],
 ['zh-CN','生成精灵图片','需要 Lv.5 才能进化'],
 ['en-US','Generate spirit image','Requires Lv.5'],
 ['ja-JP','画像を生成','Lv.5 が必要です'],
 ['ko-KR','스피릿 이미지 생성','Lv.5 필요'],
])('%s spirit controls',(language,generate,evolve)=>{
 it('renders translated controls with correct progression',async()=>{
  mount(language);await screen.findByRole('heading',{name:'Fixture'});
  expect(screen.getByRole('button',{name:generate})).toBeEnabled();
  expect(screen.getByRole('button',{name:evolve})).toBeDisabled();
 });
});
