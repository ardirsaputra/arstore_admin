// activate-device.js — Aktivasi / perpanjang lisensi perangkat langsung ke DB
// Usage: node activate-device.js <device_id> [months]
//   months = 6  (default) | angka lain | "lifetime"
//
// Contoh:
//   node activate-device.js abc123def456 6
//   node activate-device.js abc123def456 lifetime

require('dotenv').config();
const { neonConfig, Pool } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

const [,, deviceId, monthsArg = '6'] = process.argv;

if (!deviceId) {
  console.error('❌  Penggunaan: node activate-device.js <device_id> [months|lifetime]');
  process.exit(1);
}

const isLifetime = monthsArg === 'lifetime';
const months     = isLifetime ? null : parseInt(monthsArg, 10);

if (!isLifetime && (isNaN(months) || months < 1)) {
  console.error('❌  months harus angka positif atau "lifetime"');
  process.exit(1);
}

async function run() {
  const pool   = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    // Cek apakah device sudah ada
    const { rows: existing } = await client.query(
      'SELECT * FROM devices WHERE device_id = $1',
      [deviceId],
    );

    let expiryDate = null;
    if (!isLifetime) {
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + months);
    }

    let row;

    if (existing.length > 0) {
      // Update device yang sudah ada
      const { rows } = await client.query(
        `UPDATE devices
         SET status = 'active',
             is_permanent = $2,
             expiry_date  = $3,
             last_checked_at = NOW()
         WHERE device_id = $1
         RETURNING *`,
        [deviceId, isLifetime, expiryDate],
      );
      row = rows[0];
      console.log('✅  Device diperbarui.');
    } else {
      // Buat device baru langsung aktif
      const { rows } = await client.query(
        `INSERT INTO devices (device_id, status, is_permanent, expiry_date, trial_start_date)
         VALUES ($1, 'active', $2, $3, NOW())
         RETURNING *`,
        [deviceId, isLifetime, expiryDate],
      );
      row = rows[0];
      console.log('✅  Device baru dibuat dan diaktifkan.');
    }

    console.log('\n📋  Info Lisensi:');
    console.log(`   Device ID   : ${row.device_id}`);
    console.log(`   Status      : ${row.status}`);
    console.log(`   Tipe        : ${row.is_permanent ? 'Lifetime / Permanen' : `${months} Bulan`}`);
    console.log(`   Aktif s/d   : ${row.expiry_date ? new Date(row.expiry_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Selamanya'}`);

    console.log('\n🎉  Buka ulang app / refresh status untuk melihat perubahan.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌  Gagal:', err.message);
  process.exit(1);
});
