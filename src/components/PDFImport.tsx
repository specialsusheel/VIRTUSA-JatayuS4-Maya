import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Download,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Banknote,
  CreditCard,
  Building
} from "lucide-react";
import { BankStatementParser, BankStatementParseResult } from "@/utils/pdf-parser";
import { BatchPDFProcessor, BatchPDFProcessStatus } from "@/utils/batch-pdf-processor";
import { processPDFTransactionsWithContract } from "@/utils/smart-contract-batch";
import { FinancialRecord } from "@/types/financial";
import { toast } from "sonner";
import { formatCurrency } from "@/config/currency";

interface PDFImportProps {
  onAddRecords: (records: FinancialRecord[]) => void;
  onProcessOnBlockchain?: (records: FinancialRecord[]) => Promise<void>;
}

export const PDFImport: React.FC<PDFImportProps> = ({ 
  onAddRecords, 
  onProcessOnBlockchain 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<BankStatementParseResult | null>(null);
  const [processingStatus, setProcessingStatus] = useState<BatchPDFProcessStatus | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processor] = useState(() => new BatchPDFProcessor());

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file');
      return;
    }

    setSelectedFile(file);
    setParseResult(null);
    setProcessingStatus(null);
    setShowPreview(false);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Parse PDF
  const handleParsePDF = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const parser = new BankStatementParser();
      const result = await parser.parsePDF(selectedFile);
      setParseResult(result);

      if (result.success) {
        toast.success(`Successfully parsed ${result.validTransactions} transactions from ${result.bankName || 'bank statement'}`);
      } else {
        toast.error(`Failed to parse PDF: ${result.errors.join(', ')}`);
      }
    } catch (error: any) {
      toast.error(`Error parsing PDF: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process transactions
  const handleProcessTransactions = async () => {
    if (!parseResult || !parseResult.success) return;

    setIsProcessing(true);
    try {
      console.log("🔄 Processing PDF transactions:", parseResult.transactions);
      
      // First, add records to context immediately
      const records = parseResult.transactions.map((tx, index) => ({
        id: `pdf-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        description: tx.description,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        notes: tx.notes || `Imported from ${tx.bankName || 'bank statement'}`,
        recordType: 'original' as const,
        timestamp: Date.now() + index, // Ensure unique timestamps
      }));

      console.log("📝 Converted records:", records);

      // Add to context
      records.forEach((record, index) => {
        console.log(`📤 Adding record ${index + 1}/${records.length}:`, record);
        onAddRecords([record]);
      });

      // Process on blockchain using smart contract
      if (onProcessOnBlockchain) {
        const result = await processPDFTransactionsWithContract(
          records,
          undefined,
          (progress) => {
            // Update processing status
            setProcessingStatus(prev => prev ? {
              ...prev,
              processedTransactions: Math.floor((progress / 100) * records.length),
              currentStep: progress < 25 ? 'parsing' : 
                         progress < 50 ? 'validating' : 
                         progress < 75 ? 'categorizing' : 
                         progress < 100 ? 'blockchain' : 'complete'
            } : null);
          }
        );

        if (result.success) {
          setProcessingStatus({
            isProcessing: false,
            totalTransactions: records.length,
            processedTransactions: result.processedRecords,
            failedTransactions: result.failedRecords,
            currentStep: 'complete',
            errors: result.error ? [result.error] : [],
            warnings: [],
          });
        } else {
          setProcessingStatus({
            isProcessing: false,
            totalTransactions: records.length,
            processedTransactions: 0,
            failedTransactions: records.length,
            currentStep: 'complete',
            errors: result.error ? [result.error] : [],
            warnings: [],
          });
        }
      } else {
        // Just add to context without blockchain processing
        setProcessingStatus({
          isProcessing: false,
          totalTransactions: records.length,
          processedTransactions: records.length,
          failedTransactions: 0,
          currentStep: 'complete',
          errors: [],
          warnings: [],
        });
      }

      toast.success(`Successfully processed ${records.length} transactions from ${parseResult.bankName || 'bank statement'}`);
    } catch (error: any) {
      toast.error(`Error processing transactions: ${error.message}`);
      setProcessingStatus({
        isProcessing: false,
        totalTransactions: 0,
        processedTransactions: 0,
        failedTransactions: 0,
        currentStep: 'complete',
        errors: [error.message],
        warnings: [],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset everything
  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    setProcessingStatus(null);
    setShowPreview(false);
    processor.reset();
  };

  // Get progress percentage
  const getProgressPercentage = () => {
    if (!processingStatus) return 0;
    if (processingStatus.totalTransactions === 0) return 0;
    return (processingStatus.processedTransactions / processingStatus.totalTransactions) * 100;
  };

  // Get step color
  const getStepColor = (step: string) => {
    if (!processingStatus) return 'text-gray-400';
    
    const steps = ['parsing', 'validating', 'categorizing', 'blockchain', 'complete'];
    const currentIndex = steps.indexOf(processingStatus.currentStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'text-green-500';
    if (stepIndex === currentIndex) return 'text-blue-500';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Bank Statement PDF Import
          </CardTitle>
          <CardDescription>
            Upload your bank statement PDF to automatically extract and process transactions.
            Supports multiple bank formats and batch processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {selectedFile ? selectedFile.name : 'Drop your bank statement PDF here'}
              </p>
              <p className="text-sm text-gray-500">
                {selectedFile ? 'Click to change file' : 'or click to browse'}
              </p>
            </label>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          {selectedFile && (
            <div className="flex gap-3">
              <Button
                onClick={handleParsePDF}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Parse PDF
              </Button>
              
              {parseResult && parseResult.success && (
                <Button
                  onClick={handleProcessTransactions}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Process Transactions
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parse Results */}
      {parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Parse Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {parseResult.totalTransactions}
                </p>
                <p className="text-sm text-gray-600">Total Transactions</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {parseResult.validTransactions}
                </p>
                <p className="text-sm text-gray-600">Valid Transactions</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {parseResult.invalidTransactions}
                </p>
                <p className="text-sm text-gray-600">Invalid Transactions</p>
              </div>
            </div>

            {/* Bank Info */}
            {parseResult.bankName && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Bank:</span>
                <Badge variant="outline">{parseResult.bankName}</Badge>
              </div>
            )}

            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {parseResult.errors.map((error, index) => (
                      <p key={index} className="text-sm">{error}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {parseResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {parseResult.warnings.map((warning, index) => (
                      <p key={index} className="text-sm">{warning}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview Toggle */}
            {parseResult.success && parseResult.transactions.length > 0 && (
              <div>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </Button>

                {/* Transaction Preview */}
                {showPreview && (
                  <div className="mt-4 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {parseResult.transactions.slice(0, 10).map((tx, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-sm text-gray-500">{tx.date}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              parseFloat(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(parseFloat(tx.amount))}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {tx.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {parseResult.transactions.length > 10 && (
                        <p className="text-center text-sm text-gray-500">
                          ... and {parseResult.transactions.length - 10} more transactions
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {processingStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className={`h-5 w-5 ${isProcessing ? 'animate-spin' : ''}`} />
              Processing Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(getProgressPercentage())}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>

            {/* Processing Steps */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {['parsing', 'validating', 'categorizing', 'blockchain', 'complete'].map((step) => (
                <div key={step} className={`text-center p-2 rounded-lg ${
                  getStepColor(step) === 'text-green-500' ? 'bg-green-50' :
                  getStepColor(step) === 'text-blue-500' ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  <p className={`text-xs font-medium ${getStepColor(step)}`}>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </p>
                </div>
              ))}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">
                  {processingStatus.processedTransactions}
                </p>
                <p className="text-sm text-gray-600">Processed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">
                  {processingStatus.failedTransactions}
                </p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-600">
                  {processingStatus.totalTransactions}
                </p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>

            {/* Errors */}
            {processingStatus.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {processingStatus.errors.map((error, index) => (
                      <p key={index} className="text-sm">{error}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {processingStatus.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {processingStatus.warnings.map((warning, index) => (
                      <p key={index} className="text-sm">{warning}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};