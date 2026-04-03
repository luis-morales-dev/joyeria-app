// ============================================================
// src/app/models/woocommerce.models.ts
// ============================================================

// ─── Imagen ───────────────────────────────────────────────
export interface WCImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

// ─── Categoría ────────────────────────────────────────────
export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  image: WCImage | null;
  count: number;
}

// ─── Atributo de variación ────────────────────────────────
export interface WCAttribute {
  id: number;
  name: string;
  options: string[];
  variation: boolean;
  visible: boolean;
}

// ─── Producto ─────────────────────────────────────────────
export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  status: 'publish' | 'draft' | 'pending';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  manage_stock: boolean;
  categories: Pick<WCCategory, 'id' | 'name' | 'slug'>[];
  images: WCImage[];
  attributes: WCAttribute[];
  average_rating: string;
  rating_count: number;
}

// ─── Variación ────────────────────────────────────────────
export interface WCVariation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: 'instock' | 'outofstock';
  stock_quantity: number | null;
  image: WCImage;
  attributes: { id: number; name: string; option: string }[];
}

// ─── Línea de pedido ──────────────────────────────────────
export interface WCLineItem {
  id?: number;
  product_id: number;
  variation_id?: number;
  quantity: number;
  name?: string;
  price?: number;
  total?: string;
  image?: WCImage;
}

// ─── Dirección ────────────────────────────────────────────
export interface WCAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

// ─── Pedido ───────────────────────────────────────────────
export interface WCOrder {
  id?: number;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  currency: string;
  total?: string;
  subtotal?: string;
  customer_id: number;
  billing: WCAddress;
  shipping: WCAddress;
  line_items: WCLineItem[];
  payment_method: string;
  payment_method_title: string;
  set_paid?: boolean;
  customer_note?: string;
  date_created?: string;
}

// ─── Cliente ──────────────────────────────────────────────
export interface WCCustomer {
  id?: number;
  date_created?: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  password?: string;
  billing: WCAddress;
  shipping: WCAddress;
  avatar_url?: string;
}

// ─── Parámetros de consulta de productos ─────────────────
export interface WCProductParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: number | string;
  tag?: number | string;
  status?: string;
  featured?: boolean;
  on_sale?: boolean;
  min_price?: string;
  max_price?: string;
  orderby?: 'date' | 'id' | 'title' | 'price' | 'popularity' | 'rating';
  order?: 'asc' | 'desc';
  stock_status?: 'instock' | 'outofstock';
}

// ─── Respuesta paginada genérica ─────────────────────────
export interface WCPaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
}

// ─── Item del carrito (local) ─────────────────────────────
export interface CartItem {
  product: WCProduct;
  variation?: WCVariation;
  quantity: number;
  selectedAttributes?: { [key: string]: string };
}

// ─── Token de autenticación ───────────────────────────────
export interface WCAuthToken {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}