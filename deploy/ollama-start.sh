#!/bin/sh
# SPDX-License-Identifier: MIT
set -eu
ollama serve &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT INT TERM
ready=0
for attempt in $(seq 1 60); do
  if OLLAMA_HOST=http://127.0.0.1:11434 ollama list >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
[ "$ready" = 1 ]
OLLAMA_HOST=http://127.0.0.1:11434 ollama pull smollm2:1.7b
printf '%s  %s\n' cef4a1e09247f018ca0c482ad4c2ce1474aba5e87f245dacf97f07948d05d8b4 /root/.ollama/models/manifests/registry.ollama.ai/library/smollm2/1.7b | sha256sum -c -
echo MODEL_MANIFEST_VERIFIED
wait "$pid"
