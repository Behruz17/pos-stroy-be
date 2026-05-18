const db = require('../src/config/db');

async function fixPartialBalances() {
  const connection = await db.getConnection();
  try {
    const [sales] = await connection.execute(
      `SELECT id, customer_id, total_amount, cash_amount, electronic_amount
       FROM sales
       WHERE payment_status = 'PARTIAL' AND customer_id IS NOT NULL AND status = 1`
    );

    if (sales.length === 0) {
      console.log('No active PARTIAL sales found.');
      return;
    }

    // Group overcharge by customer
    const overcharges = {};
    for (const sale of sales) {
      const cash = parseFloat(sale.cash_amount) || 0;
      const electronic = parseFloat(sale.electronic_amount) || 0;
      const overcharge = cash + electronic;

      if (overcharge <= 0) continue;

      if (!overcharges[sale.customer_id]) {
        overcharges[sale.customer_id] = { totalOvercharge: 0, sales: [] };
      }
      overcharges[sale.customer_id].totalOvercharge += overcharge;
      overcharges[sale.customer_id].sales.push({
        id: sale.id,
        total_amount: sale.total_amount,
        cash,
        electronic,
        overcharge
      });
    }

    console.log(`Found ${sales.length} PARTIAL sales across ${Object.keys(overcharges).length} customers.\n`);

    for (const [customerId, data] of Object.entries(overcharges)) {
      console.log(`Customer #${customerId}: overcharged by ${data.totalOvercharge}`);
      for (const s of data.sales) {
        console.log(`  Sale #${s.id}: total=${s.total_amount}, cash=${s.cash}, electronic=${s.electronic}, overcharge=${s.overcharge}`);
      }

      await connection.execute(
        'UPDATE customers SET balance = GREATEST(0, balance - ?) WHERE id = ? AND status = 1',
        [data.totalOvercharge, customerId]
      );

      const [updated] = await connection.execute(
        'SELECT id, full_name, balance FROM customers WHERE id = ?',
        [customerId]
      );
      console.log(`  -> New balance: ${updated[0].balance} (${updated[0].full_name})\n`);
    }

    console.log('Done! All PARTIAL sale balance overcharges have been corrected.');
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

fixPartialBalances().then(() => process.exit(0)).catch(() => process.exit(1));
