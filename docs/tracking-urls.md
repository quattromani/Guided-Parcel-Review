# Tracking URLs

Guided Parcel Review supports repeatable, first-party tracking URLs through query parameters. The site does not need cookies or fingerprinting to attribute a visit to a known shared link.

## Parameters

- `gpr_track`: stable token for the specific link. Required.
- `gpr_person`: known person or recipient slug, such as `max-quattromani`.
- `gpr_label`: optional readable label for why the link exists.
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`: standard campaign fields.

Legacy `invite` links still work. If `gpr_track` is missing, `invite` is also recorded as `trackingId`.

## Max Home Link

Use this for the Home Screen shortcut:

```text
https://quattromani.github.io/Guided-Parcel-Review/home/?invite=max-home-screen-20260627&gpr_track=max-home-screen-20260627&gpr_person=max-quattromani&gpr_label=max-home-screen&utm_source=max&utm_medium=home-screen&utm_campaign=project-home
```

## Max Review Link

```text
https://quattromani.github.io/Guided-Parcel-Review/articles/before-you-walk-into-a-property-protest/?invite=max-protest-guide-20260627&gpr_track=max-protest-guide-20260627&gpr_person=max-quattromani&gpr_label=max-internal-review&utm_source=max&utm_medium=tracked-link&utm_campaign=protest-guide-review
```

## Pattern

```text
https://quattromani.github.io/Guided-Parcel-Review/{path}/?invite={link-token}&gpr_track={link-token}&gpr_person={person-slug}&gpr_label={label}&utm_source={source}&utm_medium=tracked-link&utm_campaign={campaign}
```

Keep tokens stable once shared. Create a new `gpr_track` value for a new recipient, distribution channel, campaign, or test.

## Analytics Fields

Every visit event includes:

- `trackingId`
- `trackingPerson`
- `trackingLabel`
- the existing UTM fields
- `path`, including the original query string

These fields are appended to the Google Sheet by `apps-script/visit-analytics/Code.gs`.

## Project Navigation

The shared project header is available on every body-bearing project page. It uses the house mark as a button and propagates the current context across internal project-page links, including `property`, `view`, `gpr_track`, `gpr_person`, `gpr_label`, UTM fields, and legacy `invite` when present.

Menu and tool access are separate. The project navigation is public; the Field Kit utility belt remains owner-only and limited to `gpr_person=max-quattromani`.

## Privacy Rule

Do not put private facts, email addresses, phone numbers, parcel IDs, or sensitive labels in the URL. Use human-readable but non-sensitive slugs. These values are visible in the browser address bar, server logs, shared screenshots, and the analytics spreadsheet.
