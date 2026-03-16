/**
 * Commerce Engine - Main orchestrator for commerce operations
 * 
 * Handles product pinning, flash deals with server-authoritative
 * timing, cart management, and checkout operations.
 */

import { 
  LiveProduct,
  ProductPinningState,
  FlashDeal,
  FlashDealState,
  Cart,
  CartItem,
  CheckoutSession,
  SaleAlert,
  PackType,
  WholesaleTier,
  CommerceEvent,
  CommerceEventType,
  ClientCommerceMessage,
  ServerCommerceMessage,
} from './types';

type CommerceEventCallback = (event: CommerceEvent) => void;

export class CommerceEngine {
  // State
  private products: Map<string, LiveProduct> = new Map();
  private pinningState: ProductPinningState = {
    productId: null,
    pinnedAt: null,
    pinnedBy: '',
    wholesaleTier: null,
    locked: false,
  };
  private flashDeal: FlashDeal | null = null;
  private flashDealInterval: number | null = null;
  private cart: Cart | null = null;
  private alerts: SaleAlert[] = [];
  
  // WebSocket
  private socket: WebSocket | null = null;
  private socketUrl: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  // Server time sync
  private serverTimeOffset = 0;
  private lastServerTimeSync = 0;
  
  // Events
  private eventListeners: Map<CommerceEventType, Set<CommerceEventCallback>> = new Map();
  
  // Callbacks for UI
  private onPinningChange: ((state: ProductPinningState) => void) | null = null;
  private onFlashDealChange: ((state: FlashDealState) => void) | null = null;
  private onCartChange: ((cart: Cart | null) => void) | null = null;
  private onAlert: ((alert: SaleAlert) => void) | null = null;

  constructor() {
    // Initialize empty cart
    this.cart = this.createEmptyCart('anonymous');
  }

  // ==========================================
  // Connection Management
  // ==========================================

  /**
   * Connect to commerce WebSocket server
   */
  connect(socketUrl: string): void {
    this.socketUrl = socketUrl;
    this.establishConnection();
  }

  /**
   * Establish WebSocket connection
   */
  private establishConnection(): void {
    if (!this.socketUrl) return;

    try {
      this.socket = new WebSocket(this.socketUrl);
      
      this.socket.onopen = () => {
        console.log('CommerceEngine connected');
        this.reconnectAttempts = 0;
        this.syncServerTime();
        this.emit('cart:updated', { cart: this.cart });
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message: ServerCommerceMessage = JSON.parse(event.data);
          this.handleServerMessage(message);
        } catch (e) {
          console.error('Failed to parse commerce message:', e);
        }
      };
      
      this.socket.onclose = () => {
        console.log('CommerceEngine disconnected');
        this.attemptReconnect();
      };
      
      this.socket.onerror = (error) => {
        console.error('CommerceEngine error:', error);
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.establishConnection();
    }, delay);
  }

  /**
   * Handle incoming server message
   */
  private handleServerMessage(message: ServerCommerceMessage): void {
    switch (message.type) {
      case 'pin:state':
        this.pinningState = message.state;
        this.emit('product:pinned', { state: this.pinningState });
        this.onPinningChange?.(this.pinningState);
        break;
        
      case 'flash:state':
        this.handleFlashDealState(message.state);
        break;
        
      case 'cart:sync':
        this.cart = message.cart;
        this.emit('cart:updated', { cart: this.cart });
        this.onCartChange?.(this.cart);
        break;
        
      case 'sale:alert':
        this.handleSaleAlert(message.alert);
        break;
        
      case 'checkout:session':
        this.emit('checkout:started', { session: message.session });
        break;
    }
  }

  /**
   * Send message to server
   */
  private send(message: ClientCommerceMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Sync with server time
   */
  private async syncServerTime(): Promise<void> {
    try {
      const before = Date.now();
      // In real implementation, would call server API
      // const response = await fetch('/api/time');
      // const serverTime = response.json();
      const after = Date.now();
      const rtt = after - before;
      
      // For demo, assume no offset
      this.serverTimeOffset = 0;
      this.lastServerTimeSync = Date.now();
    } catch (e) {
      console.warn('Failed to sync server time:', e);
    }
  }

  /**
   * Get current server time
   */
  getServerTime(): number {
    const timeSinceSync = Date.now() - this.lastServerTimeSync;
    return Date.now() - this.serverTimeOffset + timeSinceSync;
  }

  // ==========================================
  // Product Management
  // ==========================================

  /**
   * Load products for the session
   */
  loadProducts(products: LiveProduct[]): void {
    this.products.clear();
    products.forEach(p => this.products.set(p.id, p));
  }

  /**
   * Get product by ID
   */
  getProduct(productId: string): LiveProduct | undefined {
    return this.products.get(productId);
  }

  /**
   * Get all products
   */
  getProducts(): LiveProduct[] {
    return Array.from(this.products.values());
  }

  /**
   * Get products by type
   */
  getProductsByType(type: 'retail' | 'wholesale' | 'mixed'): LiveProduct[] {
    return this.getProducts().filter(p => p.type === type || p.type === 'mixed');
  }

  // ==========================================
  // Product Pinning
  // ==========================================

  /**
   * Set pinning change callback
   */
  onPinningChangeCallback(callback: (state: ProductPinningState) => void): void {
    this.onPinningChange = callback;
  }

  /**
   * Pin a product (host action)
   */
  pinProduct(productId: string, userId: string = 'host'): void {
    const product = this.products.get(productId);
    if (!product) {
      console.warn('Product not found:', productId);
      return;
    }

    // Request server to pin
    this.send({ type: 'pin:request', productId });
    
    // Optimistic update
    this.pinningState = {
      productId,
      pinnedAt: this.getServerTime(),
      pinnedBy: userId,
      wholesaleTier: null,
      locked: false,
    };
    
    this.emit('product:pinned', { 
      productId, 
      product,
      state: this.pinningState 
    });
    this.onPinningChange?.(this.pinningState);
  }

  /**
   * Unpin current product
   */
  unpinProduct(): void {
    this.send({ type: 'pin:release' });
    
    this.pinningState = {
      productId: null,
      pinnedAt: null,
      pinnedBy: '',
      wholesaleTier: null,
      locked: false,
    };
    
    this.emit('product:unpinned', {});
    this.onPinningChange?.(this.pinningState);
  }

  /**
   * Get current pinning state
   */
  getPinningState(): ProductPinningState {
    return { ...this.pinningState };
  }

  /**
   * Get pinned product
   */
  getPinnedProduct(): LiveProduct | null {
    if (!this.pinningState.productId) return null;
    return this.products.get(this.pinningState.productId) || null;
  }

  /**
   * Lock pinning (prevent changes)
   */
  lockPinning(reason?: string): void {
    this.pinningState.locked = true;
    this.pinningState.reason = reason;
    this.onPinningChange?.(this.pinningState);
  }

  /**
   * Unlock pinning
   */
  unlockPinning(): void {
    this.pinningState.locked = false;
    this.pinningState.reason = undefined;
    this.onPinningChange?.(this.pinningState);
  }

  /**
   * Set wholesale tier for pinned product
   */
  setWholesaleTier(tier: WholesaleTier | null): void {
    this.pinningState.wholesaleTier = tier;
    this.onPinningChange?.(this.pinningState);
  }

  // ==========================================
  // Flash Deals
  // ==========================================

  /**
   * Set flash deal change callback
   */
  onFlashDealChangeCallback(callback: (state: FlashDealState) => void): void {
    this.onFlashDealChange = callback;
  }

  /**
   * Start a flash deal
   */
  startFlashDeal(productId: string, durationSeconds: number = 300): void {
    const product = this.products.get(productId);
    if (!product) {
      console.warn('Product not found for flash deal:', productId);
      return;
    }

    // Calculate deal price
    const originalPrice = product.pricing.retailPromo || product.pricing.retailOriginal || 0;
    const discountPct = 20; // Default 20%
    const dealPrice = originalPrice * (1 - discountPct / 100);

    this.flashDeal = {
      id: `flash-${Date.now()}`,
      productId,
      product,
      discountPct,
      originalPrice,
      dealPrice,
      startTime: this.getServerTime(),
      endTime: this.getServerTime() + (durationSeconds * 1000),
      stockLimit: product.inventory.stockLeft || 100,
      soldCount: 0,
      active: true,
      label: 'Flash Deal!',
      extraPct: 5,
    };

    // Start countdown
    this.startFlashDealCountdown();
    
    // Notify server
    this.send({ type: 'flash:start', productId, duration: durationSeconds });
    
    this.emit('flash:started', { deal: this.flashDeal });
    this.onFlashDealChange?.(this.getFlashDealState());
  }

  /**
   * Stop current flash deal
   */
  stopFlashDeal(): void {
    if (!this.flashDeal) return;

    this.flashDeal.active = false;
    
    if (this.flashDealInterval) {
      clearInterval(this.flashDealInterval);
      this.flashDealInterval = null;
    }
    
    this.send({ type: 'flash:stop' });
    
    this.emit('flash:stopped', { deal: this.flashDeal });
    this.onFlashDealChange?.(this.getFlashDealState());
    
    this.flashDeal = null;
  }

  /**
   * Handle flash deal state from server
   */
  private handleFlashDealState(state: FlashDealState): void {
    if (state.deal) {
      this.flashDeal = state.deal;
      if (state.active && !this.flashDealInterval) {
        this.startFlashDealCountdown();
      }
    }
    this.onFlashDealChange?.(state);
  }

  /**
   * Start flash deal countdown timer
   */
  private startFlashDealCountdown(): void {
    if (this.flashDealInterval) {
      clearInterval(this.flashDealInterval);
    }

    this.flashDealInterval = window.setInterval(() => {
      if (!this.flashDeal) {
        clearInterval(this.flashDealInterval!);
        return;
      }

      const now = this.getServerTime();
      const secondsLeft = Math.max(0, Math.floor((this.flashDeal.endTime - now) / 1000));

      // Emit tick
      this.emit('flash:tick', { 
        secondsLeft,
        deal: this.flashDeal 
      });

      // Auto-stop if expired
      if (secondsLeft <= 0) {
        this.stopFlashDeal();
      }

      // Update state
      this.onFlashDealChange?.(this.getFlashDealState());
    }, 1000);
  }

  /**
   * Get current flash deal state
   */
  getFlashDealState(): FlashDealState {
    if (!this.flashDeal || !this.flashDeal.active) {
      return {
        active: false,
        deal: null,
        secondsLeft: 0,
        discountPct: 0,
        urgency: 'low',
      };
    }

    const now = this.getServerTime();
    const secondsLeft = Math.max(0, Math.floor((this.flashDeal.endTime - now) / 1000));
    
    // Calculate urgency
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (secondsLeft <= 30) urgency = 'critical';
    else if (secondsLeft <= 60) urgency = 'high';
    else if (secondsLeft <= 120) urgency = 'medium';

    return {
      active: true,
      deal: this.flashDeal,
      secondsLeft,
      discountPct: this.flashDeal.discountPct,
      urgency,
    };
  }

  /**
   * Get current flash deal
   */
  getFlashDeal(): FlashDeal | null {
    return this.flashDeal;
  }

  // ==========================================
  // Cart Management
  // ==========================================

  /**
   * Set cart change callback
   */
  onCartChangeCallback(callback: (cart: Cart | null) => void): void {
    this.onCartChange = callback;
  }

  /**
   * Create empty cart
   */
  private createEmptyCart(userId: string): Cart {
    return {
      id: `cart-${Date.now()}`,
      userId,
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      currency: 'USD',
      updatedAt: Date.now(),
    };
  }

  /**
   * Add item to cart
   */
  addToCart(productId: string, quantity: number = 1, packType: PackType = 'Unit'): boolean {
    const product = this.products.get(productId);
    if (!product) return false;

    // Check stock
    if (product.inventory.stockLeft !== undefined && product.inventory.stockLeft < quantity) {
      console.warn('Insufficient stock');
      return false;
    }

    // Calculate price
    const unitPrice = this.calculateUnitPrice(product, quantity, packType);
    const total = unitPrice * quantity;

    // Check if already in cart
    const existingIndex = this.cart?.items.findIndex(i => i.productId === productId) ?? -1;
    
    if (existingIndex >= 0 && this.cart) {
      // Update existing
      this.cart.items[existingIndex].quantity += quantity;
      this.cart.items[existingIndex].total = 
        this.cart.items[existingIndex].unitPrice * this.cart.items[existingIndex].quantity;
    } else if (this.cart) {
      // Add new item
      const item: CartItem = {
        productId,
        product,
        quantity,
        packType,
        unitPrice,
        total,
      };
      this.cart.items.push(item);
    }

    // Recalculate totals
    this.recalculateCart();

    // Send to server
    this.send({ type: 'cart:add', productId, quantity, packType });
    
    this.emit('cart:updated', { cart: this.cart });
    this.onCartChange?.(this.cart);
    
    return true;
  }

  /**
   * Remove item from cart
   */
  removeFromCart(productId: string): void {
    if (!this.cart) return;

    this.cart.items = this.cart.items.filter(i => i.productId !== productId);
    this.recalculateCart();

    this.send({ type: 'cart:remove', productId });
    
    this.emit('cart:updated', { cart: this.cart });
    this.onCartChange?.(this.cart);
  }

  /**
   * Clear cart
   */
  clearCart(): void {
    if (!this.cart) return;

    this.cart.items = [];
    this.recalculateCart();

    this.send({ type: 'cart:clear' });
    
    this.emit('cart:cleared', {});
    this.onCartChange?.(this.cart);
  }

  /**
   * Calculate unit price for product
   */
  private calculateUnitPrice(product: LiveProduct, quantity: number, packType: PackType): number {
    // Check for wholesale pricing
    if (product.pricing.tiers && quantity >= (product.pricing.tiers[0]?.minQty || 1)) {
      const tier = product.pricing.tiers.find(t => 
        quantity >= t.minQty && (!t.maxQty || quantity <= t.maxQty)
      );
      if (tier) return tier.unitPrice;
    }

    // Use retail price
    return product.pricing.retailPromo || product.pricing.retailOriginal || 0;
  }

  /**
   * Recalculate cart totals
   */
  private recalculateCart(): void {
    if (!this.cart) return;

    this.cart.subtotal = this.cart.items.reduce((sum, item) => sum + item.total, 0);
    
    // Apply flash deal discount if active
    if (this.flashDeal?.active) {
      const flashItem = this.cart.items.find(i => i.productId === this.flashDeal!.productId);
      if (flashItem) {
        const discount = flashItem.total * (this.flashDeal.discountPct / 100);
        this.cart.discount = discount;
      }
    }
    
    this.cart.total = this.cart.subtotal - this.cart.discount;
    this.cart.updatedAt = Date.now();
  }

  /**
   * Get current cart
   */
  getCart(): Cart | null {
    return this.cart ? { ...this.cart } : null;
  }

  /**
   * Get cart item count
   */
  getCartCount(): number {
    return this.cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  // ==========================================
  // Alerts
  // ==========================================

  /**
   * Set alert callback
   */
  onAlertCallback(callback: (alert: SaleAlert) => void): void {
    this.onAlert = callback;
  }

  /**
   * Handle incoming sale alert
   */
  private handleSaleAlert(alert: SaleAlert): void {
    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
    
    this.emit('sale:alert', { alert });
    this.onAlert?.(alert);
  }

  /**
   * Get recent alerts
   */
  getAlerts(): SaleAlert[] {
    return [...this.alerts];
  }

  /**
   * Get active alerts (within display duration)
   */
  getActiveAlerts(): SaleAlert[] {
    const now = Date.now();
    return this.alerts.filter(a => 
      now - a.timestamp < a.displayDuration
    );
  }

  // ==========================================
  // Checkout
  // ==========================================

  /**
   * Initialize checkout
   */
  async initCheckout(): Promise<CheckoutSession | null> {
    if (!this.cart || this.cart.items.length === 0) {
      console.warn('Cart is empty');
      return null;
    }

    this.send({ type: 'checkout:init' });
    
    // Return local session (server will update)
    const session: CheckoutSession = {
      id: `session-${Date.now()}`,
      userId: this.cart.userId,
      cart: this.cart,
      paymentStatus: 'pending',
      status: 'pending',
      createdAt: Date.now(),
    };
    
    this.emit('checkout:started', { session });
    return session;
  }

  /**
   * Complete checkout
   */
  async completeCheckout(paymentMethod: string): Promise<boolean> {
    this.send({ type: 'checkout:complete', paymentMethod });
    
    // Clear cart after successful checkout
    this.clearCart();
    
    return true;
  }

  // ==========================================
  // Event System
  // ==========================================

  /**
   * Subscribe to events
   */
  on(event: CommerceEventType, callback: CommerceEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: CommerceEventType, callback: CommerceEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit event
   */
  private emit(type: CommerceEventType, data?: Record<string, unknown>): void {
    const event: CommerceEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    this.eventListeners.get(type)?.forEach(callback => callback(event));
  }

  // ==========================================
  // Cleanup
  // ==========================================

  /**
   * Disconnect and cleanup
   */
  destroy(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.flashDealInterval) {
      clearInterval(this.flashDealInterval);
    }
    
    this.eventListeners.clear();
    this.products.clear();
    this.alerts = [];
  }
}

export const commerceEngine = new CommerceEngine();
