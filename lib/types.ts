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

export interface AppRelease {
  id: number;
  version_name: string;
  version_code: number;
  apk_url: string;
  changelog: string[];
  features: string[];
  screenshots: string[];
  min_android: string;
  file_size: string | null;
  is_published: boolean;
  release_date: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  category: "rental" | "development";
  description: string | null;
  price: number;
  duration: string | null;
  features: string[];
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
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
