# Privileged Documents Library

## Purpose

Guided Parcel Review can provide a familiar reading surface for intentionally approved document renderings. It is not the authoritative source for Gage County Assessor Office institutional documents.

The private **Gage County Assessor Office Knowledge System** repository remains the authoritative source for private Markdown, research, planning, governance, methods, operational materials, and future structured document inputs.

## Current Security Finding

Guided Parcel Review is a static application. The existing `gpr_person=max-quattromani` value controls browser-side tool visibility only; it is not server-side authentication or authorization.

Therefore, the current Documents routes are safe scaffolds only. They contain no private document source, rendered private artifact, source commit, private repository URL, credentials, access token, or browser fetch from the Knowledge System repository.

The Documents control appears only in the existing owner Field Kit, and the existing internal-link propagation preserves the current query context. This is a usability convention, not a security boundary.

## Registration Location

Safe document registrations live in `src/content/documents.js`. This is a content collection distinct from `data/app/articles.json` and must remain distinct from the public article system.

The first registration is the **First 100 Days Operational Transition Plan**. Its Working Draft source remains private in the Knowledge System; the Guided Parcel Review registration proves the route, metadata, index, document shell, print-compatible reading layout, and permission propagation without placing plan content in the public static build.

## Adding an Approved Document

Do not add a private Markdown file, PDF, JSON export, source commit, source path, private URL, repository credential, or document text to Guided Parcel Review.

Before a real document can appear, provide an authenticated delivery architecture, such as a private deployment, an authorized server-side document API, an access-controlled storage layer, or a private local/network viewer. The approved release must retain a traceable source document identifier, source version or commit, rendered version, publication status, and release date in the private Knowledge System.

After that boundary exists, add only the approved, audience-appropriate rendered artifact or structured export to the authenticated delivery path. Update the safe registration record with the public-safe metadata required to locate that artifact. Keep the source document private.

## Rendering

`src/routes/documents.js` uses the existing GES shell, article masthead, metadata treatment, resource-list styling, responsive layout, theme, and print system. No document-specific design system or parallel stylesheet was added.

Static entry points are:

- `/documents/`
- `/documents/operational-transition-plan/`

Both use `noindex, nofollow, noarchive`. Those directives are not access control; they simply avoid presenting the safe scaffold as a public content destination.

## What Must Never Be Committed Here

- Private Knowledge System Markdown or its complete export.
- Internal PDF, DOCX, HTML, JSON, or other rendered document artifacts.
- Private repository URLs, clone URLs, source commits, access keys, OAuth tokens, GitHub tokens, or credentials.
- Browser logic that fetches private GitHub content.
- Taxpayer-specific, personnel, legal, security-sensitive, or other restricted office information unless a separate approved security model explicitly permits it.

## Next Required Step

Choose and implement an authenticated private document-delivery boundary before delivering any real internal document through this viewer. Until then, retain actual documents in the private Knowledge System repository and use the Documents routes only for safe navigation and integration testing.
