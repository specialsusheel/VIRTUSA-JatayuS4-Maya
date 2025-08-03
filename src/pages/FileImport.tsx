import React from 'react';
import { FileImport } from '@/components/FileImport';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { FinancialRecord } from '@/types/financial';
import { processBatchTransactions } from '@/utils/batch-transactions';
import { FileSpreadsheet, FileImage } from 'lucide-react';
import { getContract } from '@/utils/blockchain';

const FileImportPage: React.FC = () => {
  const { addRecord, records } = useBlockchain();
  
  const handleAddRecords = async (newRecords: FinancialRecord[]) => {
    const filtered = newRecords.filter((r) => {
      const amt = parseFloat(r.amount);
      return !isNaN(amt) && Math.abs(amt) > 0.009;
    });

    const skipped = newRecords.length - filtered.length;
    if (skipped > 0) {
      console.warn(`${skipped} invalid or zero-value records were skipped.`);
    }

    await handleProcessOnBlockchain(filtered);
  };

  const handleProcessOnBlockchain = async (records: FinancialRecord[]) => {
    try {
      const contract = await getContract(); // ✅ await here

      const descriptions = records.map((r) => r.description);
      const amounts = records.map((r) =>
        BigInt(Math.floor(Math.abs(parseFloat(r.amount)) * 100))
      );
      const categories = records.map((r) => r.category);
      const dates = records.map((r) => Math.floor(new Date(r.date).getTime() / 1000)); // UNIX timestamp
      const isExpense = records.map((r) => parseFloat(r.amount) < 0);

      const notes = records.map((r) => r.notes || ""); // fallback to empty string if missing

      const tx = await contract.addRecords(descriptions, amounts, categories, notes, isExpense);

      await tx.wait();

      console.log("✅ All transactions added to blockchain:", tx.hash);
    } catch (err) {
      console.error("❌ Blockchain batch error:", err);
    }
  };

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            File Import
          </h1>
          <p className="text-gray-600">
            Import financial transactions from CSV files or bank statement PDFs.
            All transactions are processed using smart contracts for secure blockchain storage.
          </p>
        </div>
        <FileImport
          onAddRecords={handleAddRecords} // now it only processes via blockchain
          onProcessOnBlockchain={handleProcessOnBlockchain}
        />

        {/* Current Records Summary */}
        <div className="mt-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Current Records Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Records:</span>
                <span className="ml-2 text-blue-700">{records.length}</span>
              </div>
              <div>
                <span className="font-medium">Income Records:</span>
                <span className="ml-2 text-green-700">
                  {records.filter(r => r.category.toLowerCase() === 'income').length}
                </span>
              </div>
              <div>
                <span className="font-medium">Expense Records:</span>
                <span className="ml-2 text-red-700">
                  {records.filter(r => r.category.toLowerCase() === 'expense').length}
                </span>
              </div>
              <div>
                <span className="font-medium">Other Records:</span>
                <span className="ml-2 text-gray-700">
                  {records.filter(r => !['income', 'expense'].includes(r.category.toLowerCase())).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Import Instructions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              CSV Import
            </h3>
            <ul className="text-sm text-green-800 space-y-2">
              <li>• Upload CSV files with transaction data</li>
              <li>• Supports standard CSV format with headers</li>
              <li>• Automatic categorization of transactions</li>
              <li>• Batch processing with smart contracts</li>
            </ul>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              PDF Import
            </h3>
            <ul className="text-sm text-red-800 space-y-2">
              <li>• Upload bank statement PDFs</li>
              <li>• Supports multiple bank formats</li>
              <li>• Automatic transaction extraction</li>
              <li>• Smart contract batch processing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileImportPage;