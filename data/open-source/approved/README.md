# Approved auxiliary content staging

Only small text resources listed in `../catalog.json` may be placed here.
Every content entry must have a fixed SHA-256 digest, an allowlisted data/content
license, complete attribution when required, and explicit negative declarations
for personal, sensitive, and child data.

Files in this directory are not authoritative Nightasaur content. The importer
stores them with the role `AUXILIARY_OPEN_SOURCE` and `isAuthoritative=false`.
