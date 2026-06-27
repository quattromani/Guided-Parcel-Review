# Visit Analytics Apps Script

This is the standalone Google Apps Script source for the public visit analytics endpoint used by `src/visit-analytics.js`.

Deploy it as a separate Apps Script web app from the BOE protest tracker script in `apps-script/Code.gs`. Both scripts define `doPost`, so they should not be combined into the same Apps Script project without adding a dispatcher.

The script appends rows by header name. Existing sheets keep their current columns, and any missing v2 headers are added to the right.

Tracking URL fields are included as first-party attribution columns:

- `trackingId`
- `trackingPerson`
- `trackingLabel`

Redeploy the web app after changing `Code.gs` so the live endpoint can add those headers to the sheet.
