export interface SurveyAllocation {
  district: string;
  district_id: string;
  site?: string | null;
  site_id?: string | null;
  qty: number;
}

export interface SurveyItem {
  item_id: string;
  item_type: string;
  model_name: string;
  boq_item_id: string;
  allocations: SurveyAllocation[];
}

export interface BOQSurveyData {
  id: string;
  level: 'DISTRICT' | 'SITE';
  file_name: string;
  data: {
    level: 'DISTRICT' | 'SITE';
    items: SurveyItem[];
  };
  item_count: number;
  created_at: string;
  created_by?: string;
}

export interface BOQSurveyDataWrite {
  file: File;
}

export interface SurveyFilterOptions {
  view: 'ALL' | 'DISTRICT' | 'SITE';
  district_id?: string;
  site_id?: string;
}