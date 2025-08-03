import React, { useState } from "react";
import { formatCurrency } from "@/config/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinancialRecord } from "@/types/financial";
import CorrectionForm from "./CorrectionForm";
import { useBlockchain } from "@/contexts/BlockchainContext";

const CorrectionTest: React.FC = () => {
  const { records, connected } = useBlockchain();
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [testRecord, setTestRecord] = useState<FinancialRecord | null>(null);

  // Create a test record
  const createTestRecord = () => {
    const testRecord: FinancialRecord = {
      id: "test-record-" + Date.now(),
      description: "Test Transaction",
      amount: "100.00",
      category: "expense",
      date: "2024-01-15",
      notes: "This is a test transaction for correction testing",
      recordType: "original",
      transactionHash: "0x1234567890abcdef1234567890abcdef12345678",
      timestamp: Date.now(),
    };
    setTestRecord(testRecord);
    setShowCorrectionForm(true);
  };

  const handleCorrectionComplete = () => {
    setShowCorrectionForm(false);
    setTestRecord(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Correction System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          This test component helps verify the correction system is working properly.
        </div>
        
        <div className="space-y-2">
          <div><strong>Wallet Status:</strong> {connected ? "Connected" : "Not Connected"}</div>
          <div><strong>Total Records:</strong> {records.length}</div>
          <div><strong>Original Records:</strong> {records.filter(r => r.recordType === 'original').length}</div>
          <div><strong>Correction Records:</strong> {records.filter(r => r.recordType === 'correction').length}</div>
        </div>

        <Button onClick={createTestRecord} disabled={!connected}>
          Test Correction Form
        </Button>

        {testRecord && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Test Record Created:</h4>
            <div className="text-sm space-y-1">
              <div><strong>Description:</strong> {testRecord.description}</div>
              <div><strong>Amount:</strong> {formatCurrency(testRecord.amount)}</div>
              <div><strong>Category:</strong> {testRecord.category}</div>
              <div><strong>Date:</strong> {testRecord.date}</div>
              <div><strong>Transaction Hash:</strong> {testRecord.transactionHash}</div>
            </div>
          </div>
        )}

        {/* Correction Form Modal */}
        {showCorrectionForm && testRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Test Correction</h2>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleCorrectionComplete}
                  >
                    ×
                  </Button>
                </div>
                <CorrectionForm 
                  onCorrectionComplete={handleCorrectionComplete}
                  preselectedRecord={testRecord}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CorrectionTest;