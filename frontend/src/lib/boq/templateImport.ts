import * as XLSX from 'xlsx';
import type { BOQTemplateField } from '@/types/boqTemplate';

/**
 * Sniff the data type of a column by sampling values.
 * Returns 'number', 'date', or 'text' based on what looks most likely.
 */
function sniffDataType(values: (string | number | boolean | null | undefined)[]): 'text' | 'number' | 'decimal' | 'date' {
  const nonEmpty = values.filter((v) => v != null && v !== '');

  if (nonEmpty.length === 0) return 'text';

  // Check if they look like dates (ISO format or common patterns)
  const datePattern = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
  if (nonEmpty.every((v) => datePattern.test(String(v)))) {
    return 'date';
  }

  // Check if they're all numbers (including decimals)
  const numeric = nonEmpty.filter((v) => !isNaN(Number(v)));
  if (numeric.length === nonEmpty.length) {
    // Check if any have decimals
    const hasDecimal = nonEmpty.some((v) => String(v).includes('.'));
    return hasDecimal ? 'decimal' : 'number';
  }

  return 'text';
}

/**
 * Parse an Excel file buffer and extract template fields from the header row.
 * Returns a list of field definitions ready to be reviewed/edited before saving.
 *
 * @param buffer - ArrayBuffer from file input
 * @param headerRowIndex - Which row contains headers (default 0)
 * @param dataRowStart - First row of data to sample for type inference (default 1)
 * @param dataRowEnd - Last row to sample (default 10)
 */
export function parseTemplateHeaders(
  buffer: ArrayBuffer,
  headerRowIndex: number = 0,
  dataRowStart: number = 1,
  dataRowEnd: number = 10
): BOQTemplateField[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('No sheets found in workbook');

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as (string | number)[][];

    if (data.length === 0) throw new Error('No data in sheet');

    const headers = (data[headerRowIndex] || []) as string[];
    if (headers.length === 0) throw new Error('No headers found in row ' + (headerRowIndex + 1));

    // Collect sample data for type inference
    const sampleRows = data.slice(dataRowStart, Math.min(dataRowEnd + 1, data.length));

    const fields: BOQTemplateField[] = headers
      .map((header, colIndex) => {
        const headerLabel = String(header).trim();
        if (!headerLabel) return null; // Skip empty headers

        // Collect values from this column in the sample rows
        const columnValues = sampleRows.map((row) => row?.[colIndex] ?? null);

        // Convert header to key: lowercase, replace spaces with underscores, remove special chars
        const key = headerLabel
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');

        const dataType = sniffDataType(columnValues);

        return {
          key,
          label: headerLabel,
          data_type: dataType,
          unit: '',
          required: false,
          default: null,
          sort_order: colIndex,
        };
      })
      .filter((f) => f !== null) as BOQTemplateField[];

    return fields;
  } catch (err) {
    throw new Error(`Failed to parse Excel: ${err instanceof Error ? err.message : String(err)}`);
  }
}