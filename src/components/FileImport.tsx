import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Building,
  FileSpreadsheet,
  FileImage
} from "lucide-react";
import { BankStatementParser, BankStatementParseResult } from "@/utils/pdf-parser";
import { BatchPDFProcessor, BatchPDFProcessStatus } from "@/utils/batch-pdf-processor";
import { processPDFTransactionsWithContract } from "@/utils/smart-contract-batch";
import { importCSV, convertCSVTransactionToRecord } from "@/utils/csv-import";
import { CSVImportResult } from "@/types/financial";
import { FinancialRecord } from "@/types/financial";
import { toast } from "sonner";
import { formatCurrency } from "@/config/currency";

interface FileImportProps {
  onAddRecords: (records: FinancialRecord[]) => void;
  onProcessOnBlockchain?: (records: FinancialRecord[]) => Promise<void>;
}

export const FileImport: React.FC<FileImportProps> = ({ 
  onAddRecords, 
  onProcessOnBlockchain 
}) => {
  const [activeTab, setActiveTab] = useState("csv");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<BankStatementParseResult | CSVImportResult | null>(null);
  const [processingStatus, setProcessingStatus] = useState<BatchPDFProcessStatus | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processor] = useState(() => new BatchPDFProcessor());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const isPDF = file.type === 'application/pdf';
    const isCSV = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    
    if (!isPDF && !isCSV) {
      toast.error('Please select a valid PDF or CSV file');
      return;
    }

    setSelectedFile(file);
    setParseResult(null);
    setProcessingStatus(null);
    setShowPreview(false);
    
    // Auto-switch to appropriate tab
    if (isPDF) {
      setActiveTab("pdf");
    } else if (isCSV) {
      setActiveTab("csv");
    }
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

  // Parse file based on type
  const handleParseFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      if (selectedFile.type === 'application/pdf') {
        // Parse PDF
        const parser = new BankStatementParser();
        const result = await parser.parsePDF(selectedFile);
        console.log("📥 Raw PDF Parse Result:", result);
console.table(result.transactions); // if result.success

        setParseResult(result);

        if (result.success) {
          toast.success(`Successfully parsed ${result.validTransactions} transactions from ${result.bankName || 'bank statement'}`);
        } else {
          toast.error(`Failed to parse PDF: ${result.errors.join(', ')}`);
        }
      } else {
        // Parse CSV
        const content = await selectedFile.text();
        const result = importCSV(content);
        setParseResult(result);

        if (result.success) {
          toast.success(`Successfully parsed ${result.validRows} transactions from CSV`);
        } else {
          toast.error(`Failed to parse CSV: ${result.errors.join(', ')}`);
        }
      }
    } catch (error: any) {
      toast.error(`Error parsing file: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process transactions
  const handleProcessTransactions = async () => {
    if (!parseResult || !parseResult.success) return;

    setIsProcessing(true);
    try {
      let records: FinancialRecord[] = [];

      if ('transactions' in parseResult) {
        // PDF parsing result
        const pdfResult = parseResult as BankStatementParseResult;
        
        records = pdfResult.transactions.map((tx, index) => ({

          id: `pdf-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          description: tx.description,
          amount: tx.amount,
          category: tx.category,
          date: tx.date,
          notes: tx.notes || `Imported from ${tx.bankName || 'bank statement'}`,
          recordType: 'original' as const,
          timestamp: Date.now() + index,


        } ) ) ;
      } else {
        // CSV parsing result
        const csvResult = parseResult as CSVImportResult;
        records = csvResult.data.map((csvTx, index) => ({
          ...convertCSVTransactionToRecord(csvTx),
          id: `csv-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now() + index,
        }));
      }

      console.log("📝 Converted records:", records);

  


      // Process on blockchain using smart contract
     if (onProcessOnBlockchain) {
  await onProcessOnBlockchain(records);
;
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

      const sourceType = 'transactions' in parseResult ? 'PDF' : 'CSV';
      toast.success(`Successfully processed ${records.length} transactions from ${sourceType} file`);
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

  // Get file type info
  const getFileTypeInfo = () => {
    if (!selectedFile) return null;
    
    const isPDF = selectedFile.type === 'application/pdf';
    const isCSV = selectedFile.type === 'text/csv' || selectedFile.name.toLowerCase().endsWith('.csv');
    
    return {
      type: isPDF ? 'PDF' : isCSV ? 'CSV' : 'Unknown',
      icon: isPDF ? FileImage : FileSpreadsheet,
      color: isPDF ? 'text-red-500' : 'text-green-500',
      bgColor: isPDF ? 'bg-red-50' : 'bg-green-50',
    };
  };

  const fileTypeInfo = getFileTypeInfo();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Import
          </CardTitle>
          <CardDescription>
            Import financial transactions from CSV files or bank statement PDFs.
            All transactions are processed using smart contracts for blockchain storage.
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
              accept=".csv,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
              id="file-upload"
              ref={fileInputRef}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {selectedFile ? selectedFile.name : 'Drop your CSV or PDF file here'}
              </p>
              <p className="text-sm text-gray-500">
                {selectedFile ? 'Click to change file' : 'or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supports: CSV files and bank statement PDFs
              </p>
            </label>
          </div>

          {/* Selected File Info */}
          {selectedFile && fileTypeInfo && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${fileTypeInfo.bgColor}`}>
                  <fileTypeInfo.icon className={`h-5 w-5 ${fileTypeInfo.color}`} />
                </div>
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {fileTypeInfo.type} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
                onClick={handleParseFile}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Parse File
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
                  Process with Smart Contract
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
                  {'transactions' in parseResult ? parseResult.totalTransactions : parseResult.totalRows}
                </p>
                <p className="text-sm text-gray-600">Total Records</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {'transactions' in parseResult ? parseResult.validTransactions : parseResult.validRows}
                </p>
                <p className="text-sm text-gray-600">Valid Records</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {'transactions' in parseResult ? parseResult.invalidTransactions : parseResult.invalidRows}
                </p>
                <p className="text-sm text-gray-600">Invalid Records</p>
              </div>
            </div>

            {/* File Type Info */}
            {'bankName' in parseResult && parseResult.bankName && (
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
            {parseResult.success && (
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
                      {('transactions' in parseResult ? parseResult.transactions : parseResult.data).slice(0, 10).map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">
                              {'description' in item ? item.description : item.Description || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {'date' in item ? item.date : item.Date || 'Unknown Date'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              parseFloat('amount' in item ? item.amount : item.Amount || '0') >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(parseFloat('amount' in item ? item.amount : item.Amount || '0'))}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {'category' in item ? item.category : item.Category || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {('transactions' in parseResult ? parseResult.transactions : parseResult.data).length > 10 && (
                        <p className="text-center text-sm text-gray-500">
                          ... and {('transactions' in parseResult ? parseResult.transactions : parseResult.data).length - 10} more records
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
              Smart Contract Processing Status
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