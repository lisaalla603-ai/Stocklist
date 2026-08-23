/* ============================================================
   Stocklist DB — a tiny localStorage-backed data layer.
   No backend yet: this is the real shape of the data model,
   swap for API calls later without touching page code much.
   ============================================================ */

const StocklistDB = (function () {
  const KEYS = {
    businesses: "sl_businesses",
    suppliers: "sl_suppliers",
    products: "sl_products",
    orders: "sl_orders",
    session: "sl_session",
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function todayISO() {
    return new Date().toISOString();
  }
  function addDays(iso, days) {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  // -------------------- seed data (only runs once) --------------------
  function seedIfEmpty() {
    if (read(KEYS.suppliers, null)) return;

    const suppliers = [
      {
        id: "sup_riverside",
        name: "Delta Hygiene Supplies",
        city: "Pretoria",
        categories: ["Airbnb / guesthouse", "Salon / barber", "Office"],
        rating: 4.8,
        contact: "demo-delta@stocklist.test",
        password: "demo1234",
        isDemo: true,
      },
      {
        id: "sup_pta_clean",
        name: "PTA CleanCo",
        city: "Pretoria",
        categories: ["Restaurant / café", "Office", "Construction site"],
        rating: 4.6,
        contact: "demo-ptaclean@stocklist.test",
        password: "demo1234",
        isDemo: true,
      },
      {
        id: "sup_cbd_supply",
        name: "CBD Consumables",
        city: "Pretoria",
        categories: ["Airbnb / guesthouse", "Restaurant / café"],
        rating: 4.9,
        contact: "demo-cbd@stocklist.test",
        password: "demo1234",
        isDemo: true,
      },
    ];

    const products = [
      // Delta Hygiene Supplies
      { id: uid("prd"), supplierId: "sup_riverside", name: "Toilet paper, 2-ply", unit: "pack of 9", price: 89 },
      { id: uid("prd"), supplierId: "sup_riverside", name: "Hand soap refill", unit: "1L bottle", price: 45 },
      { id: uid("prd"), supplierId: "sup_riverside", name: "Shampoo & conditioner minis", unit: "24 units", price: 132 },
      { id: uid("prd"), supplierId: "sup_riverside", name: "Bin bags, 50L", unit: "roll of 20", price: 68 },
      { id: uid("prd"), supplierId: "sup_riverside", name: "Paper towels", unit: "roll", price: 22 },
      { id: uid("prd"), supplierId: "sup_riverside", name: "Laundry detergent", unit: "2L", price: 94 },
      // PTA CleanCo
      { id: uid("prd"), supplierId: "sup_pta_clean", name: "All-purpose cleaning chemical", unit: "5L", price: 118 },
      { id: uid("prd"), supplierId: "sup_pta_clean", name: "Dish soap & degreaser", unit: "5L", price: 96 },
      { id: uid("prd"), supplierId: "sup_pta_clean", name: "Disinfectant & sanitiser", unit: "5L", price: 140 },
      { id: uid("prd"), supplierId: "sup_pta_clean", name: "PPE gloves", unit: "box of 100", price: 85 },
      { id: uid("prd"), supplierId: "sup_pta_clean", name: "Bin bags, 50L", unit: "roll of 20", price: 64 },
      // CBD Consumables
      { id: uid("prd"), supplierId: "sup_cbd_supply", name: "Toilet paper, 2-ply", unit: "pack of 9", price: 82 },
      { id: uid("prd"), supplierId: "sup_cbd_supply", name: "Napkins & takeaway ware", unit: "pack of 200", price: 76 },
      { id: uid("prd"), supplierId: "sup_cbd_supply", name: "Coffee & tea supplies", unit: "starter box", price: 155 },
      { id: uid("prd"), supplierId: "sup_cbd_supply", name: "Hand sanitiser", unit: "1L", price: 58 },
    ];

    write(KEYS.suppliers, suppliers);
    write(KEYS.products, products);
    write(KEYS.businesses, []);
    write(KEYS.orders, []);
  }
  seedIfEmpty();

  // -------------------- session --------------------
  function getSession() {
    return read(KEYS.session, null);
  }
  function setSession(session) {
    write(KEYS.session, session);
  }
  function clearSession() {
    localStorage.removeItem(KEYS.session);
  }

  // -------------------- businesses (customers) --------------------
  function signupBusiness({ businessName, businessType, city, contact, password }) {
    const businesses = read(KEYS.businesses, []);
    if (businesses.some((b) => b.contact.toLowerCase() === contact.toLowerCase())) {
      throw new Error("An account already exists with that WhatsApp number or email.");
    }
    const biz = {
      id: uid("biz"),
      businessName,
      businessType,
      city,
      contact,
      password, // demo-only: plaintext, static site has no real backend
      createdAt: todayISO(),
    };
    businesses.push(biz);
    write(KEYS.businesses, businesses);
    setSession({ type: "business", id: biz.id });
    return biz;
  }
  function loginBusiness(contact, password) {
    const businesses = read(KEYS.businesses, []);
    const biz = businesses.find(
      (b) => b.contact.toLowerCase() === contact.toLowerCase() && b.password === password
    );
    if (!biz) throw new Error("No account matches those details.");
    setSession({ type: "business", id: biz.id });
    return biz;
  }
  function getBusiness(id) {
    return read(KEYS.businesses, []).find((b) => b.id === id) || null;
  }

  // -------------------- suppliers --------------------
  function signupSupplier({ supplierName, city, categories, contact, password }) {
    const suppliers = read(KEYS.suppliers, []);
    if (suppliers.some((s) => s.contact && s.contact.toLowerCase() === contact.toLowerCase())) {
      throw new Error("An account already exists with that WhatsApp number or email.");
    }
    const sup = {
      id: uid("sup"),
      name: supplierName,
      city,
      categories,
      contact,
      password,
      rating: null,
      createdAt: todayISO(),
    };
    suppliers.push(sup);
    write(KEYS.suppliers, suppliers);
    setSession({ type: "supplier", id: sup.id });
    return sup;
  }
  function loginSupplier(contact, password) {
    const suppliers = read(KEYS.suppliers, []);
    const sup = suppliers.find(
      (s) => s.contact && s.contact.toLowerCase() === contact.toLowerCase() && s.password === password
    );
    if (!sup) throw new Error("No account matches those details.");
    setSession({ type: "supplier", id: sup.id });
    return sup;
  }
  function getSupplier(id) {
    return read(KEYS.suppliers, []).find((s) => s.id === id) || null;
  }
  function savePayoutDetails(supplierId, { bankName, accountHolder, accountNumber, branchCode }) {
    const suppliers = read(KEYS.suppliers, []);
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) throw new Error("Supplier not found.");
    sup.payout = { bankName, accountHolder, accountNumber, branchCode };
    write(KEYS.suppliers, suppliers);
    return sup;
  }
  function listSuppliers({ city, category } = {}) {
    return read(KEYS.suppliers, []).filter((s) => {
      if (city && s.city !== city) return false;
      if (category && !s.categories.includes(category)) return false;
      return true;
    });
  }
  function addProduct(supplierId, { name, unit, price }) {
    const products = read(KEYS.products, []);
    const prd = { id: uid("prd"), supplierId, name, unit, price: Number(price) };
    products.push(prd);
    write(KEYS.products, products);
    return prd;
  }
  function listProducts(supplierId) {
    return read(KEYS.products, []).filter((p) => p.supplierId === supplierId);
  }
  function getProduct(id) {
    return read(KEYS.products, []).find((p) => p.id === id) || null;
  }

  // -------------------- cart (per-browser, not per-account) --------------------
  const CART_KEY = "sl_cart";
  function getCart() {
    return read(CART_KEY, { supplierId: null, items: {} }); // items: { productId: qty }
  }
  function setCart(cart) {
    write(CART_KEY, cart);
  }
  function clearCart() {
    localStorage.removeItem(CART_KEY);
  }
  function addToCart(supplierId, productId, qty) {
    const cart = getCart();
    if (cart.supplierId && cart.supplierId !== supplierId) {
      throw new Error("SUPPLIER_MISMATCH");
    }
    cart.supplierId = supplierId;
    cart.items[productId] = (cart.items[productId] || 0) + qty;
    if (cart.items[productId] <= 0) delete cart.items[productId];
    setCart(cart);
    return cart;
  }
  function setCartQty(productId, qty) {
    const cart = getCart();
    if (qty <= 0) delete cart.items[productId];
    else cart.items[productId] = qty;
    if (Object.keys(cart.items).length === 0) cart.supplierId = null;
    setCart(cart);
    return cart;
  }
  function cartCount() {
    const cart = getCart();
    return Object.values(cart.items).reduce((a, b) => a + b, 0);
  }
  function cartTotal() {
    const cart = getCart();
    let total = 0;
    Object.entries(cart.items).forEach(([pid, qty]) => {
      const p = getProduct(pid);
      if (p) total += p.price * qty;
    });
    return total;
  }

  // -------------------- orders --------------------
  const STATUS_FLOW = ["placed", "confirmed", "packed", "out_for_delivery", "delivered"];

  function placeOrder({ businessId, supplierId, items, recurrence, paymentMethod }) {
    const orders = read(KEYS.orders, []);
    const lineItems = Object.entries(items).map(([productId, qty]) => {
      const p = getProduct(productId);
      return { productId, name: p.name, unit: p.unit, price: p.price, qty };
    });
    const total = lineItems.reduce((sum, li) => sum + li.price * li.qty, 0);
    const commission = Math.round(total * 0.10 * 100) / 100;
    const order = {
      id: uid("ord"),
      businessId,
      supplierId,
      items: lineItems,
      total,
      commission,
      supplierPayout: Math.round((total - commission) * 100) / 100,
      paymentMethod: paymentMethod || "card",
      paymentStatus: "paid", // demo-only: simulated, no real gateway wired up yet
      status: "placed",
      createdAt: todayISO(),
      recurrence: recurrence && recurrence.enabled
        ? { enabled: true, intervalDays: recurrence.intervalDays, nextDate: addDays(todayISO(), recurrence.intervalDays) }
        : { enabled: false },
    };
    orders.push(order);
    write(KEYS.orders, orders);
    clearCart();
    return order;
  }

  function reorder(orderId) {
    const orders = read(KEYS.orders, []);
    const original = orders.find((o) => o.id === orderId);
    if (!original) throw new Error("Order not found.");
    const items = {};
    original.items.forEach((li) => (items[li.productId] = li.qty));
    return placeOrder({
      businessId: original.businessId,
      supplierId: original.supplierId,
      items,
      recurrence: original.recurrence.enabled
        ? { enabled: true, intervalDays: original.recurrence.intervalDays }
        : null,
    });
  }

  function listOrdersForBusiness(businessId) {
    return read(KEYS.orders, [])
      .filter((o) => o.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  function listOrdersForSupplier(supplierId) {
    return read(KEYS.orders, [])
      .filter((o) => o.supplierId === supplierId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  function getOrder(id) {
    return read(KEYS.orders, []).find((o) => o.id === id) || null;
  }
  function advanceOrderStatus(orderId) {
    const orders = read(KEYS.orders, []);
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found.");
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx < STATUS_FLOW.length - 1) order.status = STATUS_FLOW[idx + 1];
    write(KEYS.orders, orders);
    return order;
  }
  function setOrderStatus(orderId, status) {
    const orders = read(KEYS.orders, []);
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found.");
    order.status = status;
    write(KEYS.orders, orders);
    return order;
  }

  return {
    KEYS, STATUS_FLOW,
    getSession, setSession, clearSession,
    signupBusiness, loginBusiness, getBusiness,
    signupSupplier, loginSupplier, getSupplier, savePayoutDetails, listSuppliers, addProduct, listProducts, getProduct,
    getCart, setCart, clearCart, addToCart, setCartQty, cartCount, cartTotal,
    placeOrder, reorder, listOrdersForBusiness, listOrdersForSupplier, getOrder, advanceOrderStatus, setOrderStatus,
    addDays, uid,
  };
})();
