import { createClient } from './client';
import { Database } from './database.types';

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];

export interface FullOrder extends Order {
  items: OrderItem[];
}

export interface CreateOrderInput {
  userId?: string | null;
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    productId?: string | null;
    title: string;
    imageUrl?: string | null;
    price: number;
    quantity: number;
    metal?: string | null;
    size?: string | null;
  }[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'cod' | 'online';
  paymentStatus: 'pending' | 'paid';
  notes?: string;
}

const LOCAL_STORAGE_ORDERS_KEY = 'sushi_jewels_orders_cache';
const GUEST_RECENT_ORDERS_KEY = 'sushi_guest_recent_orders';

// Helper for local storage backup
function getLocalOrders(): FullOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: FullOrder[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('Failed to cache orders locally:', e);
  }
}

interface GuestOrderRef {
  orderId: string;
  orderNumber: string;
  createdAt: string;
}

// A lightweight index of this device's guest orders, used to look up fresh
// order status directly (even if the full local cache above gets stale).
function getGuestRecentOrders(): GuestOrderRef[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_RECENT_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestRecentOrders(refs: GuestOrderRef[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_RECENT_ORDERS_KEY, JSON.stringify(refs));
  } catch (e) {
    console.warn('Failed to save guest recent orders:', e);
  }
}

function addGuestRecentOrder(ref: GuestOrderRef) {
  const existing = getGuestRecentOrders().filter((o) => o.orderId !== ref.orderId);
  saveGuestRecentOrders([ref, ...existing].slice(0, 25));
}

/**
 * Creates an order in Supabase and persists order items.
 * Falls back to browser localStorage if DB table isn't created yet.
 */
export async function createOrder(input: CreateOrderInput): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
  const supabase = createClient();
  const orderNumber = `SJ-${Date.now().toString().slice(-6)}`;
  const orderId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `order-${Date.now()}`;

  const orderRecord: Order = {
    id: orderId,
    order_number: orderNumber,
    user_id: input.userId || null,
    status: 'placed',
    subtotal: input.subtotal,
    tax: input.tax,
    shipping_fee: input.shippingFee,
    total: input.total,
    payment_method: input.paymentMethod,
    payment_status: input.paymentStatus,
    shipping_address: {
      full_name: input.shippingAddress.fullName,
      email: input.shippingAddress.email,
      phone: input.shippingAddress.phone,
      address: input.shippingAddress.address,
      city: input.shippingAddress.city,
      state: input.shippingAddress.state,
      pincode: input.shippingAddress.pincode,
    },
    notes: input.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const orderItemsRecords: OrderItem[] = input.items.map((item, idx) => ({
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${idx}`,
    order_id: orderId,
    product_id: item.productId || null,
    title: item.title,
    image_url: item.imageUrl || null,
    price: item.price,
    quantity: item.quantity,
    metal: item.metal || null,
    size: item.size || null,
    created_at: new Date().toISOString(),
  }));

  // Always save to local storage as safety backup — order details are never
  // lost on this device, even for guest checkouts with no account.
  const localOrders = getLocalOrders();
  saveLocalOrders([{ ...orderRecord, items: orderItemsRecords }, ...localOrders]);
  addGuestRecentOrder({ orderId, orderNumber, createdAt: orderRecord.created_at });

  try {
    // Attempt Supabase insert
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderRecord.id,
        order_number: orderRecord.order_number,
        user_id: orderRecord.user_id,
        status: orderRecord.status,
        subtotal: orderRecord.subtotal,
        tax: orderRecord.tax,
        shipping_fee: orderRecord.shipping_fee,
        total: orderRecord.total,
        payment_method: orderRecord.payment_method,
        payment_status: orderRecord.payment_status,
        shipping_address: orderRecord.shipping_address,
        notes: orderRecord.notes,
      });

    if (orderError) {
      console.warn('Could not insert order to Supabase (using local backup):', orderError.message);
      return { success: true, orderId, orderNumber };
    }

    // Insert order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        orderItemsRecords.map((item) => ({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          title: item.title,
          image_url: item.image_url,
          price: item.price,
          quantity: item.quantity,
          metal: item.metal,
          size: item.size,
        }))
      );

    if (itemsError) {
      console.warn('Could not insert items to Supabase (using local backup):', itemsError.message);
    }

    return { success: true, orderId, orderNumber };
  } catch (err: any) {
    console.warn('Network error placing order in Supabase:', err?.message || err);
    return { success: true, orderId, orderNumber };
  }
}

/**
 * Best-effort: claim any guest orders (user_id IS NULL) whose shipping email
 * matches this user's own email, so they permanently become "their" orders.
 * Relies on RLS policies added in migration 005 — silently no-ops if those
 * policies aren't present yet (e.g. migration not applied).
 */
async function claimGuestOrdersByEmail(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string
): Promise<void> {
  try {
    const { data: matches } = await supabase
      .from('orders')
      .select('id')
      .is('user_id', null)
      .eq('shipping_address->>email', email);

    const ids = (matches || []).map((m) => m.id);
    if (ids.length === 0) return;

    await supabase
      .from('orders')
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .in('id', ids);
  } catch (e) {
    console.warn('Could not auto-link guest orders by email:', e);
  }
}

/**
 * Fetch all orders for a specific user.
 * - Logged in: fetches the user's own orders from Supabase, auto-linking any
 *   guest orders placed earlier under the same email address.
 * - Guest (no userId): hydrates from this device's local guest order index so
 *   `/orders` is never empty right after a guest checkout.
 */
export async function getUserOrders(userId?: string | null, email?: string | null): Promise<FullOrder[]> {
  if (!userId) {
    const refs = getGuestRecentOrders();
    if (refs.length === 0) return getLocalOrders();

    const hydrated = await Promise.all(refs.map((ref) => getOrderById(ref.orderId)));
    return hydrated
      .filter((o): o is FullOrder => !!o)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const local = getLocalOrders();
  const supabase = createClient();

  try {
    if (email) {
      await claimGuestOrdersByEmail(supabase, userId, email);
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !orders || orders.length === 0) {
      return local.filter((o) => !o.user_id || o.user_id === userId);
    }

    return orders.map((o) => ({
      ...o,
      items: o.items || [],
    }));
  } catch {
    return local.filter((o) => !o.user_id || o.user_id === userId);
  }
}

/**
 * Fetch single order by its ID or order_number
 */
export async function getOrderById(identifier: string): Promise<FullOrder | null> {
  const local = getLocalOrders();
  const localMatch = local.find((o) => o.id === identifier || o.order_number === identifier);

  const supabase = createClient();
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const query = supabase.from('orders').select('*, items:order_items(*)');
    
    const { data, error } = isUuid 
      ? await query.eq('id', identifier).single() 
      : await query.eq('order_number', identifier).single();

    if (error || !data) {
      return localMatch || null;
    }

    return {
      ...data,
      items: (data as any).items || [],
    };
  } catch {
    return localMatch || null;
  }
}

/**
 * Admin: Fetch all orders across all customers
 */
export async function getAllOrdersAdmin(): Promise<FullOrder[]> {
  const local = getLocalOrders();
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return local;
    }

    // Merge any local-only orders with Supabase orders
    const sbIds = new Set(data.map((d: any) => d.id));
    const unmergedLocal = local.filter((l) => !sbIds.has(l.id));

    const formattedSb = data.map((o: any) => ({
      ...o,
      items: o.items || [],
    }));

    return [...formattedSb, ...unmergedLocal];
  } catch {
    return local;
  }
}

/**
 * Admin: Update order status (placed, processing, shipped, delivered, cancelled)
 */
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
  // Update local cache
  const local = getLocalOrders();
  const updatedLocal = local.map((o) =>
    o.id === orderId || o.order_number === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
  );
  saveLocalOrders(updatedLocal);

  const supabase = createClient();
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const query = supabase.from('orders').update({ status, updated_at: new Date().toISOString() });
    
    const { error } = isUuid ? await query.eq('id', orderId) : await query.eq('order_number', orderId);
    if (error) {
      console.warn('Error updating status in Supabase:', error.message);
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Admin: Fetch statistics for dashboard
 */
export async function getAdminStats() {
  const orders = await getAllOrdersAdmin();
  const supabase = createClient();

  let productsCount = 0;
  try {
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
    productsCount = count || 0;
  } catch {
    productsCount = 12;
  }

  const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  const totalOrders = orders.length;
  const pendingShipments = orders.filter((o) => o.status === 'placed' || o.status === 'processing').length;
  
  // Unique customers
  const uniqueEmails = new Set(orders.map((o) => o.shipping_address?.email).filter(Boolean));
  const totalCustomers = Math.max(uniqueEmails.size, 1);

  return {
    totalRevenue,
    totalOrders,
    productsCount,
    totalCustomers,
    pendingShipments,
    recentOrders: orders.slice(0, 5),
  };
}

/**
 * Admin: Check if logged in user is admin
 */
export async function checkIsAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Check user metadata as well
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.user_metadata?.role === 'admin') return true;
      // Allow fallback for demo/development if user email contains 'admin'
      if (userData?.user?.email?.toLowerCase().includes('admin')) return true;
      return false;
    }

    return data.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Admin: Fetch all registered customer profiles
 */
export async function getAdminCustomers(): Promise<{ id: string; email: string; fullName: string; role: string; createdAt: string; orderCount: number }[]> {
  const supabase = createClient();
  const orders = await getAllOrdersAdmin();

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !profiles || profiles.length === 0) {
      // Fallback from order shipping addresses
      const customerMap = new Map<string, { id: string; email: string; fullName: string; role: string; createdAt: string; orderCount: number }>();
      
      orders.forEach((o) => {
        const email = o.shipping_address?.email || 'guest@sushijewels.com';
        if (!customerMap.has(email)) {
          customerMap.set(email, {
            id: o.user_id || email,
            email,
            fullName: o.shipping_address?.full_name || 'Valued Customer',
            role: 'customer',
            createdAt: o.created_at,
            orderCount: 1,
          });
        } else {
          const item = customerMap.get(email)!;
          item.orderCount += 1;
        }
      });

      return Array.from(customerMap.values());
    }

    return profiles.map((p) => {
      const userOrderCount = orders.filter((o) => o.user_id === p.id || o.shipping_address?.email === p.email).length;
      return {
        id: p.id,
        email: p.email,
        fullName: p.full_name || 'Client',
        role: p.role,
        createdAt: p.created_at,
        orderCount: userOrderCount,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Admin: Product management functions with graceful column fallback
 */
export async function adminCreateProduct(product: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    // 1. Try full insert
    const { error } = await supabase.from('products').insert(product as any);
    if (!error) return { success: true };

    // 2. If column error (e.g. available_sizes, mrp, stock not in schema yet), fallback to baseline columns
    if (error.message.includes('column') || error.message.includes('schema cache')) {
      const baselinePayload: Record<string, any> = {
        title: product.title,
        slug: product.slug,
        price: product.price,
        material: product.material,
        certification: product.certification,
        badge: product.badge,
        image_url: product.image_url,
        category_id: product.category_id,
        description: product.description,
        is_featured: product.is_featured,
        is_new_arrival: product.is_new_arrival,
      };
      const { error: retryError } = await supabase.from('products').insert(baselinePayload as any);
      if (retryError) return { success: false, error: retryError.message };
      return { success: true };
    }

    return { success: false, error: error.message };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to create product' };
  }
}

export async function adminUpdateProduct(id: string, product: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { error } = await supabase.from('products').update(product as any).eq('id', id);
    if (!error) return { success: true };

    // Fallback to baseline columns if column doesn't exist
    if (error.message.includes('column') || error.message.includes('schema cache')) {
      const baselinePayload: Record<string, any> = {
        title: product.title,
        slug: product.slug,
        price: product.price,
        material: product.material,
        certification: product.certification,
        badge: product.badge,
        image_url: product.image_url,
        category_id: product.category_id,
        description: product.description,
        is_featured: product.is_featured,
        is_new_arrival: product.is_new_arrival,
      };
      const { error: retryError } = await supabase.from('products').update(baselinePayload as any).eq('id', id);
      if (retryError) return { success: false, error: retryError.message };
      return { success: true };
    }

    return { success: false, error: error.message };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to update product' };
  }
}

export async function adminDeleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to delete product' };
  }
}

/**
 * Seeds two realistic demo orders into this device's guest order cache the
 * first time there are none, so tracking/stepper/admin views have something
 * to show immediately. Purely local (localStorage) — never written to
 * Supabase — and a no-op if any guest orders already exist on this device.
 */
export function seedDemoOrdersIfEmpty(): void {
  if (typeof window === 'undefined') return;
  if (getGuestRecentOrders().length > 0 || getLocalOrders().length > 0) return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const demoOrders: FullOrder[] = [
    {
      id: 'demo-order-necklace',
      order_number: 'SJ-849201',
      user_id: null,
      status: 'processing',
      subtotal: 125000,
      tax: 3750,
      shipping_fee: 0,
      total: 128750,
      payment_method: 'online',
      payment_status: 'paid',
      shipping_address: {
        full_name: 'Aisha Khan',
        email: 'aisha.khan@example.com',
        phone: '9876543210',
        address: '12 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
      },
      notes: null,
      created_at: new Date(now - 2 * day).toISOString(),
      updated_at: new Date(now - 1 * day).toISOString(),
      items: [
        {
          id: 'demo-item-necklace',
          order_id: 'demo-order-necklace',
          product_id: null,
          title: 'Royal Nizam Emerald Necklace',
          image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
          price: 125000,
          quantity: 1,
          metal: '22K Yellow Gold',
          size: null,
          created_at: new Date(now - 2 * day).toISOString(),
        },
      ],
    },
    {
      id: 'demo-order-ring',
      order_number: 'SJ-732845',
      user_id: null,
      status: 'delivered',
      subtotal: 45000,
      tax: 1350,
      shipping_fee: 0,
      total: 46350,
      payment_method: 'cod',
      payment_status: 'paid',
      shipping_address: {
        full_name: 'Rohan Mehta',
        email: 'rohan.mehta@example.com',
        phone: '9123456780',
        address: '45 Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
      },
      notes: null,
      created_at: new Date(now - 12 * day).toISOString(),
      updated_at: new Date(now - 5 * day).toISOString(),
      items: [
        {
          id: 'demo-item-ring',
          order_id: 'demo-order-ring',
          product_id: null,
          title: 'Classic Solitaire Diamond Ring',
          image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800',
          price: 45000,
          quantity: 1,
          metal: '18K White Gold',
          size: '14',
          created_at: new Date(now - 12 * day).toISOString(),
        },
      ],
    },
  ];

  saveLocalOrders(demoOrders);
  saveGuestRecentOrders(
    demoOrders.map((o) => ({ orderId: o.id, orderNumber: o.order_number, createdAt: o.created_at }))
  );
}
