export interface AnalysisRequest {
  curr_lat: number;
  curr_lon: number;
  curr_range: number;
  w_infra: number;
  w_econ: number;
  w_env: number;
  description: string;
  userEmail: string;
}

export interface AnalysisResponse {
  s_infra: string;
  s_env: string;
  s_econ: string;
  s_avg: string;
  s_xgboost_aggregate: string;
  s_user_custom_pref: string;
  ai_summary: string;
}

export interface SaveReportRequest {
  message: string;
  email: string;
}

export interface ParsedAnalysisData {
  infrastructure: number;
  environmental: number;
  economic: number;
  average: number;
  xgboostAggregate: number;
  userCustomPref: number;
  aiSummary: {
    insights: string[];
    recommendations: string[];
    summary: string;
    summaryPoints: string[];
  };
}

export interface ChartData {
  name: string;
  value: number;
  color: string;
}
