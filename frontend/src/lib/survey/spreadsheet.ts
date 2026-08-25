import * as XLSX from 'xlsx';
import type { SurveyRowData } from '@/types/survey';

export function parseSurveySpreadsheet(file: ArrayBuffer): SurveyRowData[] {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
    raw: true,
  });
  if (rows.length < 2) return [];

  const headerRow = rows[0] ?? [];
  const headers = headerRow.map((h, idx) => String(h ?? '').trim() || `Column ${idx + 1}`);

  const items: SurveyRowData[] = [];
  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r] ?? [];
    const item: SurveyRowData = {};
    let hasData = false;

    headers.forEach((header, idx) => {
      const cell = row[idx];
      if (cell === '' || cell === null || cell === undefined) return;
      hasData = true;
      item[header] = cell;
    });

    if (hasData) items.push(item);
  }

  return items;
}