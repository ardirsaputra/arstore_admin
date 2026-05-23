export interface Device {
  device_id: string;
  device_model: string;
  status: "trial" | "active" | "expired";
  user_name: string | null;
  user_email: string | null;
  trial_start_date: string | null;
  expiry_date: string | null;
  is_permanent: boolean;
  checked_at: string | null;
}

export interface LicenseCode {
  id: number;
  code: string;
  type: "monthly" | "6months" | "yearly" | "2years" | "lifetime";
  duration_months: number | null;
  used: boolean;
  used_by_device_id: string | null;
  created_at: string;
  used_at: string | null;
}

export interface PaymentInfo {
  whatsapp: string | null;
  email: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  qris_url: string | null;
  note: string | null;
  updated_at: string;
}

export interface FeatureRequest {
  id: string;
  device_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AdminStats {
  total: number;
  trial: number;
  active: number;
  expired: number;
  unread_feature_requests: number;
  total_codes: number;
  used_codes: number;
}
