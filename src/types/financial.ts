export interface FinancialRecord {
  
  id?: string;
  description: string;
  amount: string;
  category: string;
  date: string;
  notes?: string;
  transactionHash?: string;
  blockNumber?: number;
  timestamp?: number;
  hexData?: string;
  recordType?: 'original' | 'correction' | 'reversal' | 'adjustment';
  correctionData?: {
    originalTransactionHash: string;
    originalRecordId: string;
    correctionReason: string;
    correctionType: 'amount' | 'category' | 'description' | 'date' | 'multiple';
    correctedFields: string[];
  };
  netEffect?: {
    originalAmount: string;
    correctedAmount: string;
    difference: string;
  };
}

export interface TransactionStatus {
  pending: boolean;
  success: boolean;
  error: string | null;
  hash: string | null;
}

export interface CorrectionRecord extends FinancialRecord {
  recordType: 'correction';
  correctionData: {
    originalTransactionHash: string;
    originalRecordId: string;
    correctionReason: string;
    correctionType: 'amount' | 'category' | 'description' | 'date' | 'multiple';
    correctedFields: string[];
  };
}

export interface CorrectionFormData {
  originalRecordId: string;
  originalTransactionHash: string;
  correctionReason: string;
  correctionType: 'amount' | 'category' | 'description' | 'date' | 'multiple';
  correctedData: {
    description?: string;
    amount?: string;
    category?: string;
    date?: string;
    notes?: string;
  };
}

export interface CorrectionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// CSV Import Types
export interface CSVTransaction {
  description: string;
  amount: string;
  category: string;
  date: string;
  notes?: string;
  sender?: string;
  receiver?: string;
  timestamp?: string;
  transientDetails?: string; // Additional metadata
}

export interface CSVImportResult {
  success: boolean;
  data: CSVTransaction[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface BatchTransactionStatus {
  id: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  transactionHash?: string;
  error?: string;
  timestamp: number;
  record: FinancialRecord;
  progress: number; // 0-100
}

export interface BatchImportStatus {
  totalTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  transactions: BatchTransactionStatus[];
  isProcessing: boolean;
  startTime?: number;
  endTime?: number;
}

export interface CSVValidationRule {
  field: keyof CSVTransaction;
  required: boolean;
  validator?: (value: string) => { isValid: boolean; error?: string };
  transformer?: (value: string) => string;
}

export interface CSVImportConfig {
  allowPartialImport: boolean;
  maxBatchSize: number;
  retryFailedTransactions: boolean;
  maxRetries: number;
  gasLimit: string;
  gasPrice?: string;
}
