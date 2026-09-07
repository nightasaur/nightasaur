#!/usr/bin/env python3
"""Nightasaur LoRA Training Script — GTX 3070 8GB Optimized"""
import os, sys
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent
IMAGES_DIR = BASE_DIR
TRAIN_DIR = Path.cwd() / "training_data"
MODEL_NAME = "nightasaur_style"


def main():
    print("Nightasaur LoRA Training Setup")

    images = list(IMAGES_DIR.glob("*.jpg")) + list(IMAGES_DIR.glob("*.png"))
    print(f"Source images: {len(images)}")
    if not images:
        print(f"ERROR: No images found in {IMAGES_DIR}")
        return

    # Step 1: Preprocess
    try:
        from PIL import Image
    except ImportError:
        print("Install: pip install Pillow")
        return

    TRAIN_DIR.mkdir(parents=True, exist_ok=True)
    for img_path in images:
        try:
            img = Image.open(img_path).convert("RGB")
            w, h = img.size
            s = min(w, h)
            img = img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
            img = img.resize((512, 512), Image.LANCZOS)
            out = TRAIN_DIR / f"{img_path.stem}.png"
            img.save(out, "PNG")
            print(f"  OK {img_path.name} -> {out.name}")
        except Exception as e:
            print(f"  FAIL {img_path.name}: {e}")

    # Step 2: Captions
    captions = {
        "AQUALUME": "nightasaur style, blue aquatic dragon, water light aura, glowing fins, digital art",
        "EMBERAPTOR": "nightasaur style, orange fire raptor, warm flame feathers, speed, digital art",
        "FLAREON": "nightasaur style, red fire guardian dragon, magma veins, horned shield, digital art",
        "LUMIVOR": "nightasaur style, white pearl dragon, moon light, silver iridescent, digital art",
        "NEBULODON": "nightasaur style, purple star dragon, cosmic nebula, sound wave, digital art",
        "Nightasaur-Luma": "nightasaur style, legendary Nightasaur, moonlit forest glow, digital art",
        "NOCTIWIND": "nightasaur style, indigo wind dragon, crescent wings, night glider, digital art",
        "SOLASPIKE": "nightasaur style, golden sun dragon, solar plates, order guardian, digital art",
        "UMBROSAUR": "nightasaur style, dark guardian, black charcoal blue, reverse light, digital art",
    }

    for img_path in TRAIN_DIR.glob("*.png"):
        txt = img_path.with_suffix(".txt")
        matched = next((k for k in captions if k.upper() in img_path.stem.upper()), None)
        caption = captions.get(matched, f"nightasaur style, fantasy monster {img_path.stem}, digital art")
        txt.write_text(caption, encoding="utf-8")

    count = len(list(TRAIN_DIR.glob("*.png")))
    print(f"Done: {count} images + captions in {TRAIN_DIR}")

    print(f"""
Training command (Kohya SS):
---
git clone https://github.com/bmaltais/kohya_ss.git
cd kohya_ss && ./setup.sh

accelerate launch sd-scripts/train_network.py \\
  --pretrained_model_name_or_path="runwayml/stable-diffusion-v1-5" \\
  --train_data_dir="{TRAIN_DIR}" \\
  --output_dir="./output" \\
  --output_name="{MODEL_NAME}" \\
  --resolution="512,512" --train_batch_size=1 \\
  --max_train_steps=1500 --learning_rate=1e-4 \\
  --network_module="networks.lora" --network_dim=32 --network_alpha=16 \\
  --mixed_precision="fp16" --save_precision="fp16" \\
  --clip_skip=2 --caption_extension=".txt" --enable_bucket

Output: ./output/{MODEL_NAME}.safetensors
Copy to ComfyUI/models/loras/
""")


if __name__ == "__main__":
    main()
