import { supabase, isSupabaseConfigured } from './supabaseClient.js';

// ==========================================
// VERCEL/SUPABASE FIRST DATA LAYER
// সমস্ত ডেটা সরাসরি Supabase থেকে আসবে
// লোকাল ডেভেলপমেন্টে ফলব্যাক JSON ফাইলে
// ==========================================

// Dynamic import of fs (only works in Node.js environment, not Vercel edge)
let fs, path, fileURLToPath;
let localFallbackAvailable = false;
let DATA_DIR, DB_FILE, DEFAULT_DATA;

const IS_VERCEL = !!process.env.VERCEL;

if (!IS_VERCEL) {
  try {
    const fsModule = await import('fs');
    const pathModule = await import('path');
    const urlModule = await import('url');
    fs = fsModule.default;
    path = pathModule.default;
    fileURLToPath = urlModule.fileURLToPath;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    DATA_DIR = path.join(__dirname, '..', 'data');
    DB_FILE = path.join(DATA_DIR, 'factory_data.json');

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    localFallbackAvailable = true;
  } catch (e) {
    localFallbackAvailable = false;
  }
}

DEFAULT_DATA = {
  company: {
    name: 'আর.এস. পেপার এন্ড প্যাকেজিং',
    owner: 'মোঃ মজনুর রহমান',
    tagline: 'টিস্যু ও কাটিং/নিউজ পেপার উৎপাদন, ক্রয়-বিক্রয় ও সরবরাহকারী প্রতিষ্ঠান',
    address: 'চাঁদপাড়া, কোটচাঁদপুর, ঝিনাইদহ',
    phone: '01711006211',
    email: 'contact@rspaperpackaging.com',
  },
  customers: [],
  suppliers: [],
  purchases: [],
  sales: [],
  payments: []
};

// ==========================================
// LOCAL JSON FILE HELPERS (লোকাল-অনলি)
// ==========================================
function loadLocalData() {
  try {
    if (!localFallbackAvailable || !fs.existsSync(DB_FILE)) return DEFAULT_DATA;
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.customers) data.customers = [];
    if (!data.suppliers) data.suppliers = [];
    if (!data.purchases) data.purchases = [];
    if (!data.sales) data.sales = [];
    if (!data.payments) data.payments = [];
    return data;
  } catch (err) {
    return DEFAULT_DATA;
  }
}

function saveLocalData(data) {
  if (!localFallbackAvailable) return false;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
}

// ==========================================
// SUPABASE DIRECT OPERATIONS
// ==========================================
async function supabaseQuery(table, query = {}) {
  if (!isSupabaseConfigured() || !supabase) return [];
  try {
    let q = supabase.from(table).select('*');
    if (query.eq) q = q.eq(query.eq[0], query.eq[1]);
    if (query.ilike) q = q.ilike(query.ilike[0], `%${query.ilike[1]}%`);
    if (query.order) q = q.order(query.order, { ascending: false });
    const { data, error } = await q;
    if (error) { console.warn(`Supabase ${table} query error:`, error.message); return []; }
    return data || [];
  } catch (err) {
    console.warn('Supabase query error:', err.message);
    return [];
  }
}

async function supabaseUpsert(table, payload) {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from(table).upsert(payload).select().single();
    if (error) console.warn(`Supabase ${table} upsert error:`, error.message);
    return data;
  } catch (err) {
    console.warn('Supabase upsert error:', err.message);
    return null;
  }
}

async function supabaseDelete(table, id) {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { console.warn(`Supabase ${table} delete error:`, error.message); return false; }
    return true;
  } catch (err) {
    console.warn('Supabase delete error:', err.message);
    return false;
  }
}

// ==========================================
// PUBLIC API - loadData / saveData
// Vercel: Supabase, লোকাল: JSON file
// ==========================================
export async function loadData() {
  if (IS_VERCEL || isSupabaseConfigured()) {
    const [customers, suppliers, purchases, sales, payments] = await Promise.all([
      supabaseQuery('customers', { order: 'created_at' }),
      supabaseQuery('suppliers', { order: 'created_at' }),
      supabaseQuery('purchases', { order: 'created_at' }),
      supabaseQuery('sales', { order: 'created_at' }),
      supabaseQuery('payments', { order: 'created_at' })
    ]);

    // Convert Supabase snake_case columns back to camelCase for app compatibility
    return {
      company: DEFAULT_DATA.company,
      customers: customers.map(c => ({
        id: c.id, name: c.name, phone: c.phone || '', address: c.address || '', createdAt: c.created_at
      })),
      suppliers: suppliers.map(s => ({
        id: s.id, name: s.name, phone: s.phone || '', address: s.address || '', createdAt: s.created_at
      })),
      purchases: purchases.map(p => ({
        id: p.id, date: p.date, supplierName: p.supplier_name, supplierPhone: p.supplier_phone || '',
        supplierAddress: p.supplier_address || '', items: p.items || [], subTotal: p.sub_total,
        discount: p.discount, grandTotal: p.grand_total, paidAmount: p.paid_amount,
        dueAmount: p.due_amount, paymentMethod: p.payment_method || 'ক্যাশ', notes: p.notes || '',
        createdAt: p.created_at
      })),
      sales: sales.map(s => ({
        id: s.id, date: s.date, customerName: s.customer_name, customerPhone: s.customer_phone || '',
        customerAddress: s.customer_address || '', items: s.items || [], subTotal: s.sub_total,
        discount: s.discount, grandTotal: s.grand_total, receivedAmount: s.received_amount,
        dueAmount: s.due_amount, paymentMethod: s.payment_method || 'ক্যাশ', notes: s.notes || '',
        createdAt: s.created_at
      })),
      payments: payments.map(p => ({
        id: p.id, type: p.type, partyName: p.party_name, partyPhone: p.party_phone || '',
        amount: p.amount, date: p.date, paymentMethod: p.payment_method || 'ক্যাশ',
        notes: p.notes || '', createdAt: p.created_at
      }))
    };
  }
  return loadLocalData();
}

export function saveData(data) {
  if (!IS_VERCEL && localFallbackAvailable) {
    saveLocalData(data);
  }
  // On Vercel, saves are done per-operation via Supabase directly
  return true;
}

// ==========================================
// GODOWN STOCK CALCULATION
// ==========================================
export async function getGodownStock() {
  const data = await loadData();
  const purchases = data.purchases || [];
  const sales = data.sales || [];

  const tissue = { purchasedQty: 0, purchasedCost: 0, soldQty: 0, soldRevenue: 0 };
  const cuttingNews = { purchasedQty: 0, purchasedCost: 0, soldQty: 0, soldRevenue: 0 };

  purchases.forEach(p => {
    (p.items || []).forEach(item => {
      const qty = Number(item.quantity || 0);
      const total = Number(item.total || 0);
      if (item.productType === 'tissue') { tissue.purchasedQty += qty; tissue.purchasedCost += total; }
      else if (item.productType === 'cutting_news') { cuttingNews.purchasedQty += qty; cuttingNews.purchasedCost += total; }
    });
  });

  sales.forEach(s => {
    (s.items || []).forEach(item => {
      const qty = Number(item.quantity || 0);
      const total = Number(item.total || 0);
      if (item.productType === 'tissue') { tissue.soldQty += qty; tissue.soldRevenue += total; }
      else if (item.productType === 'cutting_news') { cuttingNews.soldQty += qty; cuttingNews.soldRevenue += total; }
    });
  });

  tissue.currentStock = tissue.purchasedQty - tissue.soldQty;
  tissue.avgPurchaseRate = tissue.purchasedQty > 0 ? (tissue.purchasedCost / tissue.purchasedQty) : 0;
  tissue.estimatedStockValue = Math.max(0, tissue.currentStock) * tissue.avgPurchaseRate;

  cuttingNews.currentStock = cuttingNews.purchasedQty - cuttingNews.soldQty;
  cuttingNews.avgPurchaseRate = cuttingNews.purchasedQty > 0 ? (cuttingNews.purchasedCost / cuttingNews.purchasedQty) : 0;
  cuttingNews.estimatedStockValue = Math.max(0, cuttingNews.currentStock) * cuttingNews.avgPurchaseRate;

  return { tissue, cuttingNews, totalStockValue: tissue.estimatedStockValue + cuttingNews.estimatedStockValue };
}

// ==========================================
// DASHBOARD STATS
// ==========================================
export async function getDashboardStats() {
  const data = await loadData();
  const stock = await getGodownStock();

  const customers = data.customers || [];
  const suppliers = data.suppliers || [];
  const purchases = data.purchases || [];
  const sales = data.sales || [];
  const payments = data.payments || [];

  const totalSaleAmount = sales.reduce((s, sale) => s + Number(sale.grandTotal || 0), 0);
  const totalPurchaseAmount = purchases.reduce((s, p) => s + Number(p.grandTotal || 0), 0);
  const totalSaleReceived = sales.reduce((s, sale) => s + Number(sale.receivedAmount || 0), 0) +
    payments.filter(p => p.type === 'customer_collection').reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPurchasePaid = purchases.reduce((s, p) => s + Number(p.paidAmount || 0), 0) +
    payments.filter(p => p.type === 'supplier_payment').reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalCustomerReceivable = totalSaleAmount - totalSaleReceived;
  const totalSupplierPayable = totalPurchaseAmount - totalPurchasePaid;

  return {
    stock,
    finance: {
      totalPurchaseAmount, totalPurchasePaid, totalSupplierPayable,
      totalSaleAmount, totalSaleReceived, totalCustomerReceivable,
      netCashFlow: totalSaleReceived - totalPurchasePaid
    },
    counts: {
      customersCount: customers.length, suppliersCount: suppliers.length,
      purchasesCount: purchases.length, salesCount: sales.length
    }
  };
}

// ==========================================
// CUSTOMER ACCOUNTS (খাতা)
// ==========================================
export async function ensureCustomerExists(name, phone = '', address = '') {
  const trimmedName = name.trim();
  const data = await loadData();
  let customer = (data.customers || []).find(c => c.name.toLowerCase() === trimmedName.toLowerCase());

  if (!customer) {
    customer = {
      id: `CUST-${Date.now().toString().slice(-6)}`,
      name: trimmedName,
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      createdAt: new Date().toISOString()
    };
    await supabaseUpsert('customers', {
      id: customer.id, name: customer.name, phone: customer.phone,
      address: customer.address, created_at: customer.createdAt
    });
    if (!IS_VERCEL && localFallbackAvailable) {
      const localData = loadLocalData();
      localData.customers = localData.customers || [];
      localData.customers.push(customer);
      saveLocalData(localData);
    }
  }
  return customer;
}

export async function ensureSupplierExists(name, phone = '', address = '') {
  const trimmedName = name.trim();
  const data = await loadData();
  let supplier = (data.suppliers || []).find(s => s.name.toLowerCase() === trimmedName.toLowerCase());

  if (!supplier) {
    supplier = {
      id: `SUPP-${Date.now().toString().slice(-6)}`,
      name: trimmedName,
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      createdAt: new Date().toISOString()
    };
    await supabaseUpsert('suppliers', {
      id: supplier.id, name: supplier.name, phone: supplier.phone,
      address: supplier.address, created_at: supplier.createdAt
    });
    if (!IS_VERCEL && localFallbackAvailable) {
      const localData = loadLocalData();
      localData.suppliers = localData.suppliers || [];
      localData.suppliers.push(supplier);
      saveLocalData(localData);
    }
  }
  return supplier;
}

export async function getAllCustomerFolders() {
  const data = await loadData();
  return Promise.all((data.customers || []).map(c => getCustomerFolderDetails(c.id || c.name)));
}

export async function getCustomerFolderDetails(idOrName) {
  const data = await loadData();
  const customer = (data.customers || []).find(c =>
    c.id === idOrName || c.name.toLowerCase() === idOrName.toLowerCase()
  );
  if (!customer) return null;

  const sales = (data.sales || []).filter(s => s.customerName.toLowerCase() === customer.name.toLowerCase());
  const payments = (data.payments || []).filter(p =>
    p.type === 'customer_collection' && p.partyName.toLowerCase() === customer.name.toLowerCase()
  );

  let totalSoldAmount = 0, initialReceivedAmount = 0, tissueSoldQty = 0, cuttingSoldQty = 0;
  sales.forEach(s => {
    totalSoldAmount += Number(s.grandTotal || 0);
    initialReceivedAmount += Number(s.receivedAmount || 0);
    (s.items || []).forEach(item => {
      if (item.productType === 'tissue') tissueSoldQty += Number(item.quantity || 0);
      if (item.productType === 'cutting_news') cuttingSoldQty += Number(item.quantity || 0);
    });
  });

  const laterCollectedAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalCollected = initialReceivedAmount + laterCollectedAmount;
  const netDue = Math.max(0, totalSoldAmount - totalCollected);

  const ledgerHistory = [
    ...sales.map(s => ({
      id: s.id, date: s.date || s.createdAt, type: 'sale', typeLabel: 'মাল বিক্রয় (চালান)',
      billedAmount: Number(s.grandTotal || 0), paidAmount: Number(s.receivedAmount || 0),
      dueAmount: Number(s.dueAmount || 0), notes: s.notes || '', items: s.items || [], raw: s
    })),
    ...payments.map(p => ({
      id: p.id, date: p.date || p.createdAt, type: 'payment', typeLabel: 'টাকা জমা (রশিদ)',
      billedAmount: 0, paidAmount: Number(p.amount || 0), dueAmount: 0,
      notes: p.notes || '', items: [], raw: p
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    customer,
    summary: {
      totalSoldAmount, initialReceivedAmount, laterCollectedAmount, totalCollected, netDue,
      tissueSoldQty, cuttingSoldQty, invoicesCount: sales.length, paymentsCount: payments.length,
      firstTxnDate: sales.slice(-1)[0]?.date || customer.createdAt,
      lastTxnDate: ledgerHistory[0]?.date || customer.createdAt
    },
    sales, payments, ledgerHistory
  };
}

export async function getAllSupplierFolders() {
  const data = await loadData();
  return Promise.all((data.suppliers || []).map(s => getSupplierFolderDetails(s.id || s.name)));
}

export async function getSupplierFolderDetails(idOrName) {
  const data = await loadData();
  const supplier = (data.suppliers || []).find(s =>
    s.id === idOrName || s.name.toLowerCase() === idOrName.toLowerCase()
  );
  if (!supplier) return null;

  const purchases = (data.purchases || []).filter(p => p.supplierName.toLowerCase() === supplier.name.toLowerCase());
  const payments = (data.payments || []).filter(p =>
    p.type === 'supplier_payment' && p.partyName.toLowerCase() === supplier.name.toLowerCase()
  );

  let totalPurchasedAmount = 0, initialPaidAmount = 0, tissuePurchasedQty = 0, cuttingPurchasedQty = 0;
  purchases.forEach(p => {
    totalPurchasedAmount += Number(p.grandTotal || 0);
    initialPaidAmount += Number(p.paidAmount || 0);
    (p.items || []).forEach(item => {
      if (item.productType === 'tissue') tissuePurchasedQty += Number(item.quantity || 0);
      if (item.productType === 'cutting_news') cuttingPurchasedQty += Number(item.quantity || 0);
    });
  });

  const laterPaidAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPaid = initialPaidAmount + laterPaidAmount;
  const netDue = Math.max(0, totalPurchasedAmount - totalPaid);

  const ledgerHistory = [
    ...purchases.map(p => ({
      id: p.id, date: p.date || p.createdAt, type: 'purchase', typeLabel: 'পেপার ক্রয় (চালান)',
      billedAmount: Number(p.grandTotal || 0), paidAmount: Number(p.paidAmount || 0),
      dueAmount: Number(p.dueAmount || 0), notes: p.notes || '', items: p.items || [], raw: p
    })),
    ...payments.map(p => ({
      id: p.id, date: p.date || p.createdAt, type: 'payment', typeLabel: 'দেনা পরিশোধ (ভাউচার)',
      billedAmount: 0, paidAmount: Number(p.amount || 0), dueAmount: 0,
      notes: p.notes || '', items: [], raw: p
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    supplier,
    summary: {
      totalPurchasedAmount, initialPaidAmount, laterPaidAmount, totalPaid, netDue,
      tissuePurchasedQty, cuttingPurchasedQty, invoicesCount: purchases.length, paymentsCount: payments.length,
      firstTxnDate: purchases.slice(-1)[0]?.date || supplier.createdAt,
      lastTxnDate: ledgerHistory[0]?.date || supplier.createdAt
    },
    purchases, payments, ledgerHistory
  };
}

// ==========================================
// TRANSACTIONS - SUPABASE FIRST
// ==========================================
export async function addPurchase(purchaseData) {
  await ensureSupplierExists(purchaseData.supplierName, purchaseData.supplierPhone, purchaseData.supplierAddress);

  const id = purchaseData.id || `PUR-${Date.now().toString().slice(-6)}`;
  const record = { ...purchaseData, id, createdAt: purchaseData.createdAt || new Date().toISOString() };

  await supabaseUpsert('purchases', {
    id: record.id, date: record.date, supplier_name: record.supplierName,
    supplier_phone: record.supplierPhone || '', supplier_address: record.supplierAddress || '',
    items: record.items || [], sub_total: record.subTotal || 0, discount: record.discount || 0,
    grand_total: record.grandTotal || 0, paid_amount: record.paidAmount || 0,
    due_amount: record.dueAmount || 0, payment_method: record.paymentMethod || 'ক্যাশ',
    notes: record.notes || '', created_at: record.createdAt
  });

  if (!IS_VERCEL && localFallbackAvailable) {
    const localData = loadLocalData();
    localData.purchases = localData.purchases || [];
    localData.purchases.push(record);
    saveLocalData(localData);
  }
  return record;
}

export async function deletePurchase(id) {
  const ok = await supabaseDelete('purchases', id);
  if (!IS_VERCEL && localFallbackAvailable) {
    const localData = loadLocalData();
    const idx = (localData.purchases || []).findIndex(p => p.id === id);
    if (idx !== -1) { localData.purchases.splice(idx, 1); saveLocalData(localData); }
  }
  return ok;
}

export async function addSale(saleData) {
  await ensureCustomerExists(saleData.customerName, saleData.customerPhone, saleData.customerAddress);

  const id = saleData.id || `INV-${Date.now().toString().slice(-6)}`;
  const record = { ...saleData, id, createdAt: saleData.createdAt || new Date().toISOString() };

  await supabaseUpsert('sales', {
    id: record.id, date: record.date, customer_name: record.customerName,
    customer_phone: record.customerPhone || '', customer_address: record.customerAddress || '',
    items: record.items || [], sub_total: record.subTotal || 0, discount: record.discount || 0,
    grand_total: record.grandTotal || 0, received_amount: record.receivedAmount || 0,
    due_amount: record.dueAmount || 0, payment_method: record.paymentMethod || 'ক্যাশ',
    notes: record.notes || '', created_at: record.createdAt
  });

  if (!IS_VERCEL && localFallbackAvailable) {
    const localData = loadLocalData();
    localData.sales = localData.sales || [];
    localData.sales.push(record);
    saveLocalData(localData);
  }
  return record;
}

export async function deleteSale(id) {
  const ok = await supabaseDelete('sales', id);
  if (!IS_VERCEL && localFallbackAvailable) {
    const localData = loadLocalData();
    const idx = (localData.sales || []).findIndex(s => s.id === id);
    if (idx !== -1) { localData.sales.splice(idx, 1); saveLocalData(localData); }
  }
  return ok;
}

export async function addPayment(paymentData) {
  const id = paymentData.id || `PAY-${Date.now().toString().slice(-6)}`;
  const record = { ...paymentData, id, createdAt: paymentData.createdAt || new Date().toISOString() };

  await supabaseUpsert('payments', {
    id: record.id, type: record.type, party_name: record.partyName,
    party_phone: record.partyPhone || '', amount: record.amount || 0, date: record.date,
    payment_method: record.paymentMethod || 'ক্যাশ', notes: record.notes || '',
    created_at: record.createdAt
  });

  if (!IS_VERCEL && localFallbackAvailable) {
    const localData = loadLocalData();
    localData.payments = localData.payments || [];
    localData.payments.push(record);
    saveLocalData(localData);
  }
  return record;
}

// ==========================================
// SQL EXPORT
// ==========================================
export async function exportAsSql() {
  const data = await loadData();
  let sql = `-- RS Paper and Packaging - SQL Export\n-- Generated: ${new Date().toISOString()}\n\n`;

  sql += `-- Customers\n`;
  (data.customers || []).forEach(c => {
    sql += `INSERT INTO customers (id, name, phone, address, created_at) VALUES ('${c.id}', '${(c.name||'').replace(/'/g,"''")}', '${c.phone||''}', '${(c.address||'').replace(/'/g,"''")}', '${c.createdAt}');\n`;
  });

  sql += `\n-- Suppliers\n`;
  (data.suppliers || []).forEach(s => {
    sql += `INSERT INTO suppliers (id, name, phone, address, created_at) VALUES ('${s.id}', '${(s.name||'').replace(/'/g,"''")}', '${s.phone||''}', '${(s.address||'').replace(/'/g,"''")}', '${s.createdAt}');\n`;
  });

  return sql;
}
