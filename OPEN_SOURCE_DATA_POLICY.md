# Auxiliary Open-Source Data Policy

Nightasaur may register third-party open resources for provenance and may ingest
small, explicitly approved text resources for auxiliary retrieval. Registration
does not mean that Nightasaur owns the resource, endorses it, or has completed a
legal review.

## Required label

Every third-party record and content chunk is stored as:

- `role = AUXILIARY_OPEN_SOURCE`
- `isAuthoritative = false`

Auxiliary content must never be presented as official, legal, medical, safety,
or product-policy authority.

## Two-layer registry

1. **Metadata layer:** lockfile packages, pinned Python requirements, and curated
   external tools are recorded with source, version, declared license, and
   provenance. Their content is not copied. Unknown or unverified licenses use
   `NOASSERTION` and remain `REVIEW_REQUIRED`.
2. **Content layer:** content is accepted only from
   `data/open-source/approved/`, with a fixed SHA-256 digest and an allowlisted
   license: `CC0-1.0`, `CC-BY-4.0`, `CC-BY-SA-4.0`, `PDDL-1.0`, `ODC-By-1.0`,
   or `ODbL-1.0`. Attribution is mandatory when the license requires it. A
   named, timestamped legal review is also required; the automated allowlist is
   only an engineering gate and never substitutes for that review.

## Automatic rejection

The importer rejects content when any of the following is true:

- the license is absent, unknown, noncommercial, no-derivatives, proprietary,
  or outside the content allowlist;
- the source is not HTTPS, the file is a symlink/binary/unsupported format, the
  digest differs, or the file exceeds the baseline size limit;
- the material contains personal, sensitive, or child data;
- required attribution is missing.
- a named and timestamped legal review is absent.

Nightasaur-owned spirit art, unverified training artifacts, model weights, and
the repository's legacy `data/captions.txt` are excluded until provenance and
rights are independently documented. A public URL or an “open” label alone is
not sufficient.

## Execution boundary

`npm run catalog:import` is fail-closed. It requires a local SQLite database,
must not run with `NODE_ENV=production`, and requires the explicit environment
acknowledgement `OPEN_SOURCE_CATALOG_IMPORT=I_UNDERSTAND_LOCAL_ONLY`.
Production migration or import requires a separate approval and review.

## Reference standards

- SPDX License List: <https://spdx.org/licenses/>
- Creative Commons licenses: <https://creativecommons.org/cc-licenses/>
- Open Data Commons licenses: <https://opendatacommons.org/licenses/>
- OAIC definition of personal information:
  <https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/what-is-personal-information>
