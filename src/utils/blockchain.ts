import { FinancialRecord, CorrectionRecord, CorrectionFormData } from "@/types/financial";
import { Buffer } from "buffer"; // Ensure Buffer is available if not polyfilled by create-react-app or webpack
import { ethers } from "ethers"; // ✅ ADD THIS
import { parseEther } from "ethers"; // ✅ keep this or remove — it's already included via `ethers.parseEther`
import FinancialRecords from '../abi/FinancialRecords.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}
// or use '@/abi/FinancialRecords.json' if you have alias setup

const CONTRACT_ADDRESS = "0xa6ed2b568bedcea0a72faa492652b4257e3a4e77";

export async function getContract(): Promise<ethers.Contract> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

const abi = FinancialRecords; // 👈 Directly use the ABI array
  return new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
}







const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
};

export const connectWallet = async (): Promise<string | null> => {
  console.log("🔄 Starting wallet connection...");

  if (!isMetaMaskInstalled()) {
    console.log("❌ MetaMask not found");
    window.open("https://metamask.io/download/", "_blank");
    throw new Error("MetaMask is not installed");
  }

  try {
    console.log("📞 Requesting accounts from MetaMask...");
    
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    console.log("✅ Accounts received:", accounts);

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    const account = accounts[0];
    console.log("🎯 Connected to account:", account);
    
    return account;
  } catch (error: any) {
    console.error("💥 Connection failed:", error);
    
    if (error.code === 4001) {
      throw new Error("Connection rejected by user");
    } else if (error.code === -32002) {
      throw new Error("Connection request already pending");
    } else {
      throw new Error("Failed to connect wallet");
    }
  }
};

export const convertRecordToHex = (record: FinancialRecord): string => {
  console.log("🔄 Converting record to hex:", record);
  
  const jsonString = JSON.stringify({
    description: record.description,
    amount: record.amount,
    category: record.category,
    date: record.date,
    notes: record.notes || "",
    timestamp: Date.now(),
    recordType: record.recordType || 'original'
  });
  
  const hex = "0x" + Buffer.from(jsonString, 'utf8').toString('hex');
  console.log("✅ Hex data generated:", hex);
  
  return hex;
};

export const convertCorrectionToHex = (correction: CorrectionRecord): string => {
  console.log("🔄 Converting correction to hex:", correction);
  
  const jsonString = JSON.stringify({
    recordType: 'correction',
    originalTransactionHash: correction.correctionData.originalTransactionHash,
    originalRecordId: correction.correctionData.originalRecordId,
    correctionReason: correction.correctionData.correctionReason,
    correctionType: correction.correctionData.correctionType,
    correctedFields: correction.correctionData.correctedFields,
    description: correction.description,
    amount: correction.amount,
    category: correction.category,
    date: correction.date,
    notes: correction.notes || "",
    timestamp: Date.now()
  });
  
  const hex = "0x" + Buffer.from(jsonString, 'utf8').toString('hex');
  console.log("✅ Correction hex data generated:", hex);
  
  return hex;
};

export const sendTransaction = async (record: FinancialRecord): Promise<string | null> => {
  console.log("🔄 Sending transaction with record:", record);

  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) {
      throw new Error("No connected accounts");
    }

    const contract = await getContract();

    const description = String(record.description);
    const rawAmount = BigInt(record.amount); // can be negative
    const amount = rawAmount < 0n ? -rawAmount : rawAmount; // make positive for uint256
    const isExpense = rawAmount < 0n; // flag if negative = expense
    const category = String(record.category);
    const notes = String(record.notes || "");

    // ✅ Add the console log here
    console.log("🧪 Calling addRecords with:", {
  description: [description],
  amount: [amount],
  category: [category],
  notes: [notes],
  isExpense: [isExpense],
  types: {
    description: typeof description,
    amount: typeof amount,
    category: typeof category,
    notes: typeof notes,
    isExpense: typeof isExpense
  }
});


    const tx = await contract.addRecords(
      [description],     // string[]
      [amount],          // uint256[]
      [category],        // string[]
      [notes],           // string[]
      [isExpense]        // bool[]
    );

    console.log("✅ Transaction submitted:", tx.hash);
    await tx.wait();
    return tx.hash;

  } catch (error: any) {
    console.error("💥 Transaction failed:", error);
    throw new Error(`Transaction failed: ${error.message}`);
  }
};




export const sendCorrectionTransaction = async (correction: CorrectionRecord): Promise<string | null> => {
  console.log("🔄 Sending correction transaction:", correction);

  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) {
      throw new Error("No connected accounts");
    }

    const contract = await getContract();

    const description = correction.description;
    const rawAmount = BigInt(correction.amount);
    const amount = rawAmount < 0n ? -rawAmount : rawAmount; // ✅ make positive
    const isExpense = rawAmount < 0n;

    const category = correction.category;
    const notes = `CORRECTION | Reason: ${correction.correctionData.correctionReason}, Original Hash: ${correction.correctionData.originalTransactionHash}, Corrected Fields: ${JSON.stringify(correction.correctionData.correctedFields)}${correction.notes ? ' | ' + correction.notes : ''}`;

    const tx = await contract.addRecords(
  [description],     // string[]
  [amount],          // uint256[]
  [category],        // string[]
  [notes],           // string[]
  [isExpense]        // bool[]
);


    console.log("✅ Correction transaction submitted:", tx.hash);
    await tx.wait();
    return tx.hash;

  } catch (error: any) {
    console.error("💥 Correction transaction failed:", error);
    throw new Error(`Correction failed: ${error.message}`);
  }
};



export const validateCorrection = (
  originalRecord: FinancialRecord, 
  correctionData: CorrectionFormData
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("🔍 Validating correction:", { originalRecord, correctionData });

  if (!originalRecord) {
    errors.push("Original record not found");
  }

  if (originalRecord && !originalRecord.transactionHash) {
    errors.push("Original record must be confirmed on blockchain");
  }

  if (originalRecord && originalRecord.recordType === 'correction') {
    errors.push("Cannot correct a correction record");
  }

  if (!correctionData.correctionReason || correctionData.correctionReason.trim().length < 10) {
    errors.push("Correction reason must be at least 10 characters");
  }

  let hasChanges = false;
  if (originalRecord) {
    if (correctionData.correctedData.description !== originalRecord.description) hasChanges = true;
    if (correctionData.correctedData.amount !== originalRecord.amount) hasChanges = true;
    if (correctionData.correctedData.category !== originalRecord.category) hasChanges = true;
    if (correctionData.correctedData.date !== originalRecord.date) hasChanges = true;
    if (correctionData.correctedData.notes !== (originalRecord.notes || "")) hasChanges = true;
  }
  
  if (!hasChanges) {
    errors.push("At least one field must be corrected");
  }

  if (correctionData.correctedData.amount && originalRecord) {
    const originalAmount = parseFloat(originalRecord.amount);
    const correctedAmount = parseFloat(correctionData.correctedData.amount);
    const difference = Math.abs(originalAmount - correctedAmount);
    const percentageChange = (difference / originalAmount) * 100;
    
    if (percentageChange > 50) {
      warnings.push("Large amount change detected. Please verify the correction.");
    }
  }

  console.log("✅ Validation result:", { isValid: errors.length === 0, errors, warnings });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const calculateNetEffect = (originalRecord: FinancialRecord, correctionRecord: CorrectionRecord) => {
  const originalAmount = parseFloat(originalRecord.amount);
  const correctedAmount = parseFloat(correctionRecord.amount);
  const difference = correctedAmount - originalAmount;

  return {
    originalAmount: originalRecord.amount,
    correctedAmount: correctionRecord.amount,
    difference: difference.toFixed(2)
  };
};

export async function fetchNullAddressTransactions(fromAddress: string): Promise<any[]> {
  const ETHERSCAN_API_KEY = 'YourApiKeyToken';
  const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${fromAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.result) return [];
  const nullTxs = data.result.filter((tx: any) => tx.to && tx.to.toLowerCase() === NULL_ADDRESS.toLowerCase() && tx.input && tx.input !== '0x');
  return nullTxs.map((tx: any) => {
    try {
      const json = Buffer.from(tx.input.replace(/^0x/, ''), 'hex').toString('utf8');
      return { ...tx, decoded: JSON.parse(json) };
    } catch {
      return { ...tx, decoded: null };
    }
  });
}

export async function getAllBlockchainRecords(): Promise<FinancialRecord[]> {
  const contract = await getContract();
  const recordCount = await contract.getRecordCount();
  const records: FinancialRecord[] = [];

  for (let i = 0; i < recordCount; i++) {
    const [description, amount, category, date] = await contract.getRecord(i);

    records.push({
      id: `${i}`,
      description,
      amount: amount.toString(),
      category,
      date: new Date(Number(date) * 1000).toISOString().split("T")[0], // YYYY-MM-DD
      timestamp: Number(date),
      transactionHash: "", // (You can optionally fetch this via Etherscan API later)
      recordType: "original",
    });
  }

  return records;
}
