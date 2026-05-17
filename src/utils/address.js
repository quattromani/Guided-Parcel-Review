function displayAddressToken(part, index) {
  const ordinal = part.match(/^(\d+)(ST|ND|RD|TH)$/i);
  if (ordinal) return `${ordinal[1].replace(/^0+(?=\d)/, "")}${ordinal[2].toLowerCase()}`;
  if (index === 0 && /^\d+$/.test(part)) return part.replace(/^0+(?=\d)/, "");
  if (part.length <= 2) return part.toUpperCase();
  return `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`;
}

export function displayAddress(value) {
  return `${value ?? ""}`
    .split(/\s+/)
    .filter(Boolean)
    .map(displayAddressToken)
    .join(" ");
}

export function displayMailingAddress(value) {
  return displayMailingAddressLines(value).join(", ");
}

export function displayMailingAddressLines(value) {
  return `${value ?? ""}`
    .split(",")
    .map(part => displayAddress(part.trim()))
    .filter(Boolean)
    .reduce((lines, part, index) => {
      if (index === 0) return [part];
      return [lines[0], [...lines.slice(1), part].filter(Boolean).join(", ")];
    }, []);
}
