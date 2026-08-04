# Standards Compatibility Projections

`iaao-standards.json` and `iaao-glossary.json` retain their established paths for application compatibility, but they are now generated projections of the canonical Shared Authority IAAO pilot. Do not edit them manually.

Canonical inputs, authority separation, provenance, and the generator are maintained in:

`../Gage-County-Assessor-Office-Knowledge-System/shared-authority/pilots/iaao/`

Regenerate and verify from the Knowledge System repository with:

```sh
python3 shared-authority/pilots/iaao/scripts/run-pilot.py --install
node shared-authority/pilots/iaao/scripts/verify-consumer-parity.mjs
```

The legacy JSON keys and consumer shapes remain supported. The corrected source citation identifies the approved April 2013 Standard on Ratio Studies; the 2025 and 2026 documents remain exposure drafts.
