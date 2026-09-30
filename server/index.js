import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  loadData,
  saveData,
  getGodownStock,
  getDashboardStats,
  getAllCustomerFolders,
  getCustomerFolderDetails,
  ensureCustomerExists,
  getAllSupplierFolders,
  getSupplierFolderDetails,
  ensureSupplierExists,
  addPurchase,
  deletePurchase,
  addSale,
  deleteSale,
  addPayment,
  exportAsSql
} from './db.js';
import { getSupabaseConfigStatus } from './supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static assets from dist if built
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
}

// 1. Dashboard summary & Stats
app.get('/api/dashboard', (req, res) => {
  try {
    const stats = getDashboardStats();
    const data = loadData();
    res.json({
      success: true,
      stats,
      recentPurchases: (data.purchases || []).slice(-5).reverse(),
      recentSales: (data.sales || []).slice(-5).reverse(),
      company: data.company
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Godown Stock API (Tissue & Cutting/News Paper)
app.get('/api/stock', (req, res) => {
  try {
    const stock = getGodownStock();
    res.json({ success: true, stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seed / Sample healthcheck
app.post('/api/seed-sample', (req, res) => {
  res.json({ success: true, message: 'Sample data checked' });
});

// Helper for flattened customer representation
function formatFlatCustomer(folder) {
  if (!folder || !folder.customer) return null;
  return {
    id: folder.customer.id,
    name: folder.customer.name,
    phone: folder.customer.phone,
    address: folder.customer.address,
    createdAt: folder.customer.createdAt,
    ...folder.summary,
    salesCount: (folder.sales || []).length,
    paymentsCount: (folder.payments || []).length
  };
}

// Helper for flattened supplier representation
function formatFlatSupplier(folder) {
  if (!folder || !folder.supplier) return null;
  return {
    id: folder.supplier.id,
    name: folder.supplier.name,
    phone: folder.supplier.phone,
    address: folder.supplier.address,
    createdAt: folder.supplier.createdAt,
    ...folder.summary,
    purchasesCount: (folder.purchases || []).length,
    paymentsCount: (folder.payments || []).length
  };
}

// 3. Customer Digital Accounts (অ্যাপের ভেতরের কাস্টমার খাতা)
app.get('/api/customers', (req, res) => {
  try {
    const folders = getAllCustomerFolders();
    const customers = folders.map(formatFlatCustomer).filter(Boolean);
    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ledger View compatibility route
app.get('/api/ledger/customers', (req, res) => {
  try {
    const folders = getAllCustomerFolders();
    const customers = folders.map(formatFlatCustomer).filter(Boolean);
    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/customers/:id', (req, res) => {
  try {
    const folder = getCustomerFolderDetails(req.params.id);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'কাস্টমার খাতা পাওয়া যায়নি' });
    }
    res.json({
      success: true,
      profile: folder.customer,
      ...folder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'কাস্টমারের নাম আবশ্যক' });
    }
    const customer = ensureCustomerExists(name, phone, address);
    res.json({ success: true, message: 'নতুন কাস্টমার খাতা সফলভাবে তৈরি হয়েছে', customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Supplier Digital Accounts (অ্যাপের ভেতরের সাপ্লায়ার খাতা)
app.get('/api/suppliers', (req, res) => {
  try {
    const folders = getAllSupplierFolders();
    const suppliers = folders.map(formatFlatSupplier).filter(Boolean);
    res.json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ledger View compatibility route
app.get('/api/ledger/suppliers', (req, res) => {
  try {
    const folders = getAllSupplierFolders();
    const suppliers = folders.map(formatFlatSupplier).filter(Boolean);
    res.json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/suppliers/:id', (req, res) => {
  try {
    const folder = getSupplierFolderDetails(req.params.id);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'সাপ্লায়ার খাতা পাওয়া যায়নি' });
    }
    res.json({
      success: true,
      profile: folder.supplier,
      ...folder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/suppliers', (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'সাপ্লায়ারের নাম আবশ্যক' });
    }
    const supplier = ensureSupplierExists(name, phone, address);
    res.json({ success: true, message: 'নতুন সাপ্লায়ার খাতা সফলভাবে তৈরি হয়েছে', supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Purchases API
app.get('/api/purchases', (req, res) => {
  try {
    const data = loadData();
    const list = [...(data.purchases || [])].reverse();
    res.json({ success: true, purchases: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/purchases', (req, res) => {
  try {
    const {
      date,
      supplierName,
      supplierPhone,
      supplierAddress,
      items,
      discount = 0,
      paidAmount = 0,
      paymentMethod = 'ক্যাশ',
      notes = ''
    } = req.body;

    if (!supplierName || !date || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'সাপ্লায়ার নাম, তারিখ এবং পণ্যের বিবরণ আবশ্যক!' });
    }

    const calculatedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return {
        productType: item.productType,
        name: item.name || (item.productType === 'tissue' ? 'Tissue Paper' : 'Cutting / News Paper'),
        quantity: qty,
        unit: item.unit || 'কেজি',
        rate: rate,
        total: Math.round(qty * rate * 100) / 100
      };
    });

    const subTotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
    const disc = parseFloat(discount) || 0;
    const grandTotal = Math.max(0, subTotal - disc);
    const paid = parseFloat(paidAmount) || 0;
    const dueAmount = Math.max(0, grandTotal - paid);

    const newPurchase = addPurchase({
      date,
      supplierName: supplierName.trim(),
      supplierPhone: (supplierPhone || '').trim(),
      supplierAddress: (supplierAddress || '').trim(),
      items: calculatedItems,
      subTotal,
      discount: disc,
      grandTotal,
      paidAmount: paid,
      dueAmount,
      paymentMethod,
      notes
    });

    res.json({
      success: true,
      message: 'ক্রয় এন্ট্রি সম্পন্ন ও সাপ্লায়ারের খাতায় সংরক্ষিত হয়েছে',
      purchase: newPurchase,
      stock: getGodownStock()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/purchases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deletePurchase(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'ক্রয় রেকর্ড পাওয়া যায়নি' });
    }
    res.json({ success: true, message: 'রেকর্ড মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Sales API
app.get('/api/sales', (req, res) => {
  try {
    const data = loadData();
    const list = [...(data.sales || [])].reverse();
    res.json({ success: true, sales: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/sales', (req, res) => {
  try {
    const {
      date,
      customerName,
      customerPhone,
      customerAddress,
      items,
      discount = 0,
      receivedAmount = 0,
      paymentMethod = 'ক্যাশ',
      notes = ''
    } = req.body;

    if (!customerName || !date || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'কাস্টমার নাম, তারিখ এবং পণ্যের বিবরণ আবশ্যক!' });
    }

    const calculatedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return {
        productType: item.productType,
        name: item.name || (item.productType === 'tissue' ? 'Tissue Paper' : 'Cutting / News Paper'),
        quantity: qty,
        unit: item.unit || 'কেজি',
        rate: rate,
        total: Math.round(qty * rate * 100) / 100
      };
    });

    const subTotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
    const disc = parseFloat(discount) || 0;
    const grandTotal = Math.max(0, subTotal - disc);
    const received = parseFloat(receivedAmount) || 0;
    const dueAmount = Math.max(0, grandTotal - received);

    const newSale = addSale({
      date,
      customerName: customerName.trim(),
      customerPhone: (customerPhone || '').trim(),
      customerAddress: (customerAddress || '').trim(),
      items: calculatedItems,
      subTotal,
      discount: disc,
      grandTotal,
      receivedAmount: received,
      dueAmount,
      paymentMethod,
      notes
    });

    res.json({
      success: true,
      message: 'বিক্রয় ও বিল কাস্টমারের ব্যক্তিগত খাতায় সংরক্ষিত হয়েছে',
      sale: newSale,
      stock: getGodownStock()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/sales/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteSale(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'বিক্রয় রেকর্ড পাওয়া যায়নি' });
    }
    res.json({ success: true, message: 'রেকর্ড মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Payments API (টাকা জমা বা দেনা পরিশোধের রশিদ)
app.post('/api/payments', (req, res) => {
  try {
    const {
      type, // 'supplier_payment' or 'customer_collection'
      partyName,
      partyPhone,
      amount,
      date,
      paymentMethod = 'ক্যাশ',
      notes = ''
    } = req.body;

    const amt = parseFloat(amount);
    if (!partyName || !amt || amt <= 0 || !date) {
      return res.status(400).json({ success: false, message: 'সঠিক নাম, তারিখ ও টাকার পরিমাণ দিন' });
    }

    const newPayment = addPayment({
      type,
      partyName: partyName.trim(),
      partyPhone: (partyPhone || '').trim(),
      amount: amt,
      date,
      paymentMethod,
      notes
    });

    res.json({
      success: true,
      message: 'টাকা জমা/পরিশোধের রশিদ সফলভাবে সংরক্ষিত হয়েছে',
      payment: newPayment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. SQL Database Dump Export (For future external database connection)
app.get('/api/system/export-sql', (req, res) => {
  try {
    const sql = exportAsSql();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename=rs_paper_database.sql');
    res.send(sql);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. Supabase Status
app.get('/api/system/supabase-status', (req, res) => {
  res.json({
    success: true,
    supabase: getSupabaseConfigStatus()
  });
});

// Fallback to index.html for SPA
if (fs.existsSync(DIST_PATH)) {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(DIST_PATH, 'index.html'));
    }
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
