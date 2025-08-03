
import React from "react";
import { BlockchainProvider } from "@/contexts/BlockchainContext";
import FinancialRecordForm from "@/components/FinancialRecordForm";
import TransactionHistory from "@/components/TransactionHistory";
import DashboardHeader from "@/components/DashboardHeader";

const Index = () => {
  return (
    <BlockchainProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-6">
          <DashboardHeader />

          <div className="grid grid-cols-1 gap-8">
            <FinancialRecordForm />
            <TransactionHistory />
          </div>
          
          <footer className="mt-16 py-4 text-center text-sm text-muted-foreground">
            <p>
              VIRTUSA LEDGER - Blockchain-Powered Financial Assistant
              <br />
              Running on Sepolia Testnet
            </p>
          </footer>
        </div>
      </div>
    </BlockchainProvider>
  );
};

export default Index;
