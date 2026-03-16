/**
 * Commerce Module Type Definitions
 * 
 * Defines interfaces for product pinning, flash deals,
 * cart management, and checkout operations.
 */

// ==========================================
// Product Types
// ==========================================

export type ProductType = 'retail' | 'wholesale' | 'mixed';

export interface WholesaleTier {
  label: string;
  minQty: number;
  maxQty?: number;
  unitPrice: number;
}

export interface ProductPricing {
  retailOriginal?: number;
  retailPromo?: number;
  discountPct?: number;
  liveOnlyPrice?: boolean;
  
  // Wholesale
  wholesaleOnly?: boolean;
  alsoRetail?: boolean;
  tiers?: WholesaleTier[];
  
  // Currency
  currency: string;
}

export interface ProductInventory {
  stockLeft?: number;
  stockTotal?: number;
  unlimited?: boolean;
  preorder?: boolean;
  leadTime?: string;
}

export interface LiveProduct {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  type: ProductType;
  category: string;
  pricing: ProductPricing;
  inventory: ProductInventory;
  tags?: string[];
  urgent?: boolean;
  countdown?: string;
}

// ==========================================
// Product Pinning
// ==========================================

export interface ProductPinningState {
  productId: string | null;
  pinnedAt: number | null;
  pinnedBy: string;
  wholesaleTier: WholesaleTier | null;
  locked: boolean;
  reason?: string;
}

// ==========================================
// Flash Deals
// ==========================================

export interface FlashDeal {
  id: string;
  productId: string;
  product: LiveProduct;
  
  // Pricing
  discountPct: number;
  originalPrice: number;
  dealPrice: number;
  
  // Timing (server-authoritative)
  startTime: number;      // Server timestamp
  endTime: number;        // Server timestamp
  
  // Stock
  stockLimit: number;
  soldCount: number;
  
  // Status
  active: boolean;
  label?: string;
  extraPct?: number;      // Extra discount for certain users
}

export interface FlashDealState {
  active: boolean;
  deal: FlashDeal | null;
  secondsLeft: number;
  discountPct: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

// ==========================================
// Cart
// ==========================================

export type PackType = 'Unit' | 'Pack' | 'Carton' | 'Pallet';

export interface CartItem {
  productId: string;
  product: LiveProduct;
  quantity: number;
  packType: PackType;
  unitPrice: number;
  total: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  updatedAt: number;
}

// ==========================================
// Checkout
// ==========================================

export type CheckoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface CheckoutSession {
  id: string;
  userId: string;
  cart: Cart;
  
  // Payment
  paymentMethod?: string;
  paymentStatus: 'pending' | 'authorized' | 'captured' | 'failed';
  transactionId?: string;
  
  // Shipping
  shippingAddress?: ShippingAddress;
  
  // Status
  status: CheckoutStatus;
  createdAt: number;
  completedAt?: number;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// ==========================================
// Alerts & Notifications
// ==========================================

export type SaleAlertType = 'purchase' | 'cart_add' | 'wishlist' | 'stock_warning';

export interface SaleAlert {
  id: string;
  type: SaleAlertType;
  buyerName: string;
  buyerAvatar?: string;
  productId: string;
  productName: string;
  quantity: number;
  amount?: number;
  timestamp: number;
  displayDuration: number;
}

// ==========================================
// Events
// ==========================================

export type CommerceEventType = 
  | 'product:pinned'
  | 'product:unpinned'
  | 'flash:started'
  | 'flash:stopped'
  | 'flash:tick'
  | 'cart:updated'
  | 'cart:cleared'
  | 'checkout:started'
  | 'checkout:completed'
  | 'checkout:failed'
  | 'sale:alert';

export interface CommerceEvent {
  type: CommerceEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

// ==========================================
// WebSocket Messages
// ==========================================

export interface CommerceMessage {
  type: string;
  payload: unknown;
}

// Client -> Server
export type ClientCommerceMessage =
  | { type: 'pin:request'; productId: string }
  | { type: 'pin:release' }
  | { type: 'flash:start'; productId: string; duration: number }
  | { type: 'flash:stop' }
  | { type: 'cart:add'; productId: string; quantity: number; packType: PackType }
  | { type: 'cart:remove'; productId: string }
  | { type: 'cart:clear' }
  | { type: 'checkout:init' }
  | { type: 'checkout:complete'; paymentMethod: string };

// Server -> Client
export type ServerCommerceMessage =
  | { type: 'pin:state'; state: ProductPinningState }
  | { type: 'pin:error'; message: string }
  | { type: 'flash:state'; state: FlashDealState }
  | { type: 'flash:error'; message: string }
  | { type: 'cart:sync'; cart: Cart }
  | { type: 'cart:error'; message: string }
  | { type: 'checkout:session'; session: CheckoutSession }
  | { type: 'sale:alert'; alert: SaleAlert };
