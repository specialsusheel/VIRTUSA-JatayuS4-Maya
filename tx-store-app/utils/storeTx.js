const db = require('./db');

async function storeTransaction(tx) {
  const query = `
    INSERT IGNORE INTO transactions 
    (datetime, description, amount, category, status, tx_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
    new Date(tx.datetime || tx.date),
    tx.description,
    tx.amount,
    tx.category,
    tx.status,
    tx.tx_hash
  ];

  try {
    await db.query(query, values);
    console.log(`✅ Stored TX: ${tx.tx_hash}`);
  } catch (err) {
    console.error(`❌ DB Error:`, err.message);
  }
}

async function storeAllConfirmed(transactions) {
  for (const tx of transactions) {
    if (tx.status === "Confirmed") {
      await storeTransaction(tx);
    }
  }
}

module.exports = { storeAllConfirmed };
