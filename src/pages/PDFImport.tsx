import React from 'react';
import { PDFImport } from '@/components/PDFImport';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { FinancialRecord } from '@/types/financial';
import { processBatchTransactions } from '@/utils/batch-transactions';

const PDFImportPage: React.FC = () => {
  const { addRecord, records } = useBlockchain();

  const handleAddRecords = (newRecords: FinancialRecord[]) => {
    newRecords.forEach(record => {
      addRecord(record);
    });
  };

  const handleProcessOnBlockchain = async (records: FinancialRecord[]) => {
    try {
      await processBatchTransactions(records);
    } catch (error) {
      console.error('Error processing transactions on blockchain:', error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bank Statement PDF Import
          </h1>
          <p className="text-gray-600">
            Upload your bank statement PDF to automatically extract and process transactions.
            The system supports multiple bank formats and will categorize transactions automatically.
          </p>
        </div>

        <PDFImport
          onAddRecords={handleAddRecords}
          onProcessOnBlockchain={handleProcessOnBlockchain}
        />

        {/* Current Records Summary */}
        <div className="mt-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Current Records Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFImportPage; 