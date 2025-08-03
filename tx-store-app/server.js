// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // your MySQL password
  database: 'financial_records',
  waitForConnections: true,
  connectionLimit: 10,
});

// Insert transaction
app.post('/api/transactions', async (req, res) => {
  const {
    id,
    description,
    amount,
    category,
    timestamp,
    transactionHash,
    recordType,
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO transactions
        (id, description, amount, category, timestamp, transactionHash, recordType)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        description,
        amount,
        category,
        timestamp,
        transactionHash,
        recordType || "original",
      ]
    );
    res.status(201).json({ message: "Transaction added", id: result.insertId });
  } catch (err) {
    console.error('Error inserting transaction:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transactions');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('✅ Server running at http://localhost:3001');
});

const { storeAllConfirmed } = require('./storeAllConfirmed');

app.post('/api/transactions/batch', async (req, res) => {
  const records = req.body;

  if (!Array.isArray(records)) {
    return res.status(400).send("Invalid format");
  }

  try {
    await storeAllConfirmed(records);
    res.status(200).send("✅ Batch inserted");
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    res.status(500).send("Failed to store records");
  }
});
