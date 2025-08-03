import React, { createContext, useState, useEffect, useContext } from "react";
import { connectWallet, isMetaMaskInstalled } from "./utils";
import { toast } from "sonner";

/**
 * @typedef {Object} BlockchainContextType
 * @property {boolean} connected
 * @property {boolean} connecting
 * @property {string|null} account
 * @property {function(): Promise<void>} connect
 * @property {Array} records
 * @property {function(Object): void} addRecord
 */

const BlockchainContext = createContext({
  connected: false,
  connecting: false,
  account: null,
  connect: async () => {},
  records: [],
  addRecord: () => {},
});

export function useBlockchain() {
  return useContext(BlockchainContext);
}

export function BlockchainProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!isMetaMaskInstalled()) return;
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
          loadStoredRecords();
        }
      } catch (error) {
        console.error("Failed to check existing connection:", error);
      }
    };
    checkExistingConnection();
  }, []);

  const loadStoredRecords = () => {
    try {
      const stored = localStorage.getItem("financialRecords");
      if (stored) setRecords(JSON.parse(stored));
    } catch (error) {
      console.error("Failed to load records:", error);
    }
  };

  const connect = async () => {
    if (connecting) return;
    if (connected && account) return;
    setConnecting(true);
    try {
      const newAccount = await connectWallet();
      if (newAccount) {
        setAccount(newAccount);
        setConnected(true);
        toast.success("Wallet connected successfully!");
        loadStoredRecords();
      } else {
        throw new Error("No account returned");
      }
    } catch (error) {
      toast.error(error.message || "Failed to connect wallet");
      setConnected(false);
      setAccount(null);
    } finally {
      setConnecting(false);
    }
  };

  const addRecord = (record) => {
    const newRecords = [...records, { ...record, id: Date.now().toString() }];
    setRecords(newRecords);
    try {
      localStorage.setItem("financialRecords", JSON.stringify(newRecords));
    } catch (error) {
      console.error("Failed to store records:", error);
    }
  };

  useEffect(() => {
    if (!isMetaMaskInstalled()) return;
    const handleAccountsChanged = (accounts) => {
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
  };

  return (
    <BlockchainContext.Provider value={contextValue}>
      {children}
    </BlockchainContext.Provider>
  );
} 