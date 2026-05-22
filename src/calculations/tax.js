export function calculateEtr(row) {
  const taxes = finiteNumber(row?.taxes);
  const assessedValue = finiteNumber(row?.assessedValue);

  if (taxes === null || assessedValue === null || assessedValue <= 0) return null;
  return taxes / assessedValue;
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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

function latestFinalAssessedValue(data = {}) {
  const finalYear = data.latestFinalTaxYear ?? data.snapshotYear;
  const statement = data.taxStatements?.find(row =>
    row.taxYear === finalYear && finiteNumber(row.assessedValue) !== null
  );
  const history = data.taxpayerHistory?.find(row =>
    row.year === finalYear && finiteNumber(row.assessedValue) !== null
  );

  return finiteNumber(statement?.assessedValue)
    ?? finiteNumber(history?.assessedValue)
    ?? null;
}

function grossPropertyLevyAmount(rate, data = {}) {
  const assessedValue = latestFinalAssessedValue(data);
  const levyRate = finiteNumber(rate);

  if (assessedValue === null || levyRate === null) return null;
  return assessedValue * (levyRate / 100);
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
        statementDistributionAmount: amount
      };
    })
    .filter(row => row.authority && Number.isFinite(row.rate) && row.rate > 0);
  const totalRate = sumRates(rows);

  if (!totalRate) return [];

  return rows.map(row => ({
    ...row,
    amount: grossPropertyLevyAmount(row.rate, data),
    share: row.rate / totalRate
  }));
}

function fallbackDistributionRows(data = {}) {
  const rows = (data.latestFinalLevyComponents || [])
    .filter(row => Number.isFinite(Number(row.rate)) && Number(row.rate) > 0);
  const totalRate = sumRates(rows);

  if (!totalRate) return [];

  return rows.map(row => {
    const share = row.rate / totalRate;

    return {
      authority: row.description,
      description: row.description,
      group: row.group ?? "Other",
      rate: row.rate,
      amount: grossPropertyLevyAmount(row.rate, data),
      share
    };
  });
}

export function latestTaxDistributionRows(data = {}, recordCard = {}) {
  const sourceRows = sourceDistributionRows(data, recordCard);
  return sourceRows.length ? sourceRows : fallbackDistributionRows(data);
}
