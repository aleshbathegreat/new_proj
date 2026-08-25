export type SurveyStatus = 'DRAFT' | 'READY';

/** Every column from the source spreadsheet, keyed by its original header text. */
export type SurveyRowData = Record<string, string | number>;

export interface SurveyItemWrite {
  row_number: number;
  data: SurveyRowData;
}

export interface SurveyItem extends SurveyItemWrite {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Survey {
  id: string;
  project_id: string;
  project_name: string;
  version: number;
  status: SurveyStatus;
  items_count: number;
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyWrite {
  project_id: string;
  version?: number;
}