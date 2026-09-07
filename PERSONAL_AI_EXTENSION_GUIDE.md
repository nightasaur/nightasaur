# Nightasaur Personal AI Assistant Extension

This extension adds personal AI assistant capabilities to Nightasaur, transforming it from a spirit companion to a full-featured personal AI assistant.

## Features

### 1. General Assistant Mode
- Code assistance and debugging
- Document processing and analysis
- Translation services
- Knowledge Q&A
- Learning support

### 2. Enhanced Dialogue System
- Context-aware conversations
- Multi-turn dialogue management
- Personality switching (Spirit/Assistant)
- Streamed responses

### 3. File Processing
- PDF/Word/Excel parsing
- Image text extraction
- Audio transcription
- Code file analysis

## Implementation Plan

### Phase 1: Core Assistant Functions

#### 1.1 Assistant Service
```python
# apps/ai-engine/services/assistant.py
class PersonalAssistantService:
    async def general_chat(self, message: str, context: dict) -> str:
        """General purpose chat like ChatGPT"""
        pass
    
    async def code_assistance(self, code: str, language: str) -> str:
        """Code review, debugging, and generation"""
        pass
    
    async def document_analysis(self, file_content: str, file_type: str) -> str:
        """Analyze and summarize documents"""
        pass
    
    async def translate(self, text: str, target_lang: str) -> str:
        """Multi-language translation"""
        pass
```

#### 1.2 Enhanced LLM Service
```python
# apps/ai-engine/services/llm_enhanced.py
class EnhancedLLMService:
    def __init__(self):
        self.modes = {
            'spirit': SpiritMode(),
            'assistant': AssistantMode(),
            'coder': CoderMode(),
            'translator': TranslatorMode()
        }
    
    async def chat(self, mode: str, **kwargs):
        """Chat with specified mode"""
        return await self.modes[mode].process(**kwargs)
```

### Phase 2: User Interface

#### 2.1 Assistant Chat Interface
```typescript
// apps/web/src/components/AssistantChat.tsx
interface AssistantChatProps {
    mode: 'spirit' | 'assistant' | 'coder' | 'translator';
    onModeChange: (mode: string) => void;
    onFileUpload: (file: File) => void;
}

const AssistantChat: React.FC<AssistantChatProps> = ({
    mode,
    onModeChange,
    onFileUpload
}) => {
    // Implementation
};
```

#### 2.2 Mode Selector
```typescript
// apps/web/src/components/ModeSelector.tsx
const modes = [
    { id: 'spirit', name: '精靈夥伴', icon: '🐉', description: '與你的數碼精靈對話' },
    { id: 'assistant', name: 'AI助手', icon: '🤖', description: '通用問題解答' },
    { id: 'coder', name: '編程助手', icon: '💻', description: '代碼編寫與調試' },
    { id: 'translator', name: '翻譯助手', icon: '🌐', description: '多語言翻譯' },
    { id: 'document', name: '文檔助手', icon: '📄', description: '文件分析處理' },
];
```

### Phase 3: Backend Integration

#### 3.1 Assistant Routes
```typescript
// apps/backend/src/routes/assistant.ts
router.post('/chat', authenticate, assistantController.chat);
router.post('/code', authenticate, assistantController.codeAssistance);
router.post('/document', authenticate, assistantController.documentAnalysis);
router.post('/translate', authenticate, assistantController.translate);
router.post('/upload', authenticate, assistantController.uploadFile);
```