import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { loadData } from './db.js';

async function syncAllToSupabase() {
  console.log('--------------------------------------------------');
  console.log('🔄 RS Paper and Packaging - Supabase ডেটা সিঙ্ক');
  console.log('--------------------------------------------------');

  if (!isSupabaseConfigured() || !supabase) {
    console.error('❌ এরর: Supabase ক্রেডেনশিয়াল পাওয়া যায়নি!');
    console.log('অনুগ্রহ করে .env ফাইলে SUPABASE_URL এবং SUPABASE_KEY যুক্ত করুন।');
    console.log('উদাহরণ:');
    console.log('SUPABASE_URL=https://xyzcompany.supabase.co');
    console.log('SUPABASE_KEY=eyJhbGciOi...');
    process.exit(1);
  }

  const data = loadData();

  try {
    // 1. Sync Customers
    const customers = data.customers || [];
    if (customers.length > 0) {
      console.log(`⏳ ${customers.length} জন কাস্টমার সিঙ্ক করা হচ্ছে...`);
      const { error: custErr } = await supabase.from('customers').upsert(
        customers.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone || '',
          address: c.address || '',
          created_at: c.createdAt || new Date().toISOString()
        }))
      );
      if (custErr) throw new Error('Customers sync failed: ' + custErr.message);
      console.log('✅ কাস্টমারদের তথ্য সফলভাবে Supabase এ আপলোড হয়েছে');
    }

    // 2. Sync Suppliers
    const suppliers = data.suppliers || [];
    if (suppliers.length > 0) {
      console.log(`⏳ ${suppliers.length} জন সাপ্লায়ার সিঙ্ক করা হচ্ছে...`);
      const { error: suppErr } = await supabase.from('suppliers').upsert(
        suppliers.map(s => ({
          id: s.id,
          name: s.name,
          phone: s.phone || '',
          address: s.address || '',
          created_at: s.createdAt || new Date().toISOString()
        }))
      );
      if (suppErr) throw new Error('Suppliers sync failed: ' + suppErr.message);
      console.log('✅ সাপ্লায়ারদের তথ্য সফলভাবে Supabase এ আপলোড হয়েছে');
    }

    // 3. Sync Purchases
    const purchases = data.purchases || [];
    if (purchases.length > 0) {
      console.log(`⏳ ${purchases.length} টি ক্রয় চালান সিঙ্ক করা হচ্ছে...`);
      const { error: purErr } = await supabase.from('purchases').upsert(
        purchases.map(p => ({
          id: p.id,
          date: p.date,
          supplier_name: p.supplierName,
          supplier_phone: p.supplierPhone || '',
          supplier_address: p.supplierAddress || '',
          items: p.items || [],
          sub_total: p.subTotal || 0,
          discount: p.discount || 0,
          grand_total: p.grandTotal || 0,
          paid_amount: p.paidAmount || 0,
          due_amount: p.dueAmount || 0,
          payment_method: p.paymentMethod || 'ক্যাশ',
          notes: p.notes || '',
          created_at: p.createdAt || new Date().toISOString()
        }))
      );
      if (purErr) throw new Error('Purchases sync failed: ' + purErr.message);
      console.log('✅ ক্রয়ের সমস্ত চালান সফলভাবে Supabase এ আপলোড হয়েছে');
    }

    // 4. Sync Sales
    const sales = data.sales || [];
    if (sales.length > 0) {
      console.log(`⏳ ${sales.length} টি বিক্রয় চালান সিঙ্ক করা হচ্ছে...`);
      const { error: salErr } = await supabase.from('sales').upsert(
        sales.map(s => ({
          id: s.id,
          date: s.date,
          customer_name: s.customerName,
          customer_phone: s.customerPhone || '',
          customer_address: s.customerAddress || '',
          items: s.items || [],
          sub_total: s.subTotal || 0,
          discount: s.discount || 0,
          grand_total: s.grandTotal || 0,
          received_amount: s.receivedAmount || 0,
          due_amount: s.dueAmount || 0,
          payment_method: s.paymentMethod || 'ক্যাশ',
          notes: s.notes || '',
          created_at: s.createdAt || new Date().toISOString()
        }))
      );
      if (salErr) throw new Error('Sales sync failed: ' + salErr.message);
      console.log('✅ বিক্রয়ের সমস্ত চালান সফলভাবে Supabase এ আপলোড হয়েছে');
    }

    // 5. Sync Payments
    const payments = data.payments || [];
    if (payments.length > 0) {
      console.log(`⏳ ${payments.length} টি টাকা জমা/পরিশোধের রশিদ সিঙ্ক করা হচ্ছে...`);
      const { error: payErr } = await supabase.from('payments').upsert(
        payments.map(p => ({
          id: p.id,
          type: p.type,
          party_name: p.partyName,
          party_phone: p.partyPhone || '',
          amount: p.amount || 0,
          date: p.date,
          payment_method: p.paymentMethod || 'ক্যাশ',
          notes: p.notes || '',
          created_at: p.createdAt || new Date().toISOString()
        }))
      );
      if (payErr) throw new Error('Payments sync failed: ' + payErr.message);
      console.log('✅ সমস্ত পেমেন্ট রশিদ সফলভাবে Supabase এ আপলোড হয়েছে');
    }

    console.log('--------------------------------------------------');
    console.log('🎉 অভিনন্দন! সমস্ত ডেটা সফলভাবে Supabase ক্লাউড ডাটাবেজে সিঙ্ক সম্পন্ন হয়েছে।');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('❌ সিঙ্ক ব্যর্থ হয়েছে:', err.message);
    process.exit(1);
  }
}

syncAllToSupabase();
