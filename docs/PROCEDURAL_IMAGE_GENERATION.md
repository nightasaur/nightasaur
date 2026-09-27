# Original procedural image generation

The owner requested image generation and self-developed open-source code when
model/source data is unavailable. This implementation uses original geometric
creature artwork (MIT source) and the existing Pillow dependency. It downloads
no weights, invokes no model, uses no third-party art, and is explicitly labelled
`程序式生成` in the frontend. It is not diffusion or arbitrary text-to-image AI.

The image is f(element, growth stage, seed): fixed 512×512 RGB geometry, palette,
seeded particles and markings. Equal inputs produce identical PNG bytes within
the pinned runtime; changes to any input change the output. The UI generator
creates a fresh random seed. Existing mature/egg forms differ. This is a bounded
original illustration generator, not a claim of model training or IP clearance
for the rest of the product.

Enable with IMAGE_GENERATOR=procedural on the private AI Engine. Existing
service authentication protects generation. Custom text prompts are rejected;
only bounded element/stage controls influence the drawing. No user names or
conversation text are sent for generation.

GenerationTask is atomically claimed from PENDING to PROCESSING and ends in
COMPLETED or FAILED. The backend validates the PNG signature and SHA-256 and
persists a bounded data URI in the existing resultUrl column. No schema change
or public file hosting is needed. GET /api/generate/spirit/:id checks the live
spirit owner before returning the result; old internal URLs are not exposed.
Frontend SpiritDetail includes generate/display controls and failure messages.
A failed job needs an explicit retry instead of continually hammering a missing
provider. The background scheduler processes pending jobs in bounded batches.

The former ComfyUI adapter remains disabled without a configured checkpoint.
A diffusion model still needs its own exact weights/source/license record and
compute deployment. Research candidates were not enabled: Segmind tiny-sd
uses CreativeML OpenRAIL-M and Realistic Vision lineage, not an unrestricted
Apache/MIT model; SSD-1B declares Apache-2.0 but has additional teacher/data
lineage and a substantially larger runtime footprint. Sources reviewed
2026-09-20: https://huggingface.co/segmind/tiny-sd and
https://huggingface.co/segmind/SSD-1B . No candidate weights were downloaded.

Validation covers deterministic nonblank real PNGs, input variation, unsupported
inputs, private URL rejection, digest mismatch rejection and owner checks.
