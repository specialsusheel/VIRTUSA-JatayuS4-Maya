import { FinancialRecord, BatchTransactionStatus, BatchImportStatus, CSVImportConfig } from "@/types/financial";
import { sendTransaction, convertRecordToHex } from "./blockchain";
import { convertCSVTransactionToRecord } from "./csv-import";
import { parseEther } from "ethers";
import { getContract } from "./blockchain";


// Default batch configuration
export const DEFAULT_BATCH_CONFIG: CSVImportConfig = {
  allowPartialImport: true,
  maxBatchSize: 10,
  retryFailedTransactions: true,
  maxRetries: 3,
  gasLimit: "21000",
  gasPrice: undefined
};

// Create batch import status
export const createBatchImportStatus = (totalTransactions: number): BatchImportStatus => {
  return {
    totalTransactions,
    completedTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: totalTransactions,
    transactions: [],
    isProcessing: false,
    startTime: Date.now()
  };
};

// Create batch transaction status
export const createBatchTransactionStatus = (
  record: FinancialRecord,
  index: number
): BatchTransactionStatus => {
  return {
    id: `batch-${Date.now()}-${index}`,
    status: 'pending',
    timestamp: Date.now(),
    record,
    progress: 0
  };
};

// Process single transaction with retry logic
export const processTransaction = async (
  record: FinancialRecord,
  config: CSVImportConfig,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  let retries = 0;
  const maxRetries = config.maxRetries || 3;
  
  while (retries <= maxRetries) {
    try {
      // Update progress
      onProgress?.(retries * 25);
      
      // Convert record to hex if not already done
      if (!record.hexData) {
        record.hexData = convertRecordToHex(record);
      }
      
      // Send transaction
      const hash = await sendTransaction(record);
      
      if (hash) {
        onProgress?.(100);
        return { success: true, hash };
      } else {
        throw new Error('Transaction failed - no hash returned');
      }
      
    } catch (error: any) {
      retries++;
      
      // Don't retry if user rejected the transaction
      if (error.message?.includes('rejected by user')) {
        return { success: false, error: 'Transaction rejected by user' };
      }
      
      // Don't retry if we've exceeded max retries
      if (retries > maxRetries) {
        return { 
          success: false, 
          error: `Failed after ${maxRetries} retries: ${error.message}` 
        };
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
};

// Process batch of transactions


export async function processBatchTransactions(
  records: FinancialRecord[],
  onProgress?: (index: number, status: string) => void
): Promise<BatchTransactionStatus[]> {
  const transactionStatuses: BatchTransactionStatus[] = [];

  try {
    if (records.length === 0) {
      throw new Error("No records to process.");
    }

    const contract = await getContract();

    const descriptions: string[] = [];
    const amounts: bigint[] = [];
    const categories: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      descriptions.push(record.description);
      amounts.push(parseEther(record.amount.toString()));
      categories.push(record.category);

      const txStatus = createBatchTransactionStatus(record, i);
      transactionStatuses.push(txStatus);

      onProgress?.(i, "Prepared");
    }

    const tx = await contract.addRecords(descriptions, amounts, categories);
    onProgress?.(records.length, "Submitted");

    await tx.wait();

    // Mark all as confirmed
    transactionStatuses.forEach((status) => {
      status.status = "confirmed";
      status.progress = 100;
    });

    onProgress?.(records.length, "Confirmed");

    console.log("✅ Batch transaction successful:", tx.hash);
  } catch (error) {
    console.error("❌ Blockchain batch error:", error);

    // Mark all as failed
    transactionStatuses.forEach((status) => {
      status.status = "failed";
      status.progress = 0;
      status.error = (error as Error)?.message;
    });
  }

  return transactionStatuses;
}



// Retry failed transactions
export const retryFailedTransactions = async (
  status: BatchImportStatus,
  config: CSVImportConfig = DEFAULT_BATCH_CONFIG,
  onStatusUpdate?: (status: BatchImportStatus) => void
): Promise<BatchImportStatus> => {
  const failedTransactions = status.transactions.filter(t => t.status === 'failed');

  if (failedTransactions.length === 0) {
    return status;
  }

  // Create new status for retry
  const retryStatus: BatchImportStatus = {
    totalTransactions: failedTransactions.length,
    completedTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: failedTransactions.length,
    transactions: failedTransactions.map(t => ({
      ...t,
      status: 'pending' as const,
      progress: 0,
      error: undefined
    })),
    isProcessing: true,
    startTime: Date.now()
  };

  onStatusUpdate?.(retryStatus);

  // Process failed transactions
  const records = failedTransactions.map(t => t.record);
  const resultTransactions = await processBatchTransactions(records, (index, status) => {
    // Optional: update progress UI
  });

  // ✅ Declare updatedStatus based on the previous status
  const updatedStatus: BatchImportStatus = {
    ...status,
    transactions: [...status.transactions], // clone to update specific ones
  };

  resultTransactions.forEach((retryTx, index) => {
    const originalIndex = status.transactions.findIndex(t => t.id === retryTx.id);
    if (originalIndex !== -1) {
      updatedStatus.transactions[originalIndex] = retryTx;

      if (retryTx.status === 'confirmed') {
        updatedStatus.completedTransactions++;
        updatedStatus.failedTransactions--;
      }
    }
  });

  return updatedStatus;
};


// Cancel batch processing
export const cancelBatchProcessing = (status: BatchImportStatus): BatchImportStatus => {
  const updatedStatus = { ...status };
  
  updatedStatus.transactions.forEach(transaction => {
    if (transaction.status === 'pending') {
      transaction.status = 'cancelled';
      updatedStatus.pendingTransactions--;
    }
  });
  
  updatedStatus.isProcessing = false;
  updatedStatus.endTime = Date.now();
  
  return updatedStatus;
};

// Get batch processing summary
export const getBatchSummary = (status: BatchImportStatus) => {
  const duration = status.endTime && status.startTime 
    ? status.endTime - status.startTime 
    : Date.now() - (status.startTime || Date.now());
  
  const successRate = status.totalTransactions > 0 
    ? (status.completedTransactions / status.totalTransactions) * 100 
    : 0;
  
  return {
    total: status.totalTransactions,
    completed: status.completedTransactions,
    failed: status.failedTransactions,
    pending: status.pendingTransactions,
    successRate: Math.round(successRate * 100) / 100,
    duration: Math.round(duration / 1000), // seconds
    isComplete: !status.isProcessing && status.pendingTransactions === 0
  };
};

// Validate batch configuration
export const validateBatchConfig = (config: Partial<CSVImportConfig>): string[] => {
  const errors: string[] = [];
  
  if (config.maxBatchSize && (config.maxBatchSize < 1 || config.maxBatchSize > 50)) {
    errors.push('Max batch size must be between 1 and 50');
  }
  
  if (config.maxRetries && (config.maxRetries < 0 || config.maxRetries > 10)) {
    errors.push('Max retries must be between 0 and 10');
  }
  
  if (config.gasLimit && (parseInt(config.gasLimit) < 21000 || parseInt(config.gasLimit) > 1000000)) {
    errors.push('Gas limit must be between 21,000 and 1,000,000');
  }
  
  return errors;
}; 