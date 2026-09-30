import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'factory_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Background sync helper to mirror changes to Supabase cloud if connected
async function syncToSupabaseAsync(table, payload, action = 'upsert') {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    if (action === 'upsert') {
      await supabase.from(table).upsert(payload);
    } else if (action === 'delete') {
      await supabase.from(table).delete().eq('id', payload.id);
    }
  } catch (err) {
    console.warn(`Supabase sync warning (${table}):`, err.message);
  }
}

const DEFAULT_DATA = {
  company: {
    name: 'RS Paper and Packaging',
    tagline: 'গুণগত মানের সেরা পেপার প্রস্তুতকারক ও সরবরাহকারী',
    address: 'পেপার মিল রোড, ঢাকা, বাংলাদেশ',
    phone: '০১৭০০-০০০০০০, ০১৮০০-০০০০০০',
    email: 'contact@rspaperpackaging.com',
  },
  customers: [
    {
      id: 'CUST-101',
      name: 'মেসার্স আল-আমিন প্রিন্টার্স',
      phone: '01819988776',
      address: 'আরামবাগ, ঢাকা',
      createdAt: '2026-09-28T10:00:00.000Z'
    },
    {
      id: 'CUST-102',
      name: 'ফারিক পেপার্স',
      phone: '01712345678',
      address: 'চকবাজার, ঢাকা',
      createdAt: '2026-09-28T12:00:00.000Z'
    }
  ],
  suppliers: [
    {
      id: 'SUPP-101',
      name: 'যমুনা পেপার মিলস লিঃ',
      phone: '01711223344',
      address: 'নারায়ণগঞ্জ',
      createdAt: '2026-09-28T09:00:00.000Z'
    }
  ],
  purchases: [
    {
      id: 'PUR-000101',
      date: '2026-09-28',
      supplierName: 'যমুনা পেপার মিলস লিঃ',
      supplierPhone: '01711223344',
      supplierAddress: 'নারায়ণগঞ্জ',
      items: [
        {
          productType: 'tissue',
          name: 'Tissue Paper',
          quantity: 2500,
          unit: 'কেজি',
          rate: 110,
          total: 275000
        },
        {
          productType: 'cutting_news',
          name: 'Cutting / News Paper',
          quantity: 4000,
          unit: 'কেজি',
          rate: 65,
          total: 260000
        }
      ],
      subTotal: 535000,
      discount: 5000,
      grandTotal: 530000,
      paidAmount: 350000,
      dueAmount: 180000,
      paymentMethod: 'ব্যাংক চেক',
      notes: 'চালান নং #১',
      createdAt: '2026-09-28T09:30:00.000Z'
    }
  ],
  sales: [
    {
      id: 'INV-000501',
      date: '2026-09-28',
      customerName: 'মেসার্স আল-আমিন প্রিন্টার্স',
      customerPhone: '01819988776',
      customerAddress: 'আরামবাগ, ঢাকা',
      items: [
        {
          productType: 'tissue',
          name: 'Tissue Paper',
          quantity: 800,
          unit: 'কেজি',
          rate: 135,
          total: 108000
        },
        {
          productType: 'cutting_news',
          name: 'Cutting / News Paper',
          quantity: 1500,
          unit: 'কেজি',
          rate: 80,
          total: 120000
        }
      ],
      subTotal: 228000,
      discount: 3000,
      grandTotal: 225000,
      receivedAmount: 150000,
      dueAmount: 75000,
      paymentMethod: 'ক্যাশ',
      notes: '৫০% ক্যাশ এবং বাকি আগামী সপ্তাহে পরিশোধ করবে',
      createdAt: '2026-09-28T11:00:00.000Z'
    },
    {
      id: 'INV-014248',
      date: '2026-09-29',
      customerName: 'ফারিক পেপার্স',
      customerPhone: '01712345678',
      customerAddress: 'চকবাজার, ঢাকা',
      items: [
        {
          productType: 'tissue',
          name: 'Tissue Paper',
          quantity: 500,
          unit: 'কেজি',
          rate: 135,
          total: 67500
        }
      ],
      subTotal: 67500,
      discount: 500,
      grandTotal: 67000,
      receivedAmount: 40000,
      dueAmount: 27000,
      paymentMethod: 'ক্যাশ',
      notes: 'টিস্যু ডেলিভারি সম্পন্ন',
      createdAt: '2026-09-29T14:00:00.000Z'
    }
  ],
  payments: [
    {
      id: 'PAY-100001',
      type: 'customer_collection',
      partyName: 'মেসার্স আল-আমিন প্রিন্টার্স',
      partyPhone: '01819988776',
      amount: 25000,
      date: '2026-09-29',
      paymentMethod: 'ক্যাশ',
      notes: 'বাকি বিল থেকে আংশিক জমা',
      createdAt: '2026-09-29T16:00:00.000Z'
    }
  ]
};

export function loadData() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      saveData(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.customers) data.customers = DEFAULT_DATA.customers;
    if (!data.suppliers) data.suppliers = DEFAULT_DATA.suppliers;
    if (!data.purchases) data.purchases = [];
    if (!data.sales) data.sales = [];
    if (!data.payments) data.payments = [];
    return data;
  } catch (err) {
    console.error('Error loading DB file:', err);
    return DEFAULT_DATA;
  }
}

export function saveData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving DB file:', err);
    return false;
  }
}

// ==========================================
// 1. GODOWN STOCK & STATISTICS CALCULATION
// ==========================================
export function getGodownStock() {
  const data = loadData();
  const purchases = data.purchases || [];
  const sales = data.sales || [];

  let tissue = {
    purchasedQty: 0,
    purchasedCost: 0,
    soldQty: 0,
    soldRevenue: 0,
    currentStock: 0,
    avgPurchaseRate: 0,
    estimatedStockValue: 0
  };

  let cuttingNews = {
    purchasedQty: 0,
    purchasedCost: 0,
    soldQty: 0,
    soldRevenue: 0,
    currentStock: 0,
    avgPurchaseRate: 0,
    estimatedStockValue: 0
  };

  purchases.forEach(p => {
    (p.items || []).forEach(item => {
      const qty = Number(item.quantity || 0);
      const total = Number(item.total || 0);
      if (item.productType === 'tissue') {
        tissue.purchasedQty += qty;
        tissue.purchasedCost += total;
      } else if (item.productType === 'cutting_news') {
        cuttingNews.purchasedQty += qty;
        cuttingNews.purchasedCost += total;
      }
    });
  });

  sales.forEach(s => {
    (s.items || []).forEach(item => {
      const qty = Number(item.quantity || 0);
      const total = Number(item.total || 0);
      if (item.productType === 'tissue') {
        tissue.soldQty += qty;
        tissue.soldRevenue += total;
      } else if (item.productType === 'cutting_news') {
        cuttingNews.soldQty += qty;
        cuttingNews.soldRevenue += total;
      }
    });
  });

  tissue.currentStock = tissue.purchasedQty - tissue.soldQty;
  tissue.avgPurchaseRate = tissue.purchasedQty > 0 ? (tissue.purchasedCost / tissue.purchasedQty) : 0;
  tissue.estimatedStockValue = Math.max(0, tissue.currentStock) * tissue.avgPurchaseRate;

  cuttingNews.currentStock = cuttingNews.purchasedQty - cuttingNews.soldQty;
  cuttingNews.avgPurchaseRate = cuttingNews.purchasedQty > 0 ? (cuttingNews.purchasedCost / cuttingNews.purchasedQty) : 0;
  cuttingNews.estimatedStockValue = Math.max(0, cuttingNews.currentStock) * cuttingNews.avgPurchaseRate;

  return {
    tissue,
    cuttingNews,
    totalStockValue: tissue.estimatedStockValue + cuttingNews.estimatedStockValue
  };
}

export function getDashboardStats() {
  const data = loadData();
  const stock = getGodownStock();
  const customers = getAllCustomerFolders();
  const suppliers = getAllSupplierFolders();

  const totalCustomerReceivable = customers.reduce((sum, c) => sum + (c.summary.netDue || 0), 0);
  const totalSupplierPayable = suppliers.reduce((sum, s) => sum + (s.summary.netDue || 0), 0);

  const totalSaleAmount = (data.sales || []).reduce((sum, s) => sum + Number(s.grandTotal || 0), 0);
  const totalPurchaseAmount = (data.purchases || []).reduce((sum, p) => sum + Number(p.grandTotal || 0), 0);

  const totalSaleReceived = (data.sales || []).reduce((sum, s) => sum + Number(s.receivedAmount || 0), 0) +
    (data.payments || []).filter(p => p.type === 'customer_collection').reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalPurchasePaid = (data.purchases || []).reduce((sum, p) => sum + Number(p.paidAmount || 0), 0) +
    (data.payments || []).filter(p => p.type === 'supplier_payment').reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return {
    stock,
    finance: {
      totalPurchaseAmount,
      totalPurchasePaid,
      totalSupplierPayable,
      totalSaleAmount,
      totalSaleReceived,
      totalCustomerReceivable,
      netCashFlow: totalSaleReceived - totalPurchasePaid
    },
    counts: {
      customersCount: customers.length,
      suppliersCount: suppliers.length,
      purchasesCount: (data.purchases || []).length,
      salesCount: (data.sales || []).length
    }
  };
}

// ==========================================
// 2. CUSTOMER FOLDERS & ACCOUNTS (অ্যাপের ভিতরের খাতা)
// ==========================================
export function ensureCustomerExists(name, phone = '', address = '') {
  const data = loadData();
  const trimmedName = name.trim();
  let customer = (data.customers || []).find(c => c.name.toLowerCase() === trimmedName.toLowerCase());

  if (!customer) {
    customer = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      name: trimmedName,
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      createdAt: new Date().toISOString()
    };
    data.customers.push(customer);
    saveData(data);
  } else if ((phone && !customer.phone) || (address && !customer.address)) {
    if (phone) customer.phone = phone.trim();
    if (address) customer.address = address.trim();
    saveData(data);
  }

  if (customer) {
    syncToSupabaseAsync('customers', {
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      created_at: customer.createdAt || new Date().toISOString()
    });
  }

  return customer;
}

export function getAllCustomerFolders() {
  const data = loadData();
  const customers = data.customers || [];
  return customers.map(c => getCustomerFolderDetails(c.id || c.name));
}

export function getCustomerFolderDetails(idOrName) {
  const data = loadData();
  const customer = (data.customers || []).find(c => c.id === idOrName || c.name.toLowerCase() === idOrName.toLowerCase());
  if (!customer) return null;

  // Filter sales & payments for this customer
  const sales = (data.sales || []).filter(s => s.customerName.toLowerCase() === customer.name.toLowerCase());
  const payments = (data.payments || []).filter(p => p.type === 'customer_collection' && p.partyName.toLowerCase() === customer.name.toLowerCase());

  let totalSoldAmount = 0;
  let initialReceivedAmount = 0;
  let dueFromSales = 0;
  let tissueSoldQty = 0;
  let cuttingSoldQty = 0;

  sales.forEach(s => {
    totalSoldAmount += Number(s.grandTotal || 0);
    initialReceivedAmount += Number(s.receivedAmount || 0);
    dueFromSales += Number(s.dueAmount || 0);

    (s.items || []).forEach(item => {
      if (item.productType === 'tissue') tissueSoldQty += Number(item.quantity || 0);
      if (item.productType === 'cutting_news') cuttingSoldQty += Number(item.quantity || 0);
    });
  });

  const laterCollectedAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalCollected = initialReceivedAmount + laterCollectedAmount;
  const netDue = Math.max(0, totalSoldAmount - totalCollected);

  // Chronological ledger statement entries
  const ledgerHistory = [];

  sales.forEach(s => {
    ledgerHistory.push({
      id: s.id,
      date: s.date || s.createdAt,
      type: 'sale',
      typeLabel: 'মাল বিক্রয় (চালান)',
      description: (s.items || []).map(i => `${i.name}: ${i.quantity} ${i.unit || 'কেজি'} @ ৳${i.rate}`).join(', '),
      billedAmount: Number(s.grandTotal || 0),
      paidAmount: Number(s.receivedAmount || 0),
      dueAmount: Number(s.dueAmount || 0),
      notes: s.notes || '',
      items: s.items || [],
      raw: s
    });
  });

  payments.forEach(p => {
    ledgerHistory.push({
      id: p.id,
      date: p.date || p.createdAt,
      type: 'payment',
      typeLabel: 'টাকা জমা (রশিদ)',
      description: `পরিশোধের মাধ্যম: ${p.paymentMethod || 'ক্যাশ'}`,
      billedAmount: 0,
      paidAmount: Number(p.amount || 0),
      dueAmount: 0,
      notes: p.notes || '',
      items: [],
      raw: p
    });
  });

  // Sort chronological newest first
  ledgerHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    customer,
    summary: {
      totalSoldAmount,
      initialReceivedAmount,
      laterCollectedAmount,
      totalCollected,
      netDue,
      tissueSoldQty,
      cuttingSoldQty,
      invoicesCount: sales.length,
      paymentsCount: payments.length,
      firstTxnDate: sales.slice(-1)[0]?.date || customer.createdAt,
      lastTxnDate: ledgerHistory[0]?.date || customer.createdAt
    },
    sales,
    payments,
    ledgerHistory
  };
}

// ==========================================
// 3. SUPPLIER FOLDERS & ACCOUNTS (অ্যাপের ভিতরের খাতা)
// ==========================================
export function ensureSupplierExists(name, phone = '', address = '') {
  const data = loadData();
  const trimmedName = name.trim();
  let supplier = (data.suppliers || []).find(s => s.name.toLowerCase() === trimmedName.toLowerCase());

  if (!supplier) {
    supplier = {
      id: `SUPP-${Date.now().toString().slice(-4)}`,
      name: trimmedName,
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      createdAt: new Date().toISOString()
    };
    data.suppliers.push(supplier);
    saveData(data);
  } else if ((phone && !supplier.phone) || (address && !supplier.address)) {
    if (phone) supplier.phone = phone.trim();
    if (address) supplier.address = address.trim();
    saveData(data);
  }

  if (supplier) {
    syncToSupabaseAsync('suppliers', {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone || '',
      address: supplier.address || '',
      created_at: supplier.createdAt || new Date().toISOString()
    });
  }

  return supplier;
}

export function getAllSupplierFolders() {
  const data = loadData();
  const suppliers = data.suppliers || [];
  return suppliers.map(s => getSupplierFolderDetails(s.id || s.name));
}

export function getSupplierFolderDetails(idOrName) {
  const data = loadData();
  const supplier = (data.suppliers || []).find(s => s.id === idOrName || s.name.toLowerCase() === idOrName.toLowerCase());
  if (!supplier) return null;

  const purchases = (data.purchases || []).filter(p => p.supplierName.toLowerCase() === supplier.name.toLowerCase());
  const payments = (data.payments || []).filter(p => p.type === 'supplier_payment' && p.partyName.toLowerCase() === supplier.name.toLowerCase());

  let totalPurchasedAmount = 0;
  let initialPaidAmount = 0;
  let dueFromPurchases = 0;
  let tissuePurchasedQty = 0;
  let cuttingPurchasedQty = 0;

  purchases.forEach(p => {
    totalPurchasedAmount += Number(p.grandTotal || 0);
    initialPaidAmount += Number(p.paidAmount || 0);
    dueFromPurchases += Number(p.dueAmount || 0);

    (p.items || []).forEach(item => {
      if (item.productType === 'tissue') tissuePurchasedQty += Number(item.quantity || 0);
      if (item.productType === 'cutting_news') cuttingPurchasedQty += Number(item.quantity || 0);
    });
  });

  const laterPaidAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPaid = initialPaidAmount + laterPaidAmount;
  const netDue = Math.max(0, totalPurchasedAmount - totalPaid);

  const ledgerHistory = [];

  purchases.forEach(p => {
    ledgerHistory.push({
      id: p.id,
      date: p.date || p.createdAt,
      type: 'purchase',
      typeLabel: 'মাল ক্রয় (চালান)',
      description: (p.items || []).map(i => `${i.name}: ${i.quantity} ${i.unit || 'কেজি'} @ ৳${i.rate}`).join(', '),
      billedAmount: Number(p.grandTotal || 0),
      paidAmount: Number(p.paidAmount || 0),
      dueAmount: Number(p.dueAmount || 0),
      notes: p.notes || '',
      items: p.items || [],
      raw: p
    });
  });

  payments.forEach(p => {
    ledgerHistory.push({
      id: p.id,
      date: p.date || p.createdAt,
      type: 'payment',
      typeLabel: 'দেনা পরিশোধ (ভাউচার)',
      description: `পরিশোধের মাধ্যম: ${p.paymentMethod || 'ক্যাশ'}`,
      billedAmount: 0,
      paidAmount: Number(p.amount || 0),
      dueAmount: 0,
      notes: p.notes || '',
      items: [],
      raw: p
    });
  });

  ledgerHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    supplier,
    summary: {
      totalPurchasedAmount,
      initialPaidAmount,
      laterPaidAmount,
      totalPaid,
      netDue,
      tissuePurchasedQty,
      cuttingPurchasedQty,
      invoicesCount: purchases.length,
      paymentsCount: payments.length,
      firstTxnDate: purchases.slice(-1)[0]?.date || supplier.createdAt,
      lastTxnDate: ledgerHistory[0]?.date || supplier.createdAt
    },
    purchases,
    payments,
    ledgerHistory
  };
}

// ==========================================
// 4. TRANSACTIONS MANAGEMENT
// ==========================================
export function addPurchase(purchaseData) {
  const data = loadData();

  // Ensure supplier account exists in app
  ensureSupplierExists(purchaseData.supplierName, purchaseData.supplierPhone, purchaseData.supplierAddress);

  const id = purchaseData.id || `PUR-${Date.now().toString().slice(-6)}`;
  const record = {
    ...purchaseData,
    id,
    createdAt: purchaseData.createdAt || new Date().toISOString()
  };

  data.purchases = data.purchases || [];
  data.purchases.push(record);
  saveData(data);

  syncToSupabaseAsync('purchases', {
    id: record.id,
    date: record.date,
    supplier_name: record.supplierName,
    supplier_phone: record.supplierPhone || '',
    supplier_address: record.supplierAddress || '',
    items: record.items || [],
    sub_total: record.subTotal || 0,
    discount: record.discount || 0,
    grand_total: record.grandTotal || 0,
    paid_amount: record.paidAmount || 0,
    due_amount: record.dueAmount || 0,
    payment_method: record.paymentMethod || 'ক্যাশ',
    notes: record.notes || '',
    created_at: record.createdAt || new Date().toISOString()
  });

  return record;
}

export function deletePurchase(id) {
  const data = loadData();
  const idx = (data.purchases || []).findIndex(p => p.id === id);
  if (idx !== -1) {
    data.purchases.splice(idx, 1);
    saveData(data);
    syncToSupabaseAsync('purchases', { id }, 'delete');
    return true;
  }
  return false;
}

export function addSale(saleData) {
  const data = loadData();

  // Ensure customer account exists in app
  ensureCustomerExists(saleData.customerName, saleData.customerPhone, saleData.customerAddress);

  const id = saleData.id || `INV-${Date.now().toString().slice(-6)}`;
  const record = {
    ...saleData,
    id,
    createdAt: saleData.createdAt || new Date().toISOString()
  };

  data.sales = data.sales || [];
  data.sales.push(record);
  saveData(data);

  syncToSupabaseAsync('sales', {
    id: record.id,
    date: record.date,
    customer_name: record.customerName,
    customer_phone: record.customerPhone || '',
    customer_address: record.customerAddress || '',
    items: record.items || [],
    sub_total: record.subTotal || 0,
    discount: record.discount || 0,
    grand_total: record.grandTotal || 0,
    received_amount: record.receivedAmount || 0,
    due_amount: record.dueAmount || 0,
    payment_method: record.paymentMethod || 'ক্যাশ',
    notes: record.notes || '',
    created_at: record.createdAt || new Date().toISOString()
  });

  return record;
}

export function deleteSale(id) {
  const data = loadData();
  const idx = (data.sales || []).findIndex(s => s.id === id);
  if (idx !== -1) {
    data.sales.splice(idx, 1);
    saveData(data);
    syncToSupabaseAsync('sales', { id }, 'delete');
    return true;
  }
  return false;
}

export function addPayment(paymentData) {
  const data = loadData();
  const id = paymentData.id || `PAY-${Date.now().toString().slice(-6)}`;
  const record = {
    ...paymentData,
    id,
    createdAt: paymentData.createdAt || new Date().toISOString()
  };

  data.payments = data.payments || [];
  data.payments.push(record);
  saveData(data);

  syncToSupabaseAsync('payments', {
    id: record.id,
    type: record.type,
    party_name: record.partyName,
    party_phone: record.partyPhone || '',
    amount: record.amount || 0,
    date: record.date,
    payment_method: record.paymentMethod || 'ক্যাশ',
    notes: record.notes || '',
    created_at: record.createdAt || new Date().toISOString()
  });

  return record;
}

// ==========================================
// 5. SQL DATABASE EXPORT (For future DB connection)
// ==========================================
export function exportAsSql() {
  const data = loadData();
  const customers = data.customers || [];
  const suppliers = data.suppliers || [];
  const purchases = data.purchases || [];
  const sales = data.sales || [];

  let sql = `-- =========================================================\n`;
  sql += `-- RS Paper and Packaging - SQL Database Dump\n`;
  sql += `-- Generated on ${new Date().toISOString()}\n`;
  sql += `-- =========================================================\n\n`;

  sql += `-- Customers Table\n`;
  customers.forEach(c => {
    sql += `INSERT INTO customers (id, name, phone, address, created_at) VALUES ('${c.id}', '${(c.name || '').replace(/'/g, "''")}', '${c.phone || ''}', '${(c.address || '').replace(/'/g, "''")}', '${c.createdAt}');\n`;
  });

  sql += `\n-- Suppliers Table\n`;
  suppliers.forEach(s => {
    sql += `INSERT INTO suppliers (id, name, phone, address, created_at) VALUES ('${s.id}', '${(s.name || '').replace(/'/g, "''")}', '${s.phone || ''}', '${(s.address || '').replace(/'/g, "''")}', '${s.createdAt}');\n`;
  });

  sql += `\n-- Purchases Table\n`;
  purchases.forEach(p => {
    sql += `INSERT INTO purchases (id, supplier_name, supplier_phone, date, grand_total, paid_amount, due_amount, payment_method, notes) VALUES ('${p.id}', '${(p.supplierName || '').replace(/'/g, "''")}', '${p.supplierPhone || ''}', '${p.date}', ${p.grandTotal || 0}, ${p.paidAmount || 0}, ${p.dueAmount || 0}, '${p.paymentMethod || 'ক্যাশ'}', '${(p.notes || '').replace(/'/g, "''")}');\n`;
  });

  sql += `\n-- Sales Table\n`;
  sales.forEach(s => {
    sql += `INSERT INTO sales (id, customer_name, customer_phone, date, grand_total, received_amount, due_amount, payment_method, notes) VALUES ('${s.id}', '${(s.customerName || '').replace(/'/g, "''")}', '${s.customerPhone || ''}', '${s.date}', ${s.grandTotal || 0}, ${s.receivedAmount || 0}, ${s.dueAmount || 0}, '${s.paymentMethod || 'ক্যাশ'}', '${(s.notes || '').replace(/'/g, "''")}');\n`;
  });

  return sql;
}
