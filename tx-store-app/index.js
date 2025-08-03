// index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

let storedTransactions = []; // In-memory for demo, you can use DB later

// Endpoint to store transactions (already used)
app.post("/store", async (req, res) => {
  const { txHash } = req.body;

  try {
    const provider = new ethers.JsonRpcProvider("http://localhost:8545"); // Ganache
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return res.status(404).json({ error: "Transaction not found yet" });
    }

    const tx = await provider.getTransaction(txHash);

    const stored = {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      data: tx.data,
      value: tx.value.toString(),
      gas: tx.gasLimit.toString(),
    };

    storedTransactions.push(stored);
    console.log("✅ Stored TX:", stored.hash);
    res.json({ success: true, stored });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ New endpoint to get stored transactions
app.get("/records", (req, res) => {
  res.json(storedTransactions);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
