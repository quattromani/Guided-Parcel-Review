import { formatNullableLevy } from "../format.js";
import { propertyRecordSourceText } from "../domain/source-labels.js";
import { escapeHtml } from "../utils/html.js";

export function renderTaxDistrictAuthorities(data, taxDistrictAuthorities) {
  const summary = document.getElementById("taxDistrictAuthoritySummary");
  if (!summary) return;

  const district = taxDistrictAuthorities?.districts?.find(item =>
    String(item.taxDistrict) === String(data.parcel.taxDistrict)
  );
  const authorities = district?.authorities ?? data.latestFinalLevyComponents.map(row => ({
    description: row.description,
    category: row.group,
    levy: row.rate
  }));
  const total = authorities.reduce((sum, row) => sum + row.levy, 0);
  const districtDescription = district?.districtDescription ?? null;
  const districtDescriptionNote = districtDescription
    ? `Report label: ${districtDescription}`
    : "No district description found in the authority report.";

  summary.innerHTML = [
    {
      label: "Tax district",
      value: data.parcel.taxDistrict,
      note: districtDescriptionNote
    },
    {
      label: "Authorities",
      value: authorities.length,
      note: district ? "Matched to this parcel's tax district." : "Using the most recent finalized tax breakdown."
    },
    {
      label: "Total levy",
      value: formatNullableLevy(district?.districtLevy ?? total),
      note: "Combined rate for the listed taxing bodies."
    },
    {
      label: "Source year",
      value: taxDistrictAuthorities?.source?.taxYear ?? data.latestFinalTaxYear,
      note: "District Authority Report."
    }
  ].map(card => `
    <div class="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(card.label)}</p>
      <p class="mt-1 text-lg font-bold text-slate-700">${escapeHtml(card.value)}</p>
      <p class="mt-1 text-xs leading-5 text-slate-500">${escapeHtml(card.note)}</p>
    </div>
  `).join("");

  const source = document.getElementById("taxDistrictAuthoritySource");
  if (source) {
    const authoritySource = taxDistrictAuthorities?.source
      ? `${taxDistrictAuthorities.source.title}, printed ${new Date(taxDistrictAuthorities.source.printedAt).toLocaleDateString("en-US")}`
      : propertyRecordSourceText(data).replace(/^Source:\s*/i, "");
    const levySource = `${data.latestFinalTaxYear ?? "Latest finalized"} finalized tax statement and levy breakdown for this property's tax district`;
    source.textContent = `Sources: ${authoritySource}; ${levySource}.`;
  }
}
