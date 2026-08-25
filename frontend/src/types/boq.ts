export type BOQStatus = 'DRAFT' | 'UPLOADING' | 'PARSING' | 'READY' | 'PUBLISHED';

/**
 * Writable BOQ line fields — mirrors `BOQItemWriteSerializer`.
 * Derived Excel columns are computed on the backend and omitted here.
 */
export interface BOQItemWrite {
  pc1: string;
  no: number;
  item_type: string;
  item: string;
  item_description: string;
  model_name: string;
  model: string;
  oem: string;
  unit: string;
  package_qty: number;
  qty: number;
  actual_quantity: number;
  fob: number | null;
  hs_code_description: string;
  hs_code: string;
  curr: string;
  tax: string;
  curr_rate: number | null;
  bank_charges_pct: number | null;
  freight_pct: number | null;
  landing_pct: number | null;
  insurance_pct: number | null;
  cd_pct: number | null;
  acd_pct: number | null;
  rd_pct: number | null;
  st_pct: number | null;
  ast_pct: number | null;
  it_pct: number | null;
  cess_pct: number | null;
  bank_charges: number | null;
  freight_insurance: number | null;
  price_with_fi: number | null;
  landing: number | null;
  insurance: number | null;
  custom_duty: number | null;
  addl_custom_duty: number | null;
  regulatory_duty: number | null;
  sales_tax: number | null;
  addl_sales_tax: number | null;
  income_tax: number | null;
  cess_tax: number | null;
  ddp_unit_usd: number | null;
  ddp_unit_pkr: number | null;
  quantity_tolerance_pct: number;
}

/**
 * Read model — mirrors `BOQItemSerializer` (includes derived + legacy aliases).
 * Decimals may arrive as strings from DRF. Derived fields can be `null`
 * when a required input field was never present in this BOQ's source sheet.
 */
export interface BOQItem extends BOQItemWrite {
  id: string;
  boq_id: string;
  site_id: string | null;
  site_name: string | null;
  project_id: string;
  project_name: string;
  district_id: string | null;
  district_name: string | null;
  province_id: string | null;
  province_name: string | null;
  fob_total: number | string | null;
  price_with_landing: number | string | null;
  price_with_insurance: number | string | null;
  total_ddp_usd: number | string | null;
  total_ddp_pkr: number | string | null;
  item_code: string;
  description: string;
  planned_quantity: number | string;
  amount: number | string | null;
  created_at: string;
  updated_at: string;
}

/** Mirrors `BOQSerializer`. */
export interface BOQ {
  id: string;
  project_id: string;
  project_name: string;
  site_id: string | null;
  site_name: string | null;
  version: number;
  status: BOQStatus;
  template_id: string | null;
  template_name: string | null;
  total_amount: number | string;
  items_count: number;
  created_at: string;
  updated_at: string;
}

/** Mirrors `BOQWriteSerializer`. */
export interface BOQWrite {
  project_id: string;
  version?: number;
}