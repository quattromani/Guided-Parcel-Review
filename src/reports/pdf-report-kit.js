const PDF_LIB_PATH = "assets/vendor/pdf-lib.min.js";

let pdfLibPromise;

export const REPORT_PAGE = {
  landscapeLetter: [792, 612],
  margin: 32
};

export function loadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);

  pdfLibPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PDF_LIB_PATH;
    script.async = true;
    script.onload = () => {
      if (window.PDFLib) {
        resolve(window.PDFLib);
        return;
      }

      reject(new Error("PDF generation library loaded but did not expose PDFLib."));
    };
    script.onerror = () => reject(new Error("PDF generation library could not be loaded."));
    document.head.append(script);
  });

  return pdfLibPromise;
}

export async function createReportContext({ title = "Property Report" } = {}) {
  const pdfLib = await loadPdfLib();
  const { PDFDocument, StandardFonts, rgb } = pdfLib;
  const doc = await PDFDocument.create();
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold)
  };
  const palette = {
    ink: rgb(0.10, 0.16, 0.25),
    muted: rgb(0.36, 0.43, 0.54),
    faint: rgb(0.58, 0.64, 0.72),
    line: rgb(0.82, 0.86, 0.91),
    panel: rgb(0.97, 0.98, 0.99),
    panelAlt: rgb(0.94, 0.96, 0.98),
    navy: rgb(0.00, 0.18, 0.38),
    green: rgb(0.35, 0.53, 0.42),
    amber: rgb(0.66, 0.47, 0.17),
    red: rgb(0.61, 0.24, 0.24),
    white: rgb(1, 1, 1)
  };

  doc.setTitle(title);
  return { doc, pdfLib, fonts, palette };
}

export function addReportPage(ctx, options = {}) {
  const [width, height] = options.size ?? REPORT_PAGE.landscapeLetter;
  const margin = options.margin ?? REPORT_PAGE.margin;
  const page = ctx.doc.addPage([width, height]);

  return {
    ...ctx,
    page,
    width,
    height,
    margin,
    contentWidth: width - margin * 2,
    contentHeight: height - margin * 2
  };
}

export function drawText(ctx, text, x, y, options = {}) {
  ctx.page.drawText(String(text ?? ""), {
    x,
    y,
    size: options.size ?? 9,
    font: options.bold ? ctx.fonts.bold : ctx.fonts.regular,
    color: options.color ?? ctx.palette.ink
  });
}

export function textLines(ctx, content, maxWidth, options = {}) {
  const size = options.size ?? 9;
  const font = options.bold ? ctx.fonts.bold : ctx.fonts.regular;
  const output = [];
  String(content ?? "")
    .split("\n")
    .forEach(sourceLine => {
      const words = sourceLine.split(/\s+/).filter(Boolean);
      let line = "";
      words.forEach(word => {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) <= maxWidth) {
          line = next;
          return;
        }
        if (line) output.push(line);
        line = word;
      });
      if (line) output.push(line);
    });

  return output.length ? output : [""];
}

export function drawWrappedText(ctx, text, x, y, maxWidth, options = {}) {
  const size = options.size ?? 9;
  const lineHeight = options.lineHeight ?? size + 3;
  const maxLines = options.maxLines ?? Infinity;
  const lines = textLines(ctx, text, maxWidth, options).slice(0, maxLines);
  lines.forEach((line, index) => drawText(ctx, line, x, y - index * lineHeight, options));

  return y - lines.length * lineHeight;
}

export function drawRule(ctx, x1, y, x2, options = {}) {
  ctx.page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness: options.thickness ?? 0.75,
    color: options.color ?? ctx.palette.line
  });
}

export function drawVerticalRule(ctx, x, y1, y2, options = {}) {
  ctx.page.drawLine({
    start: { x, y: y1 },
    end: { x, y: y2 },
    thickness: options.thickness ?? 0.75,
    color: options.color ?? ctx.palette.line
  });
}

export function drawPanel(ctx, x, y, width, height, options = {}) {
  ctx.page.drawRectangle({
    x,
    y,
    width,
    height,
    color: options.fill ?? ctx.palette.white,
    borderColor: options.border ?? ctx.palette.line,
    borderWidth: options.borderWidth ?? 0.75
  });
}

export function drawSectionTitle(ctx, title, x, y, width, options = {}) {
  drawText(ctx, title, x, y, {
    size: options.size ?? 10,
    bold: true,
    color: options.color ?? ctx.palette.navy
  });
  drawRule(ctx, x, y - 6, x + width, { color: options.ruleColor ?? ctx.palette.line });
}

export function drawKeyValueRows(ctx, rows, x, y, width, options = {}) {
  const labelWidth = options.labelWidth ?? Math.min(112, width * 0.34);
  const rowGap = options.rowGap ?? 14;
  const labelSize = options.labelSize ?? 7.2;
  const valueSize = options.valueSize ?? 8.4;
  const valueLineHeight = options.valueLineHeight ?? 10;
  const valueMaxLines = options.valueLines ?? 2;
  let cursor = y;

  rows.filter(row => row?.[1] !== null && row?.[1] !== undefined && row?.[1] !== "").forEach(([label, value]) => {
    const lines = textLines(ctx, value, width - labelWidth, {
      size: valueSize,
      bold: options.valueBold
    }).slice(0, valueMaxLines);

    drawText(ctx, label, x, cursor, { size: labelSize, bold: true, color: ctx.palette.muted });
    lines.forEach((line, index) => drawText(ctx, line, x + labelWidth, cursor - index * valueLineHeight, {
      size: valueSize,
      bold: options.valueBold,
      color: options.valueColor ?? ctx.palette.ink
    }));
    cursor -= Math.max(rowGap, lines.length * valueLineHeight + 4);
  });

  return cursor;
}

export function drawTable(ctx, columns, rows, x, y, width, options = {}) {
  const headerHeight = options.headerHeight ?? 16;
  const rowHeight = options.rowHeight ?? 15;
  const fontSize = options.fontSize ?? 7.6;
  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0);
  let currentX = x;

  ctx.page.drawRectangle({
    x,
    y: y - headerHeight + 3,
    width,
    height: headerHeight,
    color: options.headerFill ?? ctx.palette.panelAlt
  });

  columns.forEach(column => {
    const colWidth = width * (column.width / totalWidth);
    drawText(ctx, column.label, currentX + 5, y - 7, {
      size: 7,
      bold: true,
      color: ctx.palette.muted
    });
    currentX += colWidth;
  });

  let cursor = y - headerHeight;
  rows.forEach((row, rowIndex) => {
    currentX = x;
    if (rowIndex % 2 === 1) {
      ctx.page.drawRectangle({ x, y: cursor - rowHeight + 3, width, height: rowHeight, color: ctx.palette.panel });
    }
    columns.forEach(column => {
      const colWidth = width * (column.width / totalWidth);
      const value = row[column.key] ?? "";
      const textX = column.align === "right" ? currentX + colWidth - 5 - ctx.fonts.regular.widthOfTextAtSize(String(value), fontSize) : currentX + 5;
      drawText(ctx, value, Math.max(currentX + 5, textX), cursor - 8, { size: fontSize, color: ctx.palette.ink });
      currentX += colWidth;
    });
    drawRule(ctx, x, cursor - rowHeight + 3, x + width, { thickness: 0.35, color: ctx.palette.line });
    cursor -= rowHeight;
  });

  return cursor;
}

export function drawLineChart(ctx, points, x, y, width, height, options = {}) {
  const values = points.map(point => point.value).filter(value => Number.isFinite(value));
  if (values.length < 2) return;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const plotX = x + 8;
  const plotY = y + 14;
  const plotWidth = width - 16;
  const plotHeight = height - 28;

  drawPanel(ctx, x, y, width, height, { fill: ctx.palette.white, border: ctx.palette.line });
  drawRule(ctx, plotX, plotY, plotX + plotWidth, { thickness: 0.5, color: ctx.palette.line });
  drawRule(ctx, plotX, plotY + plotHeight, plotX + plotWidth, { thickness: 0.35, color: ctx.palette.line });

  const coords = points.map((point, index) => ({
    x: plotX + (points.length === 1 ? 0 : (index / (points.length - 1)) * plotWidth),
    y: plotY + ((point.value - min) / range) * plotHeight,
    label: point.label
  }));

  coords.forEach((point, index) => {
    const next = coords[index + 1];
    if (next) {
      ctx.page.drawLine({
        start: { x: point.x, y: point.y },
        end: { x: next.x, y: next.y },
        thickness: 1.6,
        color: options.color ?? ctx.palette.navy
      });
    }
    ctx.page.drawCircle({
      x: point.x,
      y: point.y,
      size: 2.4,
      color: options.color ?? ctx.palette.navy
    });
  });

  drawText(ctx, points[0]?.label ?? "", plotX, y + 4, { size: 6.5, color: ctx.palette.muted });
  drawText(ctx, points.at(-1)?.label ?? "", plotX + plotWidth - 24, y + 4, { size: 6.5, color: ctx.palette.muted });
  drawText(ctx, options.valueLabel ?? "", plotX, y + height - 11, { size: 7, bold: true, color: ctx.palette.muted });
}

export function downloadPdfBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
