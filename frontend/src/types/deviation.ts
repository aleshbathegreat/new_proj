export type DeviationType =
  | 'QTY_OVERRUN'
  | 'QTY_UNDERRUN'
  | 'METHOD_DEVIATION'
  | 'VENDOR_SUBSTITUTION'
  | 'ITEM_SUBSTITUTION'
  | 'UNAUTHORIZED_WORK';

export type DeviationStatus =
  'DRAFT' | 'SUBMITTED' | 'HOD_REVIEW' | 'DIR_REVIEW' | 'APPROVED' | 'REJECTED';

export type DeviationSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface Deviation {
  id: string;
  site_id: string;
  site_name: string;
  boq_item_code: string;
  type: DeviationType;
  severity: DeviationSeverity;
  status: DeviationStatus;
  description: string;
  planned_value: string;
  actual_value: string;
  submitted_by: string;
  created_at: string;
}
