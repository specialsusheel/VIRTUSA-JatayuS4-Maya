import React, { createContext, useState, useEffect, useContext } from "react";
import { connectWallet, isMetaMaskInstalled } from "@/utils/blockchain";
import { toast } from "sonner";
import { Contract } from "ethers";
import { FinancialRecord, CorrectionRecord } from "@/types/financial";
import { getContract } from "@/utils/blockchain"; // Make sure this returns ethers.Contract

interface BlockchainContextType {
  connected: boolean;
  connecting: boolean;
  account: string | null;
  connect: () => Promise<void>;
  records: FinancialRecord[];
  addRecord: (record: FinancialRecord) => void;
  corrections: CorrectionRecord[];
  addCorrection: (correction: CorrectionRecord) => void;
  getCorrectedRecords: () => FinancialRecord[];
  getNetEffectForRecord: (recordId: string) => { original: FinancialRecord; corrections: CorrectionRecord[]; netEffect: any } | null;
}

const BlockchainContext = createContext<BlockchainContextType>({
  connected: false,
  connecting: false,
  account: null,
  connect: async () => {},
  records: [],
  addRecord: () => {},
  corrections: [],
  addCorrection: () => {},
  getCorrectedRecords: () => [],
  getNetEffectForRecord: () => null,
});

export const useBlockchain = () => useContext(BlockchainContext);

interface BlockchainProviderProps {
  children: React.ReactNode;
}

export const BlockchainProvider: React.FC<BlockchainProviderProps> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [records, setRecords] = useState<FinancialRecord[]>([]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
          console.log("🔗 Already connected to:", accounts[0]);
const contract = await getContract();
fetchAllRecords(contract);

        }
      } catch (error) {
        console.error("Failed to check existing connection:", error);
      }
    };

    checkExistingConnection();
  }, []);

  // Load stored records

const fetchAllRecords = async (contract: Contract) => {
  try {
    const recordCount = await contract.getRecordCount();
    const records = [];

    for (let i = 0; i < recordCount; i++) {
      const record = await contract.getRecord(i);
      records.push({
  description: record.description,
  amount: record.amount.toString(),
  category: record.category,
  date: Number(record.timestamp).toString(), // ✅ now uses `timestamp`
  notes: record.notes || "", // ✅ added support for notes
});

    }

    console.log("📦 All Blockchain Records:", records);
    setRecords(records);

  } catch (error) {
    console.error("❌ ADDED:", error);
  }
};


  // Main connect function
  const connect = async () => {
    console.log("🚀 Connect function called");
    console.log("📊 Current state:", { connected, connecting, account });

    // Prevent multiple simultaneous connections
    if (connecting) {
      console.log("⏳ Already connecting, ignoring...");
      return;
    }

    // Check if already connected
    if (connected && account) {
      console.log("✅ Already connected to:", account);
      return;
    }

    setConnecting(true);
    console.log("🔄 Setting connecting to true");

    try {
      const newAccount = await connectWallet();
      
      if (newAccount) {
        setAccount(newAccount);
        setConnected(true);
        console.log("🎉 Successfully connected:", newAccount);
        toast.success("Wallet connected successfully!");
        const contract = await getContract();
fetchAllRecords(contract);

      } else {
        throw new Error("No account returned");
      }
    } catch (error: any) {
      console.error("❌ Connection error:", error);
      toast.error(error.message || "Failed to connect wallet");
      setConnected(false);
      setAccount(null);
    } finally {
      setConnecting(false);
      console.log("✅ Setting connecting to false");
    }
  };

  // Add financial record
  const addRecord = (record: FinancialRecord) => {
    console.log("🔄 Adding record to context:", record);
    
    // Ensure record has a unique ID
    const recordWithId = { 
      ...record, 
      id: record.id || `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: record.timestamp || Date.now()
    };
    
    const newRecords = [...records, recordWithId];
    setRecords(newRecords);
    
    console.log("📊 Total records after adding:", newRecords.length);
    
    try {
      fetch("http://localhost:3001/api/transactions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(recordWithId),
})
  .then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    console.log("✅ Record saved to MySQL via Express API");
  })
  .catch((err) => {
    console.error("❌ Failed to save record to backend:", err);
    toast.error("Failed to store transaction in database");
  });

    } catch (error) {
      console.error("Failed to store records:", error);
    }
  };

  // Get corrections from records
  const corrections = records.filter(record => record.recordType === 'correction') as CorrectionRecord[];

  // Add correction record
  const addCorrection = (correction: CorrectionRecord) => {
    addRecord(correction);
  };

  // Get records that have been corrected
  const getCorrectedRecords = (): FinancialRecord[] => {
    const correctedRecordIds = corrections.map(correction => 
      correction.correctionData?.originalRecordId
    );
    
    return records.filter(record => 
      correctedRecordIds.includes(record.id)
    );
  };

  // Get net effect for a specific record
  const getNetEffectForRecord = (recordId: string) => {
    const originalRecord = records.find(record => record.id === recordId);
    if (!originalRecord) return null;

    const recordCorrections = corrections.filter(correction => 
      correction.correctionData?.originalRecordId === recordId
    );

    if (recordCorrections.length === 0) return null;

    // Calculate net effect
    let netAmount = parseFloat(originalRecord.amount);
    let netDescription = originalRecord.description;
    let netCategory = originalRecord.category;
    let netDate = originalRecord.date;
    let netNotes = originalRecord.notes || "";

    recordCorrections.forEach(correction => {
      if (correction.correctionData.correctedFields.includes('amount')) {
        netAmount = parseFloat(correction.amount);
      }
      if (correction.correctionData.correctedFields.includes('description')) {
        netDescription = correction.description;
      }
      if (correction.correctionData.correctedFields.includes('category')) {
        netCategory = correction.category;
      }
      if (correction.correctionData.correctedFields.includes('date')) {
        netDate = correction.date;
      }
      if (correction.correctionData.correctedFields.includes('notes')) {
        netNotes = correction.notes || "";
      }
    });

    return {
      original: originalRecord,
      corrections: recordCorrections,
      netEffect: {
        amount: netAmount.toFixed(2),
        description: netDescription,
        category: netCategory,
        date: netDate,
        notes: netNotes,
        difference: (netAmount - parseFloat(originalRecord.amount)).toFixed(2)
      }
    };
  };

  // Handle account/network changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("🔄 Accounts changed:", accounts);
      if (accounts.length === 0) {
        setConnected(false);
        setAccount(null);
        toast.info("Wallet disconnected");
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        setConnected(true);
        toast.success("Account switched");
      }
    };

    const handleChainChanged = () => {
      console.log("🔗 Chain changed, reloading...");
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [account]);

  const contextValue = {
    connected,
    connecting,
    account,
    connect,
    records,
    addRecord,
    corrections,
    addCorrection,
    getCorrectedRecords,
    getNetEffectForRecord
  };

  console.log("🔍 Context value:", contextValue);

  return (
    <BlockchainContext.Provider value={contextValue}>
      {children}
    </BlockchainContext.Provider>
  );
};
