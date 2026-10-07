-- ====================================================================
-- RS Paper and Packaging - Supabase Database Schema
-- ====================================================================
-- কীভাবে চালাবেন:
-- ১. Supabase Dashboard এ লগইন করুন (https://app.supabase.com)
-- ২. আপনার প্রজেক্টের বাঁপাশের মেনু থেকে "SQL Editor" এ ক্লিক করুন।
-- ৩. "New Query" তে এই সম্পূর্ণ কোডটি পেস্ট করুন এবং "Run" বাটনে ক্লিক করুন।
-- ====================================================================

-- ১. কাস্টমার টেবিল (Customers Table)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ২. সাপ্লায়ার টেবিল (Suppliers Table)
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৩. পেপার ক্রয় চালান টেবিল (Purchases Table)
CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    supplier_name TEXT NOT NULL,
    supplier_phone TEXT,
    supplier_address TEXT,
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    sub_total NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    grand_total NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    due_amount NUMERIC DEFAULT 0,
    payment_method TEXT DEFAULT 'ক্যাশ',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৪. পেপার বিক্রয় চালান টেবিল (Sales Table)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    sub_total NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    grand_total NUMERIC DEFAULT 0,
    received_amount NUMERIC DEFAULT 0,
    due_amount NUMERIC DEFAULT 0,
    payment_method TEXT DEFAULT 'ক্যাশ',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৫. টাকা জমা ও দেনা পরিশোধের রশিদ টেবিল (Payments / Collections Table)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'customer_collection' অথবা 'supplier_payment'
    party_name TEXT NOT NULL,
    party_phone TEXT,
    amount NUMERIC DEFAULT 0,
    date DATE NOT NULL,
    payment_method TEXT DEFAULT 'ক্যাশ',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ইনডেক্সিং (দ্রুত সার্চ ও ফিল্টারিং এর জন্য)
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_name);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_payments_party ON payments(party_name);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);

-- Row Level Security (RLS) পলিসি: সরাসরি রিড এবং রাইট অনুমোদনের জন্য
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- অ্যানোনিমাস এবং অথেন্টিকেটেড অ্যাক্সেস পলিসি
CREATE POLICY "Allow public read/write customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write purchases" ON purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write payments" ON payments FOR ALL USING (true) WITH CHECK (true);

-- ৬. অ্যাপ সেটিংস ও সিকিউরিটি পাসওয়ার্ড টেবিল (App Settings & Security Table)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- ডিফল্ট অ্যাডমিন পাসওয়ার্ড এন্ট্রি
INSERT INTO app_settings (key, value) 
VALUES ('admin_password', 'RS01711006211#')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
