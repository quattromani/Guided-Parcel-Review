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
- `fbclidPresent`: whether the inbound URL carried a Facebook click ID.
- `browserContext`: `browser`, `facebook-in-app`, `facebook-referral`, `instagram-in-app`, or `social-in-app`.
- `isFacebookInApp`: boolean for quick filtering of Facebook in-app browser behavior.

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
