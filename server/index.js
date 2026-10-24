import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import crypto from 'crypto';
import {
  loadData,
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
  deletePayment,
  deleteCustomer,
  deleteSupplier,
  exportAsSql,
  verifyAdminPassword,
  updatePartyPhoto,
  updateCustomer,
  updateSupplier,
  updatePurchase,
  updateSale
} from './db.js';
import { getSupabaseConfigStatus } from './supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static assets (only in non-serverless environment)
let fs;
try {
  const fsModule = await import('fs');
  fs = fsModule.default;
  if (fs.existsSync(DIST_PATH)) {
    const { default: expressStatic } = await import('express');
    app.use(express.static(DIST_PATH));
  }
} catch (e) {}

// ── Seed / Sample healthcheck ──
app.post('/api/seed-sample', (req, res) => {
  res.json({ success: true, message: 'Sample data checked' });
});

// ── Authentication & Security Protection ──
const AUTH_SECRET = process.env.AUTH_SECRET || 'rs_paper_session_secret_2026';

function generateAuthToken() {
  const salt = 'rs_admin_session_auth_v1';
  return crypto.createHmac('sha256', AUTH_SECRET).update(salt).digest('hex');
}

// In-memory Brute Force Protection (5 attempts -> 15 min lock)
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

function checkLockout(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return { locked: false };
  if (record.lockUntil && Date.now() < record.lockUntil) {
    const minutesLeft = Math.ceil((record.lockUntil - Date.now()) / 60000);
    return { locked: true, minutesLeft };
  }
  if (record.lockUntil && Date.now() >= record.lockUntil) {
    loginAttempts.delete(ip);
  }
  return { locked: false };
}

function recordFailure(ip) {
  const record = loginAttempts.get(ip) || { count: 0, lockUntil: null };
  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  loginAttempts.set(ip, record);
  return record;
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const { locked, minutesLeft } = checkLockout(clientIp);

    if (locked) {
      return res.status(429).json({
        success: false,
        message: `নিরাপত্তার স্বার্থে অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে। অনুগ্রহ করে ${minutesLeft} মিনিট পর পুনরায় চেষ্টা করুন।`
      });
    }

    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ success: false, message: 'পাসওয়ার্ড দিন' });
    }

    const isValid = await verifyAdminPassword(password);
    if (!isValid) {
      const record = recordFailure(clientIp);
      const remaining = MAX_FAILED_ATTEMPTS - record.count;
      if (remaining <= 0) {
        return res.status(429).json({
          success: false,
          message: 'পরপর ৫ বার ভুল পাসওয়ার্ড দেওয়ার কারণে ১৫ মিনিটের জন্য লগইন লক করা হয়েছে।'
        });
      }
      return res.status(401).json({
        success: false,
        message: `ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন। (অবশিষ্ট সুযোগ: ${remaining} বার)`
      });
    }

    // Success — clear failed attempts
    loginAttempts.delete(clientIp);
    const token = generateAuthToken();
    res.json({ success: true, message: 'লগইন সফল হয়েছে', token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/verify', (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.json({ success: false, authenticated: false });
    const expectedToken = generateAuthToken();
    if (token === expectedToken) {
      return res.json({ success: true, authenticated: true });
    }
    return res.json({ success: false, authenticated: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 1. Dashboard ──
app.get('/api/dashboard', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    const data = await loadData();
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

// ── 2. Stock ──
app.get('/api/stock', async (req, res) => {
  try {
    const stock = await getGodownStock();
    res.json({ success: true, stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Helpers for flat customer/supplier ──
function formatFlatCustomer(folder) {
  if (!folder || !folder.customer) return null;
  return {
    id: folder.customer.id, name: folder.customer.name, phone: folder.customer.phone,
    address: folder.customer.address, photo: folder.customer.photo || '', createdAt: folder.customer.createdAt,
    ...folder.summary,
    salesCount: (folder.sales || []).length, paymentsCount: (folder.payments || []).length
  };
}

function formatFlatSupplier(folder) {
  if (!folder || !folder.supplier) return null;
  return {
    id: folder.supplier.id, name: folder.supplier.name, phone: folder.supplier.phone,
    address: folder.supplier.address, photo: folder.supplier.photo || '', createdAt: folder.supplier.createdAt,
    ...folder.summary,
    purchasesCount: (folder.purchases || []).length, paymentsCount: (folder.payments || []).length
  };
}

// ── 3. Customers ──
app.get('/api/customers', async (req, res) => {
  try {
    const folders = await getAllCustomerFolders();
    const customers = folders.map(formatFlatCustomer).filter(Boolean);
    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/ledger/customers', async (req, res) => {
  try {
    const folders = await getAllCustomerFolders();
    const customers = folders.map(formatFlatCustomer).filter(Boolean);
    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const folder = await getCustomerFolderDetails(req.params.id);
    if (!folder) return res.status(404).json({ success: false, message: 'কাস্টমার খাতা পাওয়া যায়নি' });
    res.json({ success: true, profile: folder.customer, ...folder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, address, photo } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'কাস্টমারের নাম আবশ্যক' });
    const customer = await ensureCustomerExists(name, phone, address, photo);
    res.json({ success: true, message: 'নতুন কাস্টমার খাতা সফলভাবে তৈরি হয়েছে', customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/customers/:id/photo', async (req, res) => {
  try {
    const { photo } = req.body;
    const ok = await updatePartyPhoto(req.params.id, 'customer', photo);
    if (!ok) return res.status(404).json({ success: false, message: 'কাস্টমার পাওয়া যায়নি' });
    res.json({ success: true, message: 'কাস্টমার ছবি আপডেট হয়েছে', photo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, phone, address, photo } = req.body;
    const result = await updateCustomer(req.params.id, { name, phone, address, photo });
    if (!result.success) return res.status(400).json(result);
    res.json({ success: true, message: 'কাস্টমার তথ্য সফলভাবে আপডেট হয়েছে', customer: result.customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/customers/:id/update', async (req, res) => {
  try {
    const { name, phone, address, photo } = req.body;
    const result = await updateCustomer(req.params.id, { name, phone, address, photo });
    if (!result.success) return res.status(400).json(result);
    res.json({ success: true, message: 'কাস্টমার তথ্য সফলভাবে আপডেট হয়েছে', customer: result.customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const handleCustomerDelete = async (req, res) => {
  try {
    const password = req.body?.password || req.headers['x-admin-password'] || req.query?.password;
    if (!password) {
      return res.status(401).json({ success: false, message: 'কাস্টমার অ্যাকাউন্ট ডিলিট করতে অ্যাডমিন পাসওয়ার্ড আবশ্যক' });
    }
    const isValid = await verifyAdminPassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'ভুল অ্যাডমিন পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।' });
    }
    const deleted = await deleteCustomer(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'কাস্টমার রেকর্ড পাওয়া যায়নি' });
    res.json({ success: true, message: 'কাস্টমার খাতা সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

app.delete('/api/customers/:id', handleCustomerDelete);
app.post('/api/customers/:id/delete', handleCustomerDelete);

// ── 4. Suppliers ──
app.get('/api/suppliers', async (req, res) => {
  try {
    const folders = await getAllSupplierFolders();
    const suppliers = folders.map(formatFlatSupplier).filter(Boolean);
    res.json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/ledger/suppliers', async (req, res) => {
  try {
    const folders = await getAllSupplierFolders();
    const suppliers = folders.map(formatFlatSupplier).filter(Boolean);
    res.json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/suppliers/:id', async (req, res) => {
  try {
    const folder = await getSupplierFolderDetails(req.params.id);
    if (!folder) return res.status(404).json({ success: false, message: 'সাপ্লায়ার খাতা পাওয়া যায়নি' });
    res.json({ success: true, profile: folder.supplier, ...folder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { name, phone, address, photo } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'সাপ্লায়ারের নাম আবশ্যক' });
    const supplier = await ensureSupplierExists(name, phone, address, photo);
    res.json({ success: true, message: 'নতুন সাপ্লায়ার খাতা সফলভাবে তৈরি হয়েছে', supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/suppliers/:id/photo', async (req, res) => {
  try {
    const { photo } = req.body;
    const ok = await updatePartyPhoto(req.params.id, 'supplier', photo);
    if (!ok) return res.status(404).json({ success: false, message: 'সাপ্লায়ার পাওয়া যায়নি' });
    res.json({ success: true, message: 'সাপ্লায়ার ছবি আপডেট হয়েছে', photo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { name, phone, address, photo } = req.body;
    const result = await updateSupplier(req.params.id, { name, phone, address, photo });
    if (!result.success) return res.status(400).json(result);
    res.json({ success: true, message: 'সাপ্লায়ার তথ্য সফলভাবে আপডেট হয়েছে', supplier: result.supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/suppliers/:id/update', async (req, res) => {
  try {
    const { name, phone, address, photo } = req.body;
    const result = await updateSupplier(req.params.id, { name, phone, address, photo });
    if (!result.success) return res.status(400).json(result);
    res.json({ success: true, message: 'সাপ্লায়ার তথ্য সফলভাবে আপডেট হয়েছে', supplier: result.supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const handleSupplierDelete = async (req, res) => {
  try {
    const password = req.body?.password || req.headers['x-admin-password'] || req.query?.password;
    if (!password) {
      return res.status(401).json({ success: false, message: 'সাপ্লায়ার অ্যাকাউন্ট ডিলিট করতে অ্যাডমিন পাসওয়ার্ড আবশ্যক' });
    }
    const isValid = await verifyAdminPassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'ভুল অ্যাডমিন পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।' });
    }
    const deleted = await deleteSupplier(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'সাপ্লায়ার রেকর্ড পাওয়া যায়নি' });
    res.json({ success: true, message: 'সাপ্লায়ার খাতা মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

app.delete('/api/suppliers/:id', handleSupplierDelete);
app.post('/api/suppliers/:id/delete', handleSupplierDelete);

// ── 5. Purchases ──
app.get('/api/purchases', async (req, res) => {
  try {
    const data = await loadData();
    const list = [...(data.purchases || [])].reverse();
    res.json({ success: true, purchases: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const { date, supplierName, supplierPhone, supplierAddress, items, discount = 0, paidAmount = 0, paymentMethod = 'ক্যাশ', notes = '' } = req.body;
    if (!supplierName || !date || !items || items.length === 0)
      return res.status(400).json({ success: false, message: 'সাপ্লায়ার নাম, তারিখ এবং পণ্যের বিবরণ আবশ্যক!' });

    const calculatedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return {
        productType: item.productType,
        name: item.name || (item.productType === 'tissue' ? 'Tissue Paper' : 'Cutting / News Paper'),
        quantity: qty, unit: item.unit || 'কেজি', rate, total: Math.round(qty * rate * 100) / 100
      };
    });
    const subTotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
    const disc = parseFloat(discount) || 0;
    const grandTotal = Math.max(0, subTotal - disc);
    const paid = parseFloat(paidAmount) || 0;
    const dueAmount = Math.max(0, grandTotal - paid);

    const newPurchase = await addPurchase({
      date, supplierName: supplierName.trim(), supplierPhone: (supplierPhone || '').trim(),
      supplierAddress: (supplierAddress || '').trim(), items: calculatedItems,
      subTotal, discount: disc, grandTotal, paidAmount: paid, dueAmount, paymentMethod, notes
    });
    res.json({ success: true, message: 'ক্রয় এন্ট্রি সম্পন্ন ও সাপ্লায়ারের খাতায় সংরক্ষিত হয়েছে', purchase: newPurchase, stock: await getGodownStock() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/purchases/:id', async (req, res) => {
  try {
    const { date, supplierName, supplierPhone, supplierAddress, items, discount = 0, paidAmount = 0, paymentMethod = 'ক্যাশ', notes = '' } = req.body;
    if (!supplierName || !date || !items || items.length === 0)
      return res.status(400).json({ success: false, message: 'সাপ্লায়ার নাম, তারিখ এবং পণ্যের বিবরণ আবশ্যক!' });

    const calculatedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return {
        productType: item.productType,
        name: item.name || (item.productType === 'tissue' ? 'Tissue Paper' : 'Cutting / News Paper'),
        quantity: qty, unit: item.unit || 'কেজি', rate, total: Math.round(qty * rate * 100) / 100
      };
    });
    const subTotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
    const disc = parseFloat(discount) || 0;
    const grandTotal = Math.max(0, subTotal - disc);
    const paid = parseFloat(paidAmount) || 0;
    const dueAmount = Math.max(0, grandTotal - paid);

    const updated = await updatePurchase(req.params.id, {
      date, supplierName: supplierName.trim(), supplierPhone: (supplierPhone || '').trim(),
      supplierAddress: (supplierAddress || '').trim(), items: calculatedItems,
      subTotal, discount: disc, grandTotal, paidAmount: paid, dueAmount, paymentMethod, notes
    });
    if (!updated) return res.status(404).json({ success: false, message: 'ক্রয় চালান পাওয়া যায়নি' });
    res.json({ success: true, message: 'ক্রয় চালান সফলভাবে আপডেট হয়েছে', purchase: updated, stock: await getGodownStock() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/purchases/:id/update', async (req, res) => {
  try {
    const { date, supplierName, supplierPhone, supplierAddress, items, discount = 0, paidAmount = 0, paymentMethod = 'ক্যাশ', notes = '' } = req.body;
    if (!supplierName || !date || !items || items.length === 0)
      return res.status(400).json({ success: false, message: 'সাপ্লায়ার নাম, তারিখ এবং পণ্যের বিবরণ আবশ্যক!' });

    const calculatedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return {
        productType: item.productType,
        name: item.name || (item.productType === 'tissue' ? 'Tissue Paper' : 'Cutting / News Paper'),
        quantity: qty, unit: item.unit || 'কেজি', rate, total: Math.round(qty * rate * 100) / 100
      };
    });
    const subTotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
    const disc = parseFloat(discount) || 0;
    const grandTotal = Math.max(0, subTotal - disc);
    const paid = parseFloat(paidAmount) || 0;
    const dueAmount = Math.max(0, grandTotal - paid);

    const updated = await updatePurchase(req.params.id, {
      date, supplierName: supplierName.trim(), supplierPhone: (supplierPhone || '').trim(),
      supplierAddress: (supplierAddress || '').trim(), items: calculatedItems,
      subTotal, discount: disc, grandTotal, paidAmount: paid, dueAmount, paymentMethod, notes
    });
    if (!updated) return res.status(404).json({ success: false, message: 'ক্রয় চালান পাওয়া যায়নি' });
    res.json({ success: true, message: 'ক্রয় চালান সফলভাবে আপডেট হয়েছে', purchase: updated, stock: await getGodownStock() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/purchases/:id', async (req, res) => {
  try {
    const deleted = await deletePurchase(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'ক্রয় রেকর্ড পাওয়া যায়নি' });
    res.json({ success: true, message: 'রেকর্ড মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 6. Sales ──
app.get('/api/sales', async (req, res) => {
  try {
    const data = await loadData();
    const list = [...(data.sales || [])].reverse();
    res.json({ success: true, sales: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { date, customerName, customerPhone, customerAddress, items, discount = 0, receivedAmount = 0, paymentMethod = 'ক্যাশ', notes = '' } = req.body;
    if (!customerName || !date || !items || items.length === 0)
      return res.status(400).json({ success: false, message: 'কাস্টমার নাম, তারিখ এবং পণ্যের বিবরণ আবশ্যক!' });

    const calculatedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return {
        productType: item.productType,
        name: item.name || (item.productType === 'tissue' ? 'Tissue Paper' : 'Cutting / News Paper'),
        quantity: qty, unit: item.unit || 'কেজি', rate, total: Math.round(qty * rate * 100) / 100
      };
    });
    const subTotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
    const disc = parseFloat(discount) || 0;
    const grandTotal = Math.max(0, subTotal - disc);
    const received = parseFloat(receivedAmount) || 0;
    const dueAmount = Math.max(0, grandTotal - received);

    const newSale = await addSale({
      date, customerName: customerName.trim(), customerPhone: (customerPhone || '').trim(),
      customerAddress: (customerAddress || '').trim(), items: calculatedItems,
      subTotal, discount: disc, grandTotal, receivedAmount: received, dueAmount, paymentMethod, notes
    });
    res.json({ success: true, message: 'বিক্রয় ও বিল কাস্টমারের ব্যক্তিগত খাতায় সংরক্ষিত হয়েছে', sale: newSale, stock: await getGodownStock() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/sales/:id', async (req, res) => {
  try {
    const { date, customerName, customerPhone, customerAddress, items, discount = 0, receivedAmount = 0, paymentMethod = 'ক্যাশ', notes = '' } = req.body;
    if (!customerName || !date || !items || items.length === 0)
      return res.status(400).json({ success: false, message: 'কাস্টমার নাম, তারিখ এবং পণ্যের বিবরণ আবশ্যক!' });

    const calculatedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return {
        productType: item.productType,
        name: item.name || (item.productType === 'tissue' ? 'Tissue Paper' : 'Cutting / News Paper'),
        quantity: qty, unit: item.unit || 'কেজি', rate, total: Math.round(qty * rate * 100) / 100
      };
    });
    const subTotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
    const disc = parseFloat(discount) || 0;
    const grandTotal = Math.max(0, subTotal - disc);
    const received = parseFloat(receivedAmount) || 0;
    const dueAmount = Math.max(0, grandTotal - received);

    const updated = await updateSale(req.params.id, {
      date, customerName: customerName.trim(), customerPhone: (customerPhone || '').trim(),
      customerAddress: (customerAddress || '').trim(), items: calculatedItems,
      subTotal, discount: disc, grandTotal, receivedAmount: received, dueAmount, paymentMethod, notes
    });
    if (!updated) return res.status(404).json({ success: false, message: 'বিক্রয় চালান পাওয়া যায়নি' });
    res.json({ success: true, message: 'বিক্রয় চালান সফলভাবে আপডেট হয়েছে', sale: updated, stock: await getGodownStock() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/sales/:id/update', async (req, res) => {
  try {
    const { date, customerName, customerPhone, customerAddress, items, discount = 0, receivedAmount = 0, paymentMethod = 'ক্যাশ', notes = '' } = req.body;
    if (!customerName || !date || !items || items.length === 0)
      return res.status(400).json({ success: false, message: 'কাস্টমার নাম, তারিখ এবং পণ্যের বিবরণ আবশ্যক!' });

    const calculatedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return {
        productType: item.productType,
        name: item.name || (item.productType === 'tissue' ? 'Tissue Paper' : 'Cutting / News Paper'),
        quantity: qty, unit: item.unit || 'কেজি', rate, total: Math.round(qty * rate * 100) / 100
      };
    });
    const subTotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
    const disc = parseFloat(discount) || 0;
    const grandTotal = Math.max(0, subTotal - disc);
    const received = parseFloat(receivedAmount) || 0;
    const dueAmount = Math.max(0, grandTotal - received);

    const updated = await updateSale(req.params.id, {
      date, customerName: customerName.trim(), customerPhone: (customerPhone || '').trim(),
      customerAddress: (customerAddress || '').trim(), items: calculatedItems,
      subTotal, discount: disc, grandTotal, receivedAmount: received, dueAmount, paymentMethod, notes
    });
    if (!updated) return res.status(404).json({ success: false, message: 'বিক্রয় চালান পাওয়া যায়নি' });
    res.json({ success: true, message: 'বিক্রয় চালান সফলভাবে আপডেট হয়েছে', sale: updated, stock: await getGodownStock() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/sales/:id', async (req, res) => {
  try {
    const deleted = await deleteSale(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'বিক্রয় রেকর্ড পাওয়া যায়নি' });
    res.json({ success: true, message: 'রেকর্ড মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 7. Payments ──
app.post('/api/payments', async (req, res) => {
  try {
    const { type, partyName, partyPhone, amount, date, paymentMethod = 'ক্যাশ', notes = '' } = req.body;
    const amt = parseFloat(amount);
    if (!partyName || !amt || amt <= 0 || !date)
      return res.status(400).json({ success: false, message: 'সঠিক নাম, তারিখ ও টাকার পরিমাণ দিন' });
    const newPayment = await addPayment({ type, partyName: partyName.trim(), partyPhone: (partyPhone || '').trim(), amount: amt, date, paymentMethod, notes });
    res.json({ success: true, message: 'টাকা জমা/পরিশোধের রশিদ সফলভাবে সংরক্ষিত হয়েছে', payment: newPayment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    const deleted = await deletePayment(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'পেমেন্ট রেকর্ড পাওয়া যায়নি' });
    res.json({ success: true, message: 'পেমেন্ট রেকর্ড মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


app.get('/api/system/export-sql', async (req, res) => {
  try {
    const sql = await exportAsSql();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename=rs_paper_database.sql');
    res.send(sql);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 9. Supabase Status ──
app.get('/api/system/supabase-status', (req, res) => {
  res.json({ success: true, supabase: getSupabaseConfigStatus() });
});

// ── SPA Fallback ──
try {
  const fsCheck = await import('fs');
  if (fsCheck.default.existsSync(DIST_PATH)) {
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(DIST_PATH, 'index.html'));
      }
    });
  }
} catch (e) {}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
