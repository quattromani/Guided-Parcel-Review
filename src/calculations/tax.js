export function calculateEtr(row) {
  if (!row?.taxes || !row?.assessedValue) return null;
  return row.taxes / row.assessedValue;
}

export function sumRates(rows = []) {
  return rows.reduce((sum, row) => sum + row.rate, 0);
}

export function groupLevy(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.group] = (acc[row.group] || 0) + row.rate;
    return acc;
  }, {});
}

function parseCurrency(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(`${value ?? ""}`.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRate(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundedKey(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(6) : "";
}

function latestFinalTaxAmount(data = {}) {
  const finalYear = data.latestFinalTaxYear;
  const finalRow = data.taxpayerHistory?.find(row =>
    row.year === finalYear && row.taxes !== null && row.taxes !== undefined
  );

  return finalRow?.taxes
    ?? data.snapshotModel?.viewModels?.taxes?.latestFinalTax
    ?? null;
}

function taxDistributionSourceSection(recordCard = {}) {
  return (recordCard.sourceExtract?.sections || [])
    .find(section => `${section.title || ""}`.toLowerCase().includes("tax distribution"));
}

function componentByRate(data = {}) {
  return new Map((data.latestFinalLevyComponents || [])
    .filter(row => Number.isFinite(Number(row.rate)))
    .map(row => [roundedKey(row.rate), row]));
}

function sourceDistributionRows(data = {}, recordCard = {}) {
  const section = taxDistributionSourceSection(recordCard);
  if (!section?.rows?.length) return [];

  const components = componentByRate(data);
  const rows = section.rows
    .map(row => {
      const rate = parseRate(row?.[1]);
      const amount = parseCurrency(row?.[2]);
      const component = components.get(roundedKey(rate));

      return {
        authority: row?.[0] ?? component?.description ?? "",
        description: component?.description ?? row?.[0] ?? "",
        group: component?.group ?? "Other",
        rate,
        amount
      };
    })
    .filter(row => row.authority && Number.isFinite(row.rate) && Number.isFinite(row.amount) && row.amount > 0);
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);

  if (!totalAmount) return [];

  return rows.map(row => ({
    ...row,
    share: row.amount / totalAmount
  }));
}

function fallbackDistributionRows(data = {}) {
  const rows = (data.latestFinalLevyComponents || [])
    .filter(row => Number.isFinite(Number(row.rate)) && Number(row.rate) > 0);
  const totalRate = sumRates(rows);
  const latestTaxesPaid = latestFinalTaxAmount(data);

  if (!totalRate) return [];

  return rows.map(row => {
    const share = row.rate / totalRate;

    return {
      authority: row.description,
      description: row.description,
      group: row.group ?? "Other",
      rate: row.rate,
      amount: Number.isFinite(Number(latestTaxesPaid)) ? share * latestTaxesPaid : null,
      share
    };
  });
}

export function latestTaxDistributionRows(data = {}, recordCard = {}) {
  const sourceRows = sourceDistributionRows(data, recordCard);
  return sourceRows.length ? sourceRows : fallbackDistributionRows(data);
}
