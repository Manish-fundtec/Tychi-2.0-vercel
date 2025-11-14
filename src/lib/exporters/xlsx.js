'use client';

import * as XLSX from 'xlsx';

export function buildAoaFromHeaders(headers, rows, formatValue) {
  const headerRow = headers.map(({ label }) => label);
  const dataRows = rows.map((row) =>
    headers.map(({ key, value }) => {
      let raw;
      if (typeof value === 'function') {
        raw = value(row);
      } else if (typeof key === 'function') {
        raw = key(row);
      } else {
        const field = value ?? key;
        raw = field ? row[field] : '';
      }

      return formatValue ? formatValue(value ?? key, raw, row) : raw ?? '';
    }),
  );
  return [headerRow, ...dataRows];
}

export function exportAoaToXlsx({ fileName, sheetName = 'Sheet1', aoa }) {
  if (!Array.isArray(aoa) || aoa.length === 0) {
    alert('No data to export.');
    return;
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

