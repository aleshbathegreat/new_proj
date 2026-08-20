export type BOQFieldDataType = 'text' | 'number' | 'decimal' | 'date' | 'boolean' | 'select';

/** One heading/field definition inside a template's `fields` JSON list. */
export interface BOQTemplateField {
  key: string;
  label: string;
  data_type: BOQFieldDataType;
  unit?: string;
  required?: boolean;
  default?: string | number | boolean | null;
  /** Only used when data_type === 'select'. */
  options?: string[];
  sort_order?: number;
}

export type BOQTemplateSource = 'MANUAL' | 'IMPORT';

/** Read model — mirrors `BOQTemplateSerializer`. */
export interface BOQTemplate {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  source: BOQTemplateSource;
  fields: BOQTemplateField[];
  field_count: number;
  created_at: string;
  updated_at: string;
}

/** Writable fields — mirrors `BOQTemplateWriteSerializer`. */
export interface BOQTemplateWrite {
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
  source?: BOQTemplateSource;
  fields: BOQTemplateField[];
}