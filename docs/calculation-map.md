# Calculation Map

This map is the bridge between raw records, derived values, and UI displays. It should stay boring and traceable.

## Shared Helpers

| Module | Responsibility |
| --- | --- |
| `src/calculations/history.js` | Latest/previous known rows, nullable value checks, percent change. |
| `src/calculations/tax.js` | Effective tax rate, levy totals, grouped levy totals. |
| `src/metric-signals.js` | Ratio-study signal language from standards and metric values. |
| `src/domain/property-snapshot.js` | Current snapshot model and route view-model assembly. |
| `src/snapshot-model.js` | Compatibility re-export for older imports. |

## Assessment Values

| Derived Value | Formula / Source |
| --- | --- |
| Latest known assessed value | Latest `taxpayerHistory` row where `assessedValue` is present. |
| Previous known assessed value | Latest earlier row before latest known value. |
| Value percent change | `(current - previous) / previous`. |
| Notice land/improvement split | Prefer `assessedValueBreakdown` for snapshot year; fall back to `recordCard.currentCardValue`. |

## Tax Values

| Derived Value | Formula / Source |
| --- | --- |
| Effective tax rate | `taxes / assessedValue`. |
| Latest final tax | Latest `taxpayerHistory` row where `taxes` is present. |
| Levy total | Sum of `latestFinalLevyComponents[].rate`. |
| Total credits | Sum of statement credit amounts, preserving source sign convention. |
| Gross levy rate | Stored in demo statement `derived`; target should compute as `grossTaxAmount / assessedValue`. |
| Net effective tax rate | Stored in demo statement `derived`; target should compute as `netAmountDue / assessedValue`. |

## Market / Equalization Signals

| Metric | Interpretation Source |
| --- | --- |
| Qualified sales | `iaao-standards.json.sampleSizeGuidance`. |
| Median ratio / level of value | Class-aware Nebraska assessment ranges. |
| COD | IAAO COD standard matched by property and market context. |
| PRD | IAAO acceptable PRD range. |

## Source Discipline

Raw fields should never be silently overwritten by derived values. If a final assessed value differs from a source-card value, store or compute a reconciliation object with:

- raw source value,
- final/reconciled value,
- adjustment amount,
- source of adjustment,
- note explaining why the bridge exists.
