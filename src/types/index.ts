export type UserRole = "user" | "admin";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded";

export type DiscountType = "fixed" | "percentage";

export type PaymentStatus =
  | "unpaid"
  | "awaiting_confirmation"
  | "paid"
  | "failed"
  | "refunded";

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  price: number;
  compare_at_price: number | null;
  duration: string | null;
  image_url: string | null;
  icon: string | null;
  badge: string | null;
  features: string[];
  requirements: string[];
  faqs: ProductFaq[];
  is_active: boolean;
  is_featured: boolean;
  is_custom_price: boolean;
  stock: number | null;
  sort_order: number;
  sold_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category: Pick<Category, "id" | "name" | "slug" | "icon"> | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount: number | null;
  min_purchase: number;
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoRedemption {
  id: string;
  promo_id: string;
  user_id: string | null;
  order_id: string | null;
  guest_email: string | null;
  amount: number;
  redeemed_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  total: number;
  promo_id: string | null;
  promo_code: string | null;
  status: OrderStatus;
  notes: string | null;
  admin_notes: string | null;
  whatsapp_url: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  duration: string | null;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
  variant: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BenefitSetting {
  icon: string;
  title: string;
  description: string;
}

export interface SocialLink {
  label: string;
  url: string;
  icon: string;
}

export interface SiteSettings {
  hero_badge: string;
  hero_title: string;
  hero_highlight: string;
  hero_subtitle: string;
  hero_cta_label: string;
  hero_cta_href: string;
  hero_secondary_label: string;
  hero_secondary_href: string;
  promo_banner_enabled: boolean;
  promo_banner_title: string;
  promo_banner_text: string;
  promo_banner_code: string;
  benefits: BenefitSetting[];
  stats: { label: string; value: string }[];
  footer_description: string;
  footer_copyright: string;
  whatsapp_number: string;
  support_email: string;
  social_links: SocialLink[];
}

/** Machine-readable promo validation outcomes returned by the database. */
export type PromoStatus =
  | "valid"
  | "invalid"
  | "inactive"
  | "expired"
  | "limit_reached"
  | "already_used"
  | "min_purchase";

export interface PromoValidationResult {
  status: PromoStatus;
  ok: boolean;
  message: string;
  promo?: {
    id: string;
    code: string;
    discount_type: DiscountType;
    discount_value: number;
    max_discount: number | null;
    min_purchase: number;
  };
  discount?: number;
}

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  duration: string | null;
  imageUrl: string | null;
  icon: string | null;
  isCustomPrice: boolean;
}
