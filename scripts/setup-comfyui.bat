@echo off
REM ========================================
REM  Nightasaur ComfyUI 安裝腳本
REM  GTX 3070 8GB VRAM 最佳化設定
REM ========================================

echo.
echo ╔══════════════════════════════════════╗
echo ║  🎨 Nightasaur ComfyUI Setup       ║
echo ║  for RTX 3070 8GB VRAM             ║
echo ╚══════════════════════════════════════╝
echo.

set COMFY_DIR=%~dp0..\ComfyUI
set MODEL_DIR=%COMFY_DIR%\models
set CHECKPOINT_DIR=%MODEL_DIR%\checkpoints
set LORA_DIR=%MODEL_DIR%\loras
set VAE_DIR=%MODEL_DIR%\vae
set APP_WORKFLOWS=%~dp0workflows

REM ---- Step 1: Clone ComfyUI ----
echo [1/6] Installing ComfyUI...
if not exist "%COMFY_DIR%" (
    git clone https://github.com/comfyanonymous/ComfyUI.git "%COMFY_DIR%"
    echo   ComfyUI cloned.
) else (
    echo   ComfyUI already exists, updating...
    cd "%COMFY_DIR%"
    git pull
    cd "%~dp0.."
)

REM ---- Step 2: Install Python deps ----
echo [2/6] Installing Python dependencies...
cd "%COMFY_DIR%"
pip install -r requirements.txt
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
echo   Dependencies installed.

REM ---- Step 3: Download SD 1.5 checkpoint (best for 8GB VRAM) ----
echo [3/6] Downloading SD 1.5 checkpoint...
if not exist "%CHECKPOINT_DIR%\sd15.safetensors" (
    echo   Downloading dreamshaper_8.safetensors (2GB)...
    echo   Manual: https://huggingface.co/Lykon/dreamshaper-8/resolve/main/dreamshaper-8.safetensors
    echo   Place it in: %CHECKPOINT_DIR%
    echo   Rename to: sd15.safetensors
) else (
    echo   Checkpoint already exists.
)

REM ---- Step 4: Copy Nightasaur workflows ----
echo [4/6] Copying Nightasaur workflows...
copy /Y "%APP_WORKFLOWS%\spirit_generator.json" "%COMFY_DIR%\user\default\workflows\"
echo   Workflows copied.

REM ---- Step 5: Create launch script with optimizations ----
echo [5/6] Creating optimized launch script...
(
echo @echo off
echo REM Nightasaur ComfyUI - RTX 3070 8GB Optimized
echo cd /d "%COMFY_DIR%"
echo set COMMANDLINE_ARGS=--medvram --lowvram --cpu-vae
echo set PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128
echo python main.py --port 8188 --listen 0.0.0.0
) > "%COMFY_DIR%\run_nightasaur.bat"
echo   Launch script created: %COMFY_DIR%\run_nightasaur.bat

REM ---- Step 6: First-time setup hint ----
echo.
echo ╔══════════════════════════════════════╗
echo ║  ✅ ComfyUI Setup Complete!         ║
echo ║                                    ║
echo ║  NEXT: Download base model:        ║
echo ║  1. dreamshaper_8.safetensors      ║
echo ║     (SD 1.5, best for 8GB VRAM)    ║
echo ║  2. Place in:                      ║
echo ║     %CHECKPOINT_DIR%               ║
echo ║                                    ║
echo ║  THEN: Run ComfyUI:                ║
echo ║     %COMFY_DIR%\run_nightasaur.bat ║
echo ║                                    ║
echo ║  Web UI: http://localhost:8188     ║
echo ╚══════════════════════════════════════╝
echo.

pause