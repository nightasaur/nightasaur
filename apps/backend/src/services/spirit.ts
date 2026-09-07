import prisma from "../config/prisma.js";
import { gameService } from "./game.js";
function fmt(s:any){return{...s,stats:typeof s.stats==="string"?JSON.parse(s.stats||"{}"):s.stats,skills:typeof s.skills==="string"?JSON.parse(s.skills||"[]"):s.skills,customization:typeof s.customization==="string"?JSON.parse(s.customization||"{}"):s.customization};}
const SO:Record<string,number>={EGG:0,HATCHLING:1,JUVENILE:2,ADULT:3,ULTIMATE:4,LEGENDARY:5};
function nextStage(c:string){const o=SO[c]??-1;if(o>=5)return null;return Object.keys(SO).find(k=>SO[k]===o+1)||null;}
function reqLevel(s:string){const r:Record<string,number>={HATCHLING:1,JUVENILE:5,ADULT:15,ULTIMATE:30,LEGENDARY:60};return r[s]||1;}
function genStats(){const h=50+Math.floor(Math.random()*30);return{hp:h,atk:40+Math.floor(Math.random()*30),def:30+Math.floor(Math.random()*30),spd:35+Math.floor(Math.random()*30),maxHp:h};}
function getSkills(e:string):string[]{const s:Record<string,string[]>={FIRE:["fireball","firebloom"],WATER:["watergun","tideshield"],LIGHT:["lightarrow","healinglight"],SHADOW:["shadowclaw","stealth"],STAR:["meteorshower","stardustburst"],ILLUSION:["illusionclone","confusingeye"],MOON:["moonbeam","nightblessing"],NATURE:["vinewhip","photosynthesis"],THUNDER:["thunderstrike","thunderclap"],ICE:["freezeray","avalanche"]};return s[e]||["charge","roar"];}

function imgPrompt(n:string,e:string,p?:string|null,a?:string|null){
  const m:Record<string,string>={FIRE:"fiery flames",WATER:"aquatic water aura",LIGHT:"luminous radiant halo",SHADOW:"shadowy dark mist",STAR:"cosmic starry nebula",ILLUSION:"mystical ethereal glow",MOON:"lunar moonlit",NATURE:"verdant leaves vines",THUNDER:"electric lightning",ICE:"frozen icy crystals"};
  let creature = "fantasy creature";
  const aa = (a||"").toLowerCase();
  if (aa.includes("dragon")) creature = "dragon";
  else if (aa.includes("beast")||aa.includes("wolf")) creature = "beast wolf creature";
  else if (aa.includes("bird")||aa.includes("eagle")) creature = "bird phoenix creature";
  else if (aa.includes("fish")) creature = "aquatic fish creature";
  else if (aa.includes("humanoid")) creature = "humanoid elf fairy";
  else if (aa.includes("blob")||aa.includes("slime")) creature = "cute slime blob";
  else if (aa.includes("crystal")) creature = "crystal golem";
  else if (aa.includes("mech")) creature = "robot mecha";
  else if (aa.includes("plant")) creature = "plant treant";
  else if (aa.includes("spirit")||aa.includes("ghost")) creature = "ghost spirit phantom";
  return `A cute ${creature} named "${n}", ${m[e]||"mysterious"}, Pokemon-style digital art, ${p||"friendly"}, vibrant, concept art`;
}
function evoPrompt(n:string,e:string,s:string,a?:string|null){return `Evolution of "${n}" (${e}), "${s}" stage. More powerful, larger. ${a||""}. Pokemon evolution style, epic lighting.`;}

export class SpiritService {
  async createSpirit(p: {userId:string;name:string;element:string;personality?:string;appearance?:string;species?:string}) {
    // 首先檢查使用者是否存在
    const user = await prisma.user.findUnique({ where: { id: p.userId } });
    if (!user) {
      throw Object.assign(new Error(`使用者不存在 (ID: ${p.userId})`), { statusCode: 404 });
    }

    const existing = await prisma.spirit.findFirst({where:{name:p.name,userId:p.userId}});
    if (existing) throw Object.assign(new Error("You already have a spirit with the same name!"),{statusCode:409});
    const spirit = await prisma.spirit.create({data:{
      name:p.name,userId:p.userId,element:p.element,
      species:p.species||null,
      personality:p.personality||null,appearance:p.appearance||null,
      stage:"EGG",level:1,experience:0,
      stats:JSON.stringify(genStats()),skills:JSON.stringify(getSkills(p.element)),
      customization: "{}", // 添加缺失的 customization 欄位
    }});
    await prisma.generationTask.create({data:{
      spiritId:spirit.id,userId:p.userId,taskType:"GENERATE_SPIRIT_IMAGE",
      inputPrompt:imgPrompt(p.name,p.element,p.personality,p.appearance),status:"PENDING",
    }});
    await gameService.trackAction(p.userId, "CREATE_SPIRIT", 1).catch(()=>{});
    return fmt(spirit);
  }

  async getUserSpirits(userId:string) {
    const s = await prisma.spirit.findMany({where:{userId,isActive:true},orderBy:{createdAt:"desc"},include:{evolutions:{orderBy:{createdAt:"asc"}}}});
    return s.map(fmt);
  }

  async getSpiritById(id:string) {
    const s = await prisma.spirit.findUnique({where:{id},include:{evolutions:{orderBy:{createdAt:"asc"}},conversations:{orderBy:{createdAt:"desc"},take:20}}});
    if (!s) throw Object.assign(new Error("Spirit not found"),{statusCode:404});
    return fmt(s);
  }

  async evolveSpirit(spiritId:string,userId:string) {
    const s = await prisma.spirit.findFirst({where:{id:spiritId,userId,isActive:true}});
    if (!s) throw Object.assign(new Error("Spirit not found"),{statusCode:404});
    const ns = nextStage(s.stage);
    if (!ns) throw Object.assign(new Error("Spirit has reached maximum evolution stage!"),{statusCode:400});
    const rl = reqLevel(ns);
    if (s.level<rl) throw Object.assign(new Error(`Spirit needs to reach Lv.${rl} to evolve!`),{statusCode:400});
    const evolved = await prisma.spirit.update({where:{id:spiritId},data:{stage:ns,level:s.level+1}});
    await prisma.evolution.create({data:{spiritId,fromStage:s.stage,toStage:ns,triggeredBy:`Reached Lv.${s.level}`}});
    await prisma.generationTask.create({data:{spiritId,userId,taskType:"GENERATE_EVOLUTION_IMAGE",inputPrompt:evoPrompt(evolved.name,evolved.element,ns,evolved.appearance),status:"PENDING"}});
    await gameService.trackAction(userId, "EVOLVE", 1).catch(()=>{});
    return fmt(evolved);
  }

  async renameSpirit(spiritId:string,userId:string,newName:string) {
    const s = await prisma.spirit.findFirst({where:{id:spiritId,userId}});
    if (!s) throw Object.assign(new Error("Spirit not found"),{statusCode:404});
    return prisma.spirit.update({where:{id:spiritId},data:{name:newName}});
  }

  async customizeSpirit(spiritId:string,userId:string,data:{customization?:any;name?:string}) {
    const s = await prisma.spirit.findFirst({where:{id:spiritId,userId}});
    if (!s) throw Object.assign(new Error("Spirit not found"),{statusCode:404});
    const update:any = {};
    if (data.customization !== undefined) update.customization = JSON.stringify(data.customization);
    if (data.name) update.name = data.name;
    const updated = await prisma.spirit.update({where:{id:spiritId},data:update});
    if (data.customization !== undefined) await gameService.trackAction(userId, "CUSTOMIZE", 1).catch(()=>{});
    return fmt(updated);
  }
}
export const spiritService = new SpiritService();