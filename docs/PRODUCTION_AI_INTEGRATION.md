# Production text AI integration

Owner authorization: 2026-09-20, merge #25 to main and connect production AI.

State model: UNCONFIGURED -> AUTHENTICATED -> MODEL_DIGEST_MATCHED ->
SYNTHETIC_INFERENCE_VERIFIED -> BACKEND_CONNECTED. Health 200 is liveness only.
Any failed authentication, package check, real generation or challenge check
prevents accepting the cutover. No synthetic response may replace failed inference.

Topology: authenticated backend -> private AI Engine :8000 -> private Ollama
:11434. Neither service receives the database URL or administrator credentials.
The backend and AI Engine share a separately generated service key via Railway
reference variables. Ollama has no public domain; only the AI Engine authenticates
application requests. The local Windows laptop is not exposed to the Internet.

This deployment explicitly selects SmolLM2 1.7B Instruct, Ollama package
`smollm2:1.7b`, manifest
`sha256:cef4a1e09247f018ca0c482ad4c2ce1474aba5e87f245dacf97f07948d05d8b4`.
The publisher and package declare Apache-2.0; see the pinned sources in
[the model record](models/SMOLLM2_LOCAL_EVALUATION.md). This extends the prior
synthetic-only evaluation decision to a limited production text-inference
integration under the owner's new instruction. It does not certify the entire
product, every training record, multilingual quality or image/vision generation.
No weights are redistributed in this Git repository. Qwen remains prohibited.

Ollama uses the official `ollama/ollama:0.34.0` image and verifies the downloaded
manifest at startup. Models currently use ephemeral service storage: redeploys
may download the package again. Inference is CPU-only with one parallel request,
2048-token context and a bounded queue. The AI Engine additionally allows one
in-flight request and rejects overload with 503. This is a connectivity baseline,
not a capacity or Chinese-language quality acceptance result.

AI Engine: Dockerfile.ai, AI_STRICT_INFERENCE=1, OLLAMA_MODEL, OLLAMA_URL,
OLLAMA_EXPECTED_DIGEST and AI_ENGINE_API_KEY. Bind to :: for Railway private IPv6.
The exact package is checked before every inference, and successful responses
must include real completed-generation metadata. Failures return HTTP 503.

Backend: AI_ENGINE_URL, AI_ENGINE_API_KEY, AI_EXPECTED_MODEL and
AI_EXPECTED_MODEL_DIGEST. Run `node deploy/verify-production-ai.mjs` as the
pre-deploy check. It first proves unauthenticated access is denied, then sends a
fresh synthetic random challenge through the authenticated AI endpoint and checks
the returned model/digest and real-generation evidence. Logs contain only bounded
verification metadata, never the service key, challenge, model text or user data.
No database reads/writes or administrator sign-in are needed for this check.

Rollback: restore the preceding backend deployment/AI configuration; disable
strict AI inference by stopping the AI service or clearing the selected model.
Do not replace failures with mock text and do not reset administrator passwords.
No schema changes are included. Image generation/vision remains disabled pending
its separate provider and source review. Immutable base-image digests, multilingual
quality, capacity and whole-product release review remain explicit follow-up work.
