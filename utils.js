// --- Utility: cn (class name merge) ---
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Blockchain helpers ---
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

// Simple MetaMask detection
function isMetaMaskInstalled() {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

// Clean wallet connection function
async function connectWallet() {
  if (!isMetaMaskInstalled()) {
    window.open("https://metamask.io/download/", "_blank");
    throw new Error("MetaMask is not installed");
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) throw new Error("No accounts found");
    return accounts[0];
  } catch (error) {
    if (error.code === 4001) throw new Error("Connection rejected by user");
    if (error.code === -32002) throw new Error("Connection request already pending");
    throw new Error("Failed to connect wallet");
  }
}

// Convert financial record to hex data
function convertRecordToHex(record) {
  const jsonString = JSON.stringify({
    description: record.description,
    amount: record.amount,
    category: record.category,
    date: record.date,
    notes: record.notes || "",
    timestamp: Date.now(),
  });
  return "0x" + Buffer.from(jsonString, "utf8").toString("hex");
}

// Send transaction with record data
async function sendTransaction(record) {
  if (!isMetaMaskInstalled()) throw new Error("MetaMask is not installed");
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (!accounts || accounts.length === 0) throw new Error("No connected accounts");
    const fromAddress = accounts[0];
    const hexData = record.hexData || convertRecordToHex(record);
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const gasEstimate = await window.ethereum.request({ method: 'eth_estimateGas', params: [{ from: fromAddress, to: NULL_ADDRESS, data: hexData }] });
    const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' });
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from: fromAddress, to: NULL_ADDRESS, value: "0x0", data: hexData, gas: gasEstimate, gasPrice: gasPrice, chainId: chainId }],
    });
    return txHash;
  } catch (error) {
    if (error.code === 4001) throw new Error("Transaction rejected by user");
    if (error.code === -32603) throw new Error("Transaction failed: Insufficient funds or gas");
    throw new Error(`Failed to send transaction: ${error.message}`);
  }
}

// Fetch transactions sent to the null address from a given wallet
async function fetchNullAddressTransactions(fromAddress) {
  const ETHERSCAN_API_KEY = 'YourApiKeyToken';
  const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${fromAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.result) return [];
  return data.result.filter((tx) => tx.to && tx.to.toLowerCase() === NULL_ADDRESS.toLowerCase() && tx.input && tx.input !== '0x').map((tx) => {
    try {
      const json = Buffer.from(tx.input.replace(/^0x/, ''), 'hex').toString('utf8');
      return { ...tx, decoded: JSON.parse(json) };
    } catch {
      return { ...tx, decoded: null };
    }
  });
}

export { cn, isMetaMaskInstalled, connectWallet, convertRecordToHex, sendTransaction, fetchNullAddressTransactions }; 