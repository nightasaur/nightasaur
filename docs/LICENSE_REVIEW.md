# License evidence and remaining review

Evidence collected 2026-09-19 from installed artifacts matching the repository's pinned versions. This is a technical evidence checkpoint, not whole-product commercial clearance.

`data/compliance/packages.json` retains the original declarations: 1,676 records, including lockfile locations rather than unique products. `license-evidence.json` examines the 36 records with missing or non-common declarations: 28 have license/notice files, six platform packages are not installed, and two have no matching root license file. Each collected file has a SHA-256 digest. Hashes support comparison, not authentication of an upstream author or fulfillment of distribution obligations.

Reproduce offline after installing the exact lockfile and pinned Python requirements:

```sh
python scripts/collect-license-evidence.py
```

Run with the Python environment holding the pinned requirements. It rejects installed version mismatches. Platform-dependent absence is explicit; this snapshot is not a universal CI equality gate. The existing inventory `--check` still checks repository inputs. The scanner does not infer legal approval from a filename and does not inspect arbitrary nested files.

## Previously missing declarations: evidence located

All 15 NOASSERTION records have installed license files. Keep the upstream lock declarations unchanged; these are observed license texts requiring distribution review.

| Packages (exact versions in evidence JSON) | Observed license family | Remaining action |
|---|---|---|
| @segment/loosely-validate-event, busboy, requireg, spawn-command, streamsearch, valid-url | MIT | Preserve copyright and permission notices in delivered distributions |
| qrcode-terminal | Apache-2.0 | Preserve license and applicable notices; check modifications |
| pytest, fastapi, pydantic | MIT | Preserve notices; distinguish test dependencies from shipped code |
| pytest-asyncio | Apache-2.0 | Preserve applicable notices |
| uvicorn, httpx, python-dotenv | BSD-3-Clause | Preserve notices and disclaimer; comply with endorsement restriction |
| Pillow | MIT-CMU | Preserve the actual MIT-CMU text; inspect bundled native libraries separately |

## Exceptions requiring a decision or more evidence

| Item | Required evidence / decision | Release scope |
|---|---|---|
| lightningcss 1.19.0 and native packages, MPL-2.0 | Identify shipped binaries and any modified covered files; satisfy source and notice obligations. Obtain license evidence for six absent platform artifacts if distributing them | Each distributed platform |
| Geist font, OFL-1.1 | Bundle font license; inspect reserved font names before modifying/renaming; check delivered font artifacts | Web/mobile distribution |
| caniuse-lite, CC-BY-4.0 | Preserve attribution/license and identify modifications when distributed | Any delivered database copy |
| node-forge dual BSD-3-Clause OR GPL-2.0 | Record selected BSD route and preserve the corresponding text after verifying exact artifact; do not assume GPL is mandatory | Delivered dependency |
| type-fest, rc, fb-dotslash alternative licenses | Record selected permitted route; fb-dotslash lacks a collected root license file, so obtain exact-version source evidence | Delivered dependency/tool |
| readline 1.3.0, generic BSD | No collected root license text: establish exact BSD terms from version-specific source or remove/replace dependency | Before distributing this dependency |
| argparse Python-2.0 | Review its included license history and preserve required notices | Delivered dependency |
| Python transitive/native packages | Produce a complete pinned/hashes lock and wheel/native-library evidence; 44 observed test-environment packages are not a production SBOM | Actual production image |
| Five model references | Exact source revision, weight digest, model license, commercial/redistribution rights, training-data restrictions; disabled text provider is not a licensed model selection | Before enabling a model; project-prohibited family remains blocked |
| Eleven tracked visual assets | Creator/source, permission or assignment, commercial/redistribution rights; repository presence is not proof | Before distributing assets |
| Containers and infrastructure | Pin image digests and collect OS/native dependency SBOM, licenses and notices | Actual released images |

Open-source licenses can permit commercial use while imposing conditions; incomplete evidence does not establish a commercial-use ban. Review the artifact and intended distribution. Authoritative texts: [MIT](https://opensource.org/license/mit), [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0), [MPL FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/), [OFL](https://openfontlicense.org/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Acceptance record required before clearance

For each shipped component, the release owner records exact version/digest, source, chosen license, copied LICENSE/NOTICE location, modifications and any required source offer. Asset/model owners supply rights evidence privately where contracts contain sensitive details; only publish authorized attribution. Generate a final notices bundle and SBOM from the actual release artifact, review remaining exceptions, and attach approval to that release revision. No component is marked APPROVED by this checkpoint.

## Reproducible partial notices bundle

Run `python scripts/export-license-notices.py --output-dir /tmp/nightasaur-notices` in the same installed environment used for evidence collection. The exporter validates the inventory digest, exact installed versions and every collected file's size and SHA-256 before writing output. Changed or missing evidence fails instead of silently exporting different terms.

The committed `data/compliance/notices/THIRD_PARTY_NOTICES.txt` preserves 30 license/notice files from the 28 evidenced records. `NOTICE_COVERAGE.json` explicitly lists eight unresolved records. This is a partial evidence bundle, not notices for all 1,676 records or a production release. Regenerate after reviewed evidence changes and complete the final artifact inventory before distribution.

`python -m unittest discover -s scripts/tests` verifies text preservation, tamper rejection, inventory drift, path containment and unresolved-item reporting; CI runs this test.
