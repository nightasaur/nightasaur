# SmolLM2 1.7B local evaluation record

Review date: 2026-09-19. Reviewer: Codex, acting on the owner's authorization
to complete local Runtime revalidation. Scope: synthetic-data local evaluation;
this does not select a production default or certify a whole-product release.

## Source and artifact identity

- Upstream: [HuggingFaceTB/SmolLM2-1.7B-Instruct](https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct).
- Upstream revision observed via the publisher API:
  `31b70e2e869a7173562077fd711b654946d38674`.
- Publisher-declared base: `HuggingFaceTB/SmolLM2-1.7B`.
- Packaging: [Ollama library smollm2:1.7b](https://ollama.com/library/smollm2:1.7b),
  Q8_0, 1.71B parameters; no added adapter or local alias is selected.
- Registry manifest fetched from
  `https://registry.ollama.ai/v2/library/smollm2/manifests/1.7b`.
- SHA-256 of the exact manifest bytes:
  `cef4a1e09247f018ca0c482ad4c2ce1474aba5e87f245dacf97f07948d05d8b4`.
- Weight-layer SHA-256:
  `4d2396b16114669389d7555c15a1592aad584750310f648edad5ca8c4eccda17`.
- Weight-layer size: 1,820,414,656 bytes.
- License-layer SHA-256:
  `58d1e17ffe5109a7ae296caafcadfdbe6a7d176f0bc4ab01e12a689b0499d8bd`.

The manifest digest identifies the Ollama package, not just its weights. The
upstream revision is recorded separately; byte-for-byte reproducibility of the
Ollama conversion from that upstream revision has not been established. Stop
the evaluation if the installed package digest differs from this record.

## License and provenance review

Both the publisher model card and the Ollama package declare Apache-2.0. The
package's [license text](https://ollama.com/library/smollm2:1.7b/blobs/58d1e17ffe51)
was inspected. Distribution requires preserving the license and applicable
attribution/NOTICE, and identifying modifications. We do not redistribute model
weights in this repository.

The publisher provides the base-model lineage, links to public pre/post-training
code, SmolTalk, UltraFeedback, and the stated pretraining data mixture. See the
[training repository](https://github.com/huggingface/smollm). These are observed
source declarations, not an independent audit of every training record or
synthetic-data generator. Do not describe this review as certifying that every
training input is reproducible or that all product licensing gaps are closed.
The selected weights have the publisher-declared SmolLM2 lineage; they are not
a renamed prohibited-family checkpoint. No prohibited model is run, downloaded,
or used as a fallback by this evaluation.

Decision: eligible for the owner's requested local synthetic-data smoke test,
with this exact package digest. Any production adoption needs a separate
quality, provenance and deployment decision. Primarily English capability is
documented upstream; multilingual product quality is not inferred from this test.

## Hardware evidence and execution status

The owner supplied a real smoke report generated at
`2026-09-19T16:29:26.563231+00:00` for candidate
`4bb762f64c1b7fdb607ab05f73a39b1b605cc84d`:

- Windows build 26200, RTX 3070 Laptop GPU, 8192 MiB, driver 576.28.
- Ollama 0.34.0; model pull completed and the reviewed manifest digest matched.
- Environment, fixture integrity and candidate integrity checks passed.
- `real_tool_result_reproduced: false`, `runtime_verified: false`, process exit 1.

This establishes installation and environment prerequisites, not a passed local
Runtime or actual GPU utilization. The report omitted call-level diagnostics, so
its precise inference failure cannot be reconstructed from that output alone.
The next candidate requires a new Windows run; do not reuse the old failure as
success or the earlier prohibited-model result as current evidence.

The subsequent CPU software reproduction uses the same package and a schema-
constrained required-tool request. Three fresh synthetic reads passed in the
final implementation. See `docs/evidence/2026-09-19-smollm2-cpu-runtime.json`.
This narrower tool-loop evidence does not establish general model quality,
autonomous planning, Chinese-language quality, GPU acceleration or production
readiness; the candidate must still be rerun on the owner's laptop.
