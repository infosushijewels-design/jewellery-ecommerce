/**
 * Browser-side CSV export used by the admin tables.
 *
 * Builds the file from plain rows and downloads it through a Blob — no server round trip.
 *  - Excel-friendly: UTF-8 byte-order mark (so ₹ and names in other scripts open correctly) and CRLF line ends.
 *  - Safe to open in a spreadsheet: a cell that starts with = + - @ (or a tab / return) would be run as a formula,
 *    so it is prefixed with an apostrophe and stays plain text.
 */
export type CsvCell = string | number | boolean | null | undefined;

export function csvEscape(value: CsvCell): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text) && !(typeof value === 'number' && Number.isFinite(value))) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: CsvCell[][]): string {
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

export function downloadCsv(filenamePrefix: string, header: string[], rows: CsvCell[][]): void {
  const blob = new Blob(['﻿' + toCsv(header, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
