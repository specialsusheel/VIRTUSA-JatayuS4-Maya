import React from "react";
import { BlockchainProvider } from "@/contexts/BlockchainContext";
import DashboardHeader from "@/components/DashboardHeader";
import CSVImport from "@/components/CSVImport";

const CSVImportPage: React.FC = () => {
  return (
    <BlockchainProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-6">
          <DashboardHeader />
          
          <div className="mt-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">CSV Import</h1>
              <p className="text-gray-600 mt-2">
                Import transaction data from CSV files and execute them on the blockchain
              </p>
            </div>
            
            <CSVImport 
              onImportComplete={(records) => {
                console.log('Import completed:', records);
              }}
            />
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

export default CSVImportPage; 