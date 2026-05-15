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
