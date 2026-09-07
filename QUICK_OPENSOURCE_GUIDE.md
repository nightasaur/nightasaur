# Nightasaur 快速開源與個人AI化指南

## 一、5分鐘開源啟動

### 步驟1：創建GitHub倉庫
```bash
# 1. 登錄GitHub，點擊右上角"+" -> "New repository"
# 2. 填寫信息：
#    - Repository name: nightasaur
#    - Description: Nightasaur - AI Digital Spirit Platform with Personal Assistant
#    - Public repository
#    - Add README: 可選（我們已有）
#    - Add .gitignore: Node
#    - License: MIT License
# 3. 點擊"Create repository"
```

### 步驟2：推送現有代碼
```bash
# 在本地Nightasaur目錄執行：
git init
git add .
git commit -m "Initial commit: Nightasaur v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/nightasaur.git
git push -u origin main
```

### 步驟3：設置倉庫
1. **添加主題標籤**：
   - `ai-assistant`
   - `digital-pet`
   - `react`
   - `nodejs`
   - `python`
   - `open-source`

2. **添加徽章**（在README.md中添加）：
   ```markdown
   ![License](https://img.shields.io/github/license/YOUR-USERNAME/nightasaur)
   ![Version](https://img.shields.io/github/v/release/YOUR-USERNAME/nightasaur)
   ![Stars](https://img.shields.io/github/stars/YOUR-USERNAME/nightasaur)
   ```

## 二、10分鐘個人AI功能添加

### 快速添加通用對話模式

#### 1. 創建通用對話服務
```python
# 創建文件：apps/ai-engine/services/general_assistant.py
import httpx
from config import OLLAMA_URL

class GeneralAssistant:
    def __init__(self):
        self.base_url = OLLAMA_URL
        self.model = "llama3.2:latest"
    
    async def chat(self, message: str, context: list = None) -> str:
        """通用對話像ChatGPT"""
        messages = []
        
        system_prompt = """你是一個有用的AI助手，幫助用戶解決各種問題。
        你可以：
        1. 回答知識性問題
        2. 協助編程和調試
        3. 分析和總結文檔
        4. 提供學習建議
        5. 翻譯不同語言
        
        請用繁體中文回應，保持友好和專業。"""
        
        messages.append({"role": "system", "content": system_prompt})
        
        if context:
            messages.extend(context)
        
        messages.append({"role": "user", "content": message})
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False,
                        "options": {"temperature": 0.7}
                    }
                )
                if response.status_code == 200:
                    return response.json()["message"]["content"]
                else:
                    return "抱歉，我暫時無法回應。"
        except:
            return "AI服務暫時不可用。"
```

#### 2. 添加路由
```python
# 修改文件：apps/ai-engine/routers/dialogue.py
from fastapi import APIRouter
from pydantic import BaseModel
from services.general_assistant import GeneralAssistant

router = APIRouter()
general_assistant = GeneralAssistant()

class GeneralChatRequest(BaseModel):
    message: str
    context: list[dict] = []

@router.post("/general")
async def general_chat(req: GeneralChatRequest):
    """通用AI對話"""
    response = await general_assistant.chat(req.message, req.context)
    return {"response": response}
```