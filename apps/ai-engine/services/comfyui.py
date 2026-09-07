"""ComfyUI 生圖服務"""
import httpx, asyncio, random, uuid, time
from config import COMFYUI_URL

class ComfyUIService:
    def __init__(self):
        self.base_url = COMFYUI_URL
        self.client_id = str(uuid.uuid4())

    async def health_check(self) -> dict:
        try:
            async with httpx.AsyncClient(timeout=5) as c:
                r = await c.get(f"{self.base_url}/system_stats")
                if r.status_code == 200:
                    d = r.json()
                    return {"status":"ok","vram_total":d["system"].get("vram_total",0),"vram_free":d["system"].get("vram_free",0)}
                return {"status":"error","msg":f"HTTP {r.status_code}"}
        except Exception as e:
            return {"status":"offline","msg":str(e)}
    async def generate_image(self, prompt: str, negative: str = "", width: int = 768, height: int = 768, steps: int = 25, cfg: float = 7.5, seed: int = -1) -> dict:
        if seed < 0: seed = random.randint(1, 2_147_483_647)
        wf = {
            "3":{"inputs":{"seed":seed,"steps":steps,"cfg":cfg,"sampler_name":"euler_ancestral","scheduler":"normal","denoise":1.0,"model":["4",0],"positive":["6",0],"negative":["7",0],"latent_image":["5",0]},"class_type":"KSampler"},
            "4":{"inputs":{"ckpt_name":"sd15.safetensors"},"class_type":"CheckpointLoaderSimple"},
            "5":{"inputs":{"width":width,"height":height,"batch_size":1},"class_type":"EmptyLatentImage"},
            "6":{"inputs":{"text":prompt,"clip":["4",1]},"class_type":"CLIPTextEncode"},
            "7":{"inputs":{"text":negative or "ugly, blurry, low quality, bad anatomy","clip":["4",1]},"class_type":"CLIPTextEncode"},
            "8":{"inputs":{"samples":["3",0],"vae":["4",2]},"class_type":"VAEDecode"},
            "9":{"inputs":{"filename_prefix":"nightasaur","images":["8",0]},"class_type":"SaveImage"},
        }
        try:
            async with httpx.AsyncClient(timeout=180) as c:
                s = await c.post(f"{self.base_url}/prompt", json={"prompt":wf,"client_id":self.client_id})
                if s.status_code != 200: return {"status":"error","msg":s.text[:200]}
                pid = s.json()["prompt_id"]
                return await self._wait(c, pid, seed)
        except httpx.ConnectError:
            return {"status":"offline","msg":"ComfyUI offline"}
        except Exception as e:
            return {"status":"error","msg":str(e)}

    async def _wait(self, client, pid: str, seed: int, max_wait: int = 180) -> dict:
        started = time.time()
        while time.time() - started < max_wait:
            await asyncio.sleep(2)
            try:
                r = await client.get(f"{self.base_url}/history/{pid}")
                if r.status_code != 200: continue
                d = r.json()
                if pid in d:
                    images = []
                    for out in d[pid].get("outputs",{}).values():
                        for img in out.get("images",[]):
                            images.append({"filename":img["filename"],"url":f"{self.base_url}/view?filename={img['filename']}&subfolder={img.get('subfolder','')}&type={img.get('type','output')}"})
                    if images: return {"status":"completed","pid":pid,"seed":seed,"images":images}
            except Exception: pass
        return {"status":"timeout","pid":pid}

    async def generate_spirit(self, name: str, element: str, stage: str = "EGG") -> dict:
        p = {
            "FIRE":f"cute baby fire dragon {name}, small flames, warm glow, Pokemon baby style, egg hatching, digital art",
            "WATER":f"cute baby water spirit {name}, blue aquatic aura, bubbles, Pokemon baby style, egg hatching, digital art",
            "SHADOW":f"cute baby shadow creature {name}, dark purple mist, glowing eyes, Pokemon baby style, egg hatching, digital art",
            "STAR":f"cute baby star dragon {name}, cosmic nebula, sparkles, Pokemon baby style, egg hatching, digital art",
            "MOON":f"cute baby moon spirit {name}, lunar glow, night sky, Pokemon baby style, egg hatching, digital art",
            "LIGHT":f"cute baby light fairy {name}, radiant halo, golden glow, Pokemon baby style, egg hatching, digital art",
            "ILLUSION":f"cute baby mystical fox {name}, ethereal glow, mist, Pokemon baby style, egg hatching, digital art",
            "NATURE":f"cute baby forest spirit {name}, leaves vines, green glow, Pokemon baby style, egg hatching, digital art",
            "THUNDER":f"cute baby electric dragon {name}, lightning sparks, electric blue, Pokemon baby style, egg hatching, digital art",
            "ICE":f"cute baby ice dragon {name}, frost crystals, icy blue glow, Pokemon baby style, egg hatching, digital art",
        }
        prompt = p.get(element, f"cute baby monster {name}, whimsical, Pokemon baby style, egg hatching, digital art")
        if stage != "EGG": prompt = prompt.replace("baby","young").replace("hatching","evolved dynamic pose")
        return await self.generate_image(prompt)


comfyui_service = ComfyUIService()
