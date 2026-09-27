# Model, package and asset provenance

This inventory records evidence and missing evidence. It does not certify
commercial clearance and does not copy third-party datasets or model weights.
The repository MIT license does not relicense dependencies, models or artwork.

- `data/compliance/packages.json`: every npm package location/version in the
  lockfile, source URL, integrity hash where recorded, declared license where
  present, and direct pinned Python requirements. Missing license is
  `NOASSERTION`. A package's declared license is not an independent legal review.
- `data/compliance/models-assets.json`: model and tool references, unpinned
  provenance gaps, and every tracked image/audio/video/font/3D asset with its
  SHA-256. No original source, rights grant, model weight hash or training-data
  permission is invented. All commercial approvals remain false.
- `data/compliance/python-observed.json`: an isolated Linux test environment's
  resolved package metadata. This is observational evidence, not a cross-platform
  dependency lock or a deployed production SBOM.

Regenerate offline: `python scripts/build-provenance-inventory.py`.
Check drift: `python scripts/build-provenance-inventory.py --check`.
Update these files in the same PR as any dependency/model/asset change.

Before clearing an item, record exact source/version or immutable revision,
artifact hash, license text evidence, attribution/NOTICE obligations, derivative
and training-data lineage where relevant, reviewer and review date. Versionless
claims in old guides are not sufficient. Unknown and incompatible items must
remain blocked for redistribution/production use until reviewed or replaced.

The project-prohibited model family remains blocked. No replacement model is approved.
Image-model references and artwork still need separate review; the existence of
a filename or a proprietary claim does not prove its rights provenance.

Remaining coverage gaps: Python transitive dependency locking; full copied
license/NOTICE evidence for redistribution; external model/tool installations;
user-generated and cloud-only assets; commercial and jurisdiction-specific legal
review. This registry is distinct from the auxiliary open-source catalog: it
neither imports content nor grants content-ingestion permission.
