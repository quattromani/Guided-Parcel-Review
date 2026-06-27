# Visit Analytics Schema

Guided Parcel Review analytics should stay lightweight, readable in Google Sheets, and useful for publication decisions. Raw events are the source of truth. Reports can summarize them into sessions, article views, content engagement, and media funnels.

## Current Finding

The June 2026 Guided Parcel Visits export showed that parcel events and article events were being written into the same sheet with different row shapes. The first 14 headers described parcel-review fields, while article events carried additional values beyond those headers. That made video and article interaction counts harder to trust because the meaning of a column changed by event type.

The v2 payload keeps the old fields but adds stable identifiers and named fields so new rows can be appended by header name instead of raw position.

## Required Identifiers

- `schemaVersion`: event schema version, currently `visit-analytics.v2`.
- `eventId`: unique ID for the individual event.
- `visitId`: session-scoped ID stored in `sessionStorage`.
- `pageViewId`: page-load-scoped ID for distinguishing refreshes and multiple article opens in one visit.
- `timestamp`: client-side event time.
- `receivedAt`: Apps Script receipt time.

## Content Fields

- `event`: broad event family, such as `article_view`, `article_scroll_depth`, `article_interaction`, `heartbeat`, or `visit_end`.
- `action`: specific interaction, such as `download_pdf`, `sales_map_click`, `tldr_video_play`, or `share_article`.
- `detail`: human-readable label retained for backward-compatible reporting.
- `contentType`, `articleId`, `articleTitle`: article/content identity.
- `placement`: where the action occurred, such as `hero`, `body`, or `footer`.
- `targetUrl`: destination for clicked links and downloads.

## Source Fields

- `path`, `referrer`, `referrerHost`: page and inbound source.
- `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`: campaign attribution when present.
- `trackingId`, `trackingPerson`, `trackingLabel`: first-party tracking URL attribution from `gpr_track`, `gpr_person`, and `gpr_label`.
- `fbclidPresent`: whether the inbound URL carried a Facebook click ID.
- `browserContext`: `browser`, `facebook-in-app`, `facebook-referral`, `instagram-in-app`, or `social-in-app`.
- `isFacebookInApp`: boolean for quick filtering of Facebook in-app browser behavior.

## Tracking URLs

Use first-party tracking URLs when a shared link needs to be attributable to a known person, list, or distribution path without cookies or fingerprinting. The URL parameters are captured on every event for that page view, including article views, scroll depth, resource clicks, heartbeats, and visit end.

- `gpr_track`: stable link token. Required for a tracking URL.
- `gpr_person`: known person or recipient slug. Use a stable, non-sensitive slug such as `max-quattromani`.
- `gpr_label`: optional human-readable label for the link purpose.
- `invite`: legacy token. If `gpr_track` is absent, `invite` also populates `trackingId`.

Recommended pairing with UTM fields:

```text
?invite=max-protest-guide-20260627&gpr_track=max-protest-guide-20260627&gpr_person=max-quattromani&gpr_label=max-internal-review&utm_source=max&utm_medium=tracked-link&utm_campaign=protest-guide-review
```

Specific Max review link:

```text
https://quattromani.github.io/Guided-Parcel-Review/articles/before-you-walk-into-a-property-protest/?invite=max-protest-guide-20260627&gpr_track=max-protest-guide-20260627&gpr_person=max-quattromani&gpr_label=max-internal-review&utm_source=max&utm_medium=tracked-link&utm_campaign=protest-guide-review
```

Do not put private facts, email addresses, phone numbers, parcel IDs, or sensitive audience labels in tracking URL parameters. Treat these values as spreadsheet-visible attribution labels, not secrets.

## Article Metrics

Use explicit milestone events for content completion. Do not treat `scroll_final` as completion.

- Viewed: at least one `article_view` for an `articleId` and `pageViewId`.
- Engaged view: viewed plus at least one of `scroll_25`, `article_interaction`, or 30 seconds of tracked elapsed time.
- Reached midpoint: `scroll_50`.
- Deep read: `scroll_75`.
- Completed read: `scroll_complete`.
- Final observed depth: `scroll_final`, useful for estimating exit depth but not a completion event.

## Media Metrics

Hero media events should form a small funnel:

- `tldr_video_visible`: video entered the viewport.
- `tldr_video_tap`: reader tapped the custom play control.
- `tldr_video_play`: browser actually began playback.
- `tldr_video_play_error`: playback request failed.
- `tldr_video_controls_fallback`: native controls were exposed after a failed play request.
- `tldr_video_25`, `tldr_video_50`, `tldr_video_75`: playback milestones.
- `tldr_video_complete`: ended event fired.

Use `mediaId`, `mediaType`, `mediaCurrentTime`, `mediaDuration`, `mediaPercent`, `mediaMuted`, `mediaPaused`, `mediaReadyState`, and `mediaNetworkState` to diagnose whether low watch counts reflect reader behavior or browser/media friction.

## Apps Script Rule

The visit analytics endpoint should append rows by header name. New fields may be added to the right side of the sheet, but existing headers should not be reordered. Existing v1 rows remain usable; reports should prefer v2 rows when comparing interaction and media-funnel behavior.
