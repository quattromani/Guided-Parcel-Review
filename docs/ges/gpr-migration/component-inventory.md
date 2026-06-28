# GPR Component Inventory

Status: planning inventory  
Date: 2026-06-28

Statuses:

- KEEP
- MOVE TO ARTICLES
- MOVE TO KNOWLEDGE
- MOVE TO PUBLIC TOOL
- MOVE TO REPORTING ENGINE
- MOVE TO INTERNAL WORKSPACE
- RETIRE
- HUMAN REVIEW

Audience flags:

- Public: suitable for public taxpayer use.
- Internal: suitable for authenticated assessor or project owner use.
- Shared: may be used by more than one destination after refactoring.

## Application Shell And Navigation

| Name | Purpose | Current responsibility | Future responsibility | Public | Internal | Shared | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Main GPR shell | Hosts current guided parcel review | Owns public app chrome, guided panels, footer resources, modals | Native GES app shell for parcel workflow only | Yes | No | No | KEEP |
| Guided path tabs | Step navigation through record, value, market, equalization, taxes, signals, summary | Frames GPR as seven-step learning journey | Shorter task nav: parcel, record, value, tax, context, summary | Yes | No | No | KEEP |
| Route metadata | Labels, questions, descriptions, panel ids | Course-like route framing in `taxpayer-journey.js` and `site-copy.json` | Task labels and resource bindings | Yes | No | Yes | KEEP |
| Start page | Entry point for static sample parcels | Explains demo, coverage, search, BOE tracker, direct start | Parcel lookup and production source/freshness notice | Yes | No | No | HUMAN REVIEW |
| Direct-start cards | Quick entry into sample paths | Teaching and demo entry points | Replace with parcel lookup and recent/opened parcel states | Yes | No | No | HUMAN REVIEW |
| Project navigation utility | Max-only project links | Internal project launcher | Workspace/internal navigation seed | No | Yes | Yes | MOVE TO INTERNAL WORKSPACE |
| Field Kit utility belt | Owner-only testing tools | Parcel search, share, notes, inspector | Keep as internal utility, not public GPR | No | Yes | Yes | MOVE TO INTERNAL WORKSPACE |

## Parcel Selection And Identity

| Name | Purpose | Current responsibility | Future responsibility | Public | Internal | Shared | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Property switcher | Search and switch loaded sample parcel records | Client-side sample lookup by address/owner/id | Production parcel search/open control | Yes | Yes | Yes | KEEP |
| Property context bar | Keep parcel identity visible | Address, class, location, valuation group | Sticky workspace context and source freshness | Yes | Yes | Yes | KEEP |
| Header summary | Present selected parcel facts | Value breakdown, address, owner, image/sketch actions | Parcel snapshot header | Yes | Yes | Yes | KEEP |
| Property photo action | Open property image | Visual record confirmation | Keep for record verification and report attachments | Yes | Yes | Yes | KEEP |
| Sketch/image modal | Display images | Image preview and alt/source shell | Keep if media source rules are defined | Yes | Yes | Yes | KEEP |
| Source freshness/disclaimer | State prototype/static status | Mixed into start page and source notes | Dedicated data freshness indicator | Yes | Yes | Yes | HUMAN REVIEW |

## Property Record Review

| Name | Purpose | Current responsibility | Future responsibility | Public | Internal | Shared | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Property details worksheet | Let taxpayer verify facts | Renders parcel, dwelling, land, admin, notes, improvements | Core GPR record-checking workspace | Yes | Yes | Yes | KEEP |
| Record review sections | Organize fields by cognitive task | Confirm property, house, improvements, land, admin, notes | Keep with tighter field taxonomy | Yes | Yes | Yes | KEEP |
| Review flag controls | Mark fields for review | Checkbox and optional note persisted in localStorage | Durable issue list tied to parcel and report | Yes | Yes | Yes | KEEP |
| Review flag summary | Show selected issues | Final summary and intake form | Conversation issue register and report section | Yes | Yes | Yes | KEEP |
| Quality/condition definitions | Explain record-card terms | Inline tooltips/help around field meanings | Knowledge glossary with inline lookup | Yes | Yes | Yes | MOVE TO KNOWLEDGE |
| Record correction form | Capture factual correction request | Modal form with categories, contact, narrative | GPR trigger for Reporting Engine packet | Yes | Yes | Yes | MOVE TO REPORTING ENGINE |
| Correction category taxonomy | Classify requested record review | Presentation copy in `site-copy.json` | Shared correction/request schema | Yes | Yes | Yes | MOVE TO KNOWLEDGE |
| Mock review submission | Simulate issue submission | Logs payload and displays success | Replace with real delivery or PDF-only workflow | Yes | No | No | RETIRE |

## Value, Tax, And Parcel Movement

| Name | Purpose | Current responsibility | Future responsibility | Public | Internal | Shared | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Assessment notice summary | Show prior/current values | Land/building/improvement/total comparison | Keep as value movement core | Yes | Yes | Yes | KEEP |
| Property movement summary | Show recent value/tax/ETR movement | KPI cards and sparklines | Keep compact | Yes | Yes | Yes | KEEP |
| Value-tax history panel | Compare assessed value and taxes | Indexed chart and table | Keep chart; shorten explanation | Yes | Yes | Yes | KEEP |
| Tax history table | Show levy, gross, credits, net, ETR | Detailed tax history table | Keep as parcel-specific table | Yes | Yes | Yes | KEEP |
| Tax equation waterfall | Show latest statement math | Assessed value x levy = gross - credits = net | Keep compact; also public calculator seed | Yes | Yes | Yes | KEEP |
| Tax bill pattern chart | Explain tax bill movement | Net tax pattern and summary cards | Keep only if it supports parcel review | Yes | Yes | Yes | HUMAN REVIEW |
| Levy distribution table | Show taxing-body shares | Treemap/table of latest levy components | GPR summary plus public tool detail | Yes | Yes | Yes | MOVE TO PUBLIC TOOL |
| Tax district authorities | Summarize district authority data | District, levy year, count, largest authority, source | Knowledge-backed district summary | Yes | Yes | Yes | MOVE TO PUBLIC TOOL |

## Market, Equalization, And Context

| Name | Purpose | Current responsibility | Future responsibility | Public | Internal | Shared | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Market area panel | Compare selected parcel with local group | Sample value/tax trend and summary | Compact parcel context only | Yes | Yes | Yes | HUMAN REVIEW |
| Valuation group sample chart | Show parcel vs group movement | Chart.js trend using sampled properties | Internal diagnostic or carefully caveated public context | Yes | Yes | Yes | HUMAN REVIEW |
| Market summary cards | Summarize local trend data | Qualified sales/group metrics | Internal by default unless public-safe | No | Yes | Yes | MOVE TO INTERNAL WORKSPACE |
| Equalization intro | Teach county abstract and sales-study process | Broad instructional transition | Article content | Yes | No | No | MOVE TO ARTICLES |
| Equalization metric cards | Explain COD, PRD, COV, LOV | Public education and metric signals | Knowledge-backed explainer/tool | Yes | Yes | Yes | MOVE TO ARTICLES |
| Assessment accuracy chart | Visualize metric bands | Public visualization of statistical measures | Article-embedded tool or public explainer | Yes | Yes | Yes | MOVE TO PUBLIC TOOL |
| Class filter for ratio data | Switch residential/ag/commercial | Public metric exploration | Public tool or internal dashboard | Yes | Yes | Yes | MOVE TO PUBLIC TOOL |
| County comparison selector | Compare Gage to another county | Statewide CTL context | Public CTL explorer | Yes | No | Yes | MOVE TO PUBLIC TOOL |
| Statewide CTL charts | Explain county/state context | Countywide value, tax, rate trends | Public tool/article support | Yes | No | Yes | MOVE TO PUBLIC TOOL |
| County baseline summary | Teach broader county tax base | Civic context | Article or public tool | Yes | No | Yes | MOVE TO ARTICLES |

## Review Signals And Summary

| Name | Purpose | Current responsibility | Future responsibility | Public | Internal | Shared | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Review signal model | Generate neutral prompts | Missing fields, pending year, large value movement | Governed signal service or neutral GPR prompt layer | Yes | Yes | Yes | HUMAN REVIEW |
| Review Signals panel | Bring record/value/equalization/tax signals together | Final review teaching panel | Issue summary and taxpayer question builder | Yes | Yes | Yes | KEEP |
| Final Summary panel | Recap parcel and flags | Quick read, tax equation, report download | Conversation summary workspace | Yes | Yes | Yes | KEEP |
| Quick read summary | Summarize current value, market, taxes, county context | Parcel takeaway rows | Keep, with knowledge links | Yes | Yes | Yes | KEEP |
| Intake form | Gather contact and issue info | Mock submission from flagged details | Replace with correction packet/request workflow | Yes | No | No | HUMAN REVIEW |

## Reporting

| Name | Purpose | Current responsibility | Future responsibility | Public | Internal | Shared | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Guided Review Summary PDF | Download taxpayer-facing PDF | Four-page course/report hybrid | Reporting Engine conversation summary | Yes | Yes | Yes | MOVE TO REPORTING ENGINE |
| Property report model | Collect report data | Builds identity, values, market, equalization, taxes, signals | Shared report schema | Yes | Yes | Yes | MOVE TO REPORTING ENGINE |
| PDF report kit | Shared drawing helpers | Browser-side pdf-lib wrappers and primitives | Reporting Engine rendering utilities | Yes | Yes | Yes | MOVE TO REPORTING ENGINE |
| Record correction PDF | Formal correction packet | Generates request packet from modal | Reporting Engine packet type | Yes | Yes | Yes | MOVE TO REPORTING ENGINE |
| Supplemental assessor report | Professional review PDF | Cost, equalization, tax, signals, conclusion | Internal Workspace plus Reporting Engine | No | Yes | Yes | MOVE TO INTERNAL WORKSPACE |

## Sources, Modals, And Reference

| Name | Purpose | Current responsibility | Future responsibility | Public | Internal | Shared | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Footer resources | Provide FAQs/forms/policies by view | Route-specific resource blocks | Resources Block backed by Articles/Knowledge | Yes | No | Yes | MOVE TO KNOWLEDGE |
| Important dates modal | Show calendar context | Assessment dates and deadlines | Knowledge calendar objects | Yes | Yes | Yes | MOVE TO KNOWLEDGE |
| Source table modal | Expand raw source tables | Source/provenance inspection | Internal source/provenance workspace | No | Yes | Yes | MOVE TO INTERNAL WORKSPACE |
| Source notes | Explain data origin | Scattered strings in render/chart/report modules | Source object references | Yes | Yes | Yes | MOVE TO KNOWLEDGE |
| Legal reference HTML | Link statute anchors | Inline authority context | Knowledge Platform statute references | Yes | Yes | Yes | MOVE TO KNOWLEDGE |

## Experiments And Prototype Routes

| Name | Purpose | Current responsibility | Future responsibility | Public | Internal | Shared | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tax shorthand experiment | Explore long tax history and tax shorthand UI | Prototype tax explanation surface | Public tax calculator/tool if generalized | Yes | Yes | Yes | MOVE TO PUBLIC TOOL |
| Comparison experiment | Teach comparable/equalization review | Prototype comparison walkthrough | Internal comparable review or article support | No | Yes | Yes | MOVE TO INTERNAL WORKSPACE |
| Comparable candidate review | Rank comparable candidates | Experimental scoring and review aids | Internal assessor diagnostic | No | Yes | Yes | MOVE TO INTERNAL WORKSPACE |
| Assessor report trigger | Generate supplemental review report | Internal/prototype report action | Internal Workspace report launch | No | Yes | Yes | MOVE TO INTERNAL WORKSPACE |

