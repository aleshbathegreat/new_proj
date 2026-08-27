export type KpiValueType = 'number' | 'string' | 'boolean';

export interface ProgressKpiField {
  key: string;
  label: string;
  value_type: KpiValueType;
}

export interface ProgressTaskTemplate {
  id: string;
  key: string;
  name: string;
  category: string;
  unit: string;
  description: string;
  kpi_schema: ProgressKpiField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProgressTaskTemplateWrite = Omit<ProgressTaskTemplate, 'id' | 'created_at' | 'updated_at'>;

export interface SiteProgressTask {
  id: string;
  project_id: string;
  project_name: string;
  district_id: string;
  district_name: string;
  site_id: string | null;
  site_name: string | null;
  template_id: string | null;
  kpi_category_id: string | null;
  kpi_category_name: string | null;
  boq_id: string | null;
  boq_item_id: string | null;
  boq_item_code: string | null;
  boq_item_description: string | null;
  boq_planned_qty: number | string | null;
  key: string;
  name: string;
  category: string;
  unit: string;
  planned_quantity: number | string;
  sort_order: number;
  is_active: boolean;
  kpi_schema: ProgressKpiField[];
  attributes: Record<string, unknown>;
  cumulative_quantity: number | string;
  created_at: string;
  updated_at: string;
}

export type SiteProgressTaskWrite = {
  project_id: string;
  district_id: string;
  site_id: string | null;
  template_id?: string | null;
  kpi_category_id?: string | null;
  boq_id?: string | null;
  boq_item_id?: string | null;
  key: string;
  name: string;
  category?: string;
  unit?: string;
  planned_quantity?: number;
  sort_order?: number;
  is_active?: boolean;
  kpi_schema?: ProgressKpiField[];
  attributes?: Record<string, unknown>;
};

export interface DailyProgressEntry {
  id: string;
  site_id: string | null;
  site_name: string | null;
  project_id: string;
  project_name: string;
  district_id: string;
  district_name: string;
  site_task_id: string;
  task_key: string;
  task_name: string;
  task_unit: string;
  planned_quantity: number | string;
  boq_id: string | null;
  boq_item_id: string | null;
  boq_item_code: string | null;
  date: string;
  quantity: number | string;
  kpi_values: Record<string, unknown>;
  remarks: string;
  submitted_by_id: string;
  submitted_by_name: string;
  cumulative_quantity: number | string;
  created_at: string;
  updated_at: string;
}

export type DailyProgressWrite = {
  site_task_id: string;
  date: string;
  quantity: number;
  kpi_values?: Record<string, unknown>;
  remarks?: string;
};

export interface KPICategory {
  id: string;
  project_id: string;
  project_name: string;
  district_id: string;
  district_name: string;
  site_id: string | null;
  site_name: string | null;
  name: string;
  description: string;
  sort_order: number;
  subtask_count: number;
  created_at: string;
  updated_at: string;
}

export type KPICategoryWrite = {
  project_id: string;
  district_id: string;
  site_id: string | null;
  name: string;
  description?: string;
  sort_order?: number;
};

export interface ModuleCatalogEntry {
  id: string;
  name: string;
  description: string;
}

export interface ItemCatalogEntry {
  id: string;
  name: string;
  default_unit: string;
}