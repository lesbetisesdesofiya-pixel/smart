export type SuperadminView =
  | "schools"
  | "admins"
  | "activityLogs"
  | "aiProviders"
  | "financialReports"
  | "dashboard"
  | "adminView"
  | "settings"
  | "gradeSubmissions";

export type AdminRole = "superadmin" | "admin";

export interface AiSetting {
  id: string;
  ai_provider_id: string;
  scope_type: string | null;
  scope_id: number | null;
  api_key_preview: string;
  model: string | null;
  is_active: boolean;
}

export interface AiProvider {
  id: string;
  name: string;
  code: string;
  base_url: string;
  is_active: boolean;
  default_model: string | null;
  settings: AiSetting[];
}
