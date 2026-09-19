# Model selection and release boundary

- Qwen is prohibited by project decision for development, testing, runtime,
  and fallback. This is not a statement that all variants share one license.
- `OLLAMA_MODEL` defaults to empty. Text inference then returns a clear
  disabled message and its provider health is `disabled`, with no HTTP calls.
- Explicit identifiers containing Qwen (case-insensitive, including namespaced
  and derived identifiers) are rejected before provider requests. NFKC Unicode
  normalization is applied. This cannot detect a prohibited model renamed to
  an unrelated alias: upstream provenance and digest review remain mandatory.
- There is no automatic model download, substitute, or fallback model.
- Unit tests use fixture identifiers and mocked HTTP/FakeModelProvider only.
  They neither download nor execute weights, and do not establish real-model
  quality, hardware readiness, or commercial release approval.

## Before enabling a model

Record its exact upstream source, version and weight digest; base-model and
derivative lineage; license text and applicable commercial/distribution terms;
required notices; reviewer and review date. Review data and adapter provenance.
An identifier passing the prohibition check is NOT license approval. No model
has been approved by this PR. Do not enable renamed prohibited derivatives.

Review existing environment variables separately: old prohibited values fail
closed, rather than being silently replaced. This code change does not modify
cloud settings or delete model files on anyone's machine.

Image-generation models, training recipes, assets and other dependencies need
their own audit. Removing the prohibited text model is not whole-project
commercial clearance. Remaining security, privacy and release gates in the
baseline PR stay open. No production rollout or database operation is granted
by this checkpoint.
