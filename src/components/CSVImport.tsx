import React, { useState, useRef } from "react";
import { formatCurrency } from "@/config/currency";
import { CSVTransaction, CSVImportResult, BatchImportStatus, CSVImportConfig } from "@/types/financial";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Download,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { importCSV } from "@/utils/csv-import";
import { processBatchTransactions, retryFailedTransactions, cancelBatchProcessing, getBatchSummary, validateBatchConfig, DEFAULT_BATCH_CONFIG } from "@/utils/batch-transactions";
import { convertCSVTransactionToRecord } from "@/utils/csv-import";
import { useBlockchain } from "@/contexts/BlockchainContext";

interface CSVImportProps {
  onImportComplete?: (records: any[]) => void;
}

const CSVImport: React.FC<CSVImportProps> = ({ onImportComplete }) => {
  const { connected, addRecord } = useBlockchain();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [csvContent, setCsvContent] = useState<string>("");
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchImportStatus | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<CSVImportConfig>(DEFAULT_BATCH_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      const content = await file.text();
      setCsvContent(content);
      
      // Auto-import the CSV
      const result = importCSV(content, config);
      setImportResult(result);
      
      if (result.success) {
        toast.success(`Successfully parsed ${result.validRows} transactions`);
      } else {
        toast.error(`Import failed: ${result.errors.length} errors found`);
      }
    } catch (error) {
      toast.error('Failed to read CSV file');
      console.error('File read error:', error);
    }
  };

  // Handle CSV content input
  const handleCsvContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = event.target.value;
    setCsvContent(content);
    
    if (content.trim()) {
      const result = importCSV(content, config);
      setImportResult(result);
    } else {
      setImportResult(null);
    }
  };

  // Process batch transactions
  const handleBatchProcess = async () => {
    if (!importResult || importResult.data.length === 0) {
      toast.error('No valid transactions to process');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Convert CSV transactions to FinancialRecord objects
      const records = importResult.data.map(csvTx => convertCSVTransactionToRecord(csvTx));
      
      // Add all records to context immediately for display and forecasting
      records.forEach(record => {
        addRecord(record);
      });
      
      toast.success(`Added ${records.length} transactions to your records!`);
      onImportComplete?.(records);
      
      // If wallet is connected, also process on blockchain
      if (connected) {
        // Start batch processing for blockchain
        const status = await processBatchTransactions(
          records,
          config,
          (updatedStatus) => {
            setBatchStatus(updatedStatus);
          }
        );
        
        setBatchStatus(status);
        
        const summary = getBatchSummary(status);
        if (summary.isComplete) {
          toast.success(`Blockchain processing complete! ${summary.completed} successful, ${summary.failed} failed`);
        }
      } else {
        toast.info('Records added to local storage. Connect wallet to process on blockchain.');
      }
      
    } catch (error: any) {
      toast.error(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Retry failed transactions
  const handleRetryFailed = async () => {
    if (!batchStatus) return;
    
    setIsProcessing(true);
    
    try {
      const updatedStatus = await retryFailedTransactions(
        batchStatus,
        config,
        (updatedStatus) => {
          setBatchStatus(updatedStatus);
        }
      );
      
      setBatchStatus(updatedStatus);
      
      const summary = getBatchSummary(updatedStatus);
      toast.success(`Retry complete! ${summary.completed} successful, ${summary.failed} failed`);
      
    } catch (error: any) {
      toast.error(`Retry failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel batch processing
  const handleCancelBatch = () => {
    if (!batchStatus) return;
    
    const updatedStatus = cancelBatchProcessing(batchStatus);
    setBatchStatus(updatedStatus);
    setIsProcessing(false);
    toast.info('Batch processing cancelled');
  };



  // Update configuration
  const handleConfigChange = (field: keyof CSVImportConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // Validate configuration
  const configErrors = validateBatchConfig(config);

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import CSV Transactions
          </CardTitle>
          <CardDescription>
            Upload a CSV file containing transaction data to import and process on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="csv-file">Upload CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="cursor-pointer"
              />
            </div>
            
            {/* Direct Input */}
            <div className="space-y-2">
              <Label htmlFor="csv-content">Or Paste CSV Content</Label>
              <Textarea
                id="csv-content"
                placeholder="Paste your CSV content here..."
                value={csvContent}
                onChange={handleCsvContentChange}
                rows={4}
              />
            </div>
          </div>


        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{importResult.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{importResult.validRows}</div>
                <div className="text-sm text-muted-foreground">Valid Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{importResult.invalidRows}</div>
                <div className="text-sm text-muted-foreground">Invalid Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{importResult.warnings.length}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
            </div>

            {/* Errors and Warnings */}
            {(importResult.errors.length > 0 || importResult.warnings.length > 0) && (
              <div className="space-y-2">
                {importResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">Errors ({importResult.errors.length}):</div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-sm">{error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {importResult.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">Warnings ({importResult.warnings.length}):</div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.warnings.map((warning, index) => (
                          <div key={index} className="text-sm">{warning}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
              >
                {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              
              <Button
                onClick={() => setShowConfig(!showConfig)}
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </Button>
              
              {importResult.validRows > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    onClick={handleBatchProcess}
                    disabled={isProcessing}
                    variant="outline"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Add to Records ({importResult.validRows})
                  </Button>
                  
                  {connected && (
                    <Button
                      onClick={handleBatchProcess}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Process on Blockchain
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Processing Configuration</DialogTitle>
            <DialogDescription>
              Configure how transactions are processed in batches
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-batch-size">Max Batch Size</Label>
              <Input
                id="max-batch-size"
                type="number"
                min="1"
                max="50"
                value={config.maxBatchSize}
                onChange={(e) => handleConfigChange('maxBatchSize', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-retries">Max Retries</Label>
              <Input
                id="max-retries"
                type="number"
                min="0"
                max="10"
                value={config.maxRetries}
                onChange={(e) => handleConfigChange('maxRetries', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gas-limit">Gas Limit</Label>
              <Input
                id="gas-limit"
                type="number"
                min="21000"
                max="1000000"
                value={config.gasLimit}
                onChange={(e) => handleConfigChange('gasLimit', e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="allow-partial"
                checked={config.allowPartialImport}
                onCheckedChange={(checked) => handleConfigChange('allowPartialImport', checked)}
              />
              <Label htmlFor="allow-partial">Allow Partial Import</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="retry-failed"
                checked={config.retryFailedTransactions}
                onCheckedChange={(checked) => handleConfigChange('retryFailedTransactions', checked)}
              />
              <Label htmlFor="retry-failed">Retry Failed Transactions</Label>
            </div>
            
            {configErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {configErrors.map((error, index) => (
                    <div key={index} className="text-sm">{error}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Preview</DialogTitle>
            <DialogDescription>
              Preview of {importResult?.data.length || 0} valid transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importResult?.data.slice(0, 10).map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {importResult && importResult.data.length > 10 && (
              <div className="text-center text-sm text-muted-foreground">
                Showing first 10 of {importResult.data.length} transactions
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Processing Status */}
      {batchStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className={`h-5 w-5 ${batchStatus.isProcessing ? 'animate-spin' : ''}`} />
              Batch Processing Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{batchStatus.totalTransactions}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{batchStatus.completedTransactions}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{batchStatus.failedTransactions}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{batchStatus.pendingTransactions}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>
                  {Math.round(((batchStatus.completedTransactions + batchStatus.failedTransactions) / batchStatus.totalTransactions) * 100)}%
                </span>
              </div>
              <Progress 
                value={((batchStatus.completedTransactions + batchStatus.failedTransactions) / batchStatus.totalTransactions) * 100} 
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {batchStatus.isProcessing && (
                <Button
                  onClick={handleCancelBatch}
                  variant="outline"
                  size="sm"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              
              {!batchStatus.isProcessing && batchStatus.failedTransactions > 0 && (
                <Button
                  onClick={handleRetryFailed}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Failed ({batchStatus.failedTransactions})
                </Button>
              )}
            </div>

            {/* Transaction Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Transaction Details</span>
                <span className="text-sm text-muted-foreground">
                  {batchStatus.transactions.length} transactions
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {batchStatus.transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{tx.record.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(tx.record.amount)} • {tx.record.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          tx.status === 'confirmed' ? 'default' :
                          tx.status === 'failed' ? 'destructive' :
                          tx.status === 'cancelled' ? 'secondary' : 'outline'
                        }
                      >
                        {tx.status}
                      </Badge>
                      {tx.status === 'pending' && (
                        <Progress value={tx.progress} className="w-16" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVImport;