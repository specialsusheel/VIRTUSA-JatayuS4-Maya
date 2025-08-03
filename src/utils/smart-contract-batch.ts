import { FinancialRecord } from "@/types/financial";
import { toast } from "sonner";
import { Buffer } from "buffer";

export interface BatchContractTransaction {
  records: FinancialRecord[];
  contractAddress: string;
  methodName: string;
  gasLimit: string;
  gasPrice?: string;
}

export interface BatchContractResult {
  success: boolean;
  transactionHash?: string;
  gasUsed?: string;
  error?: string;
  processedRecords: number;
  failedRecords: number;
}

export interface SmartContractConfig {
  contractAddress: string;
  methodName: string;
  gasLimit: string;
  gasPrice?: string;
  maxBatchSize: number;
  retryOnFailure: boolean;
  maxRetries: number;
}

export const DEFAULT_SMART_CONTRACT_CONFIG: SmartContractConfig = {
  contractAddress: "0x1234567890123456789012345678901234567890", // Replace with actual contract address
  methodName: "batchProcessTransactions",
  gasLimit: "500000",
  gasPrice: undefined,
  maxBatchSize: 50,
  retryOnFailure: true,
  maxRetries: 3,
};

export class SmartContractBatchProcessor {
  private config: SmartContractConfig;

  constructor(config: Partial<SmartContractConfig> = {}) {
    this.config = { ...DEFAULT_SMART_CONTRACT_CONFIG, ...config };
  }

  // Process multiple transactions in a single smart contract call
  async processBatchInContract(
    records: FinancialRecord[],
    onProgress?: (progress: number) => void
  ): Promise<BatchContractResult> {
    try {
      // Validate records
      const validRecords = this.validateRecords(records);
      if (validRecords.length === 0) {
        return {
          success: false,
          error: "No valid records to process",
          processedRecords: 0,
          failedRecords: records.length,
        };
      }

      // Split into batches based on maxBatchSize
      const batches = this.splitIntoBatches(validRecords);
      let totalProcessed = 0;
      let totalFailed = 0;
      let finalTransactionHash: string | undefined;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const progress = ((i + 1) / batches.length) * 100;
        onProgress?.(progress);

        try {
          const result = await this.processBatch(batch);
          
          if (result.success) {
            totalProcessed += result.processedRecords;
            finalTransactionHash = result.transactionHash;
          } else {
            totalFailed += result.failedRecords;
          }

          // Add delay between batches
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error: any) {
          totalFailed += batch.length;
          console.error(`Batch ${i + 1} failed:`, error);
        }
      }

      return {
        success: totalProcessed > 0,
        transactionHash: finalTransactionHash,
        processedRecords: totalProcessed,
        failedRecords: totalFailed,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        processedRecords: 0,
        failedRecords: records.length,
      };
    }
  }

  // Process a single batch of records
  private async processBatch(records: FinancialRecord[]): Promise<BatchContractResult> {
    let retries = 0;
    const maxRetries = this.config.retryOnFailure ? this.config.maxRetries : 0;

    while (retries <= maxRetries) {
      try {
        // Prepare batch data for smart contract
        const batchData = this.prepareBatchData(records);
        
        // Call smart contract
        const result = await this.callSmartContract(batchData);
        
        if (result.success) {
          // Update records with transaction hash
          records.forEach(record => {
            record.transactionHash = result.transactionHash;
            record.timestamp = Date.now();
          });

          return {
            success: true,
            transactionHash: result.transactionHash,
            gasUsed: result.gasUsed,
            processedRecords: records.length,
            failedRecords: 0,
          };
        } else {
          throw new Error(result.error || 'Smart contract call failed');
        }

      } catch (error: any) {
        retries++;
        
        if (retries > maxRetries) {
          return {
            success: false,
            error: `Failed after ${maxRetries} retries: ${error.message}`,
            processedRecords: 0,
            failedRecords: records.length,
          };
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      processedRecords: 0,
      failedRecords: records.length,
    };
  }

  // Validate records before processing
  private validateRecords(records: FinancialRecord[]): FinancialRecord[] {
    return records.filter(record => {
      // Check required fields
      if (!record.description || !record.amount || !record.category || !record.date) {
  console.warn("Missing field:", record);
  return false;
}
if (isNaN(parseFloat(record.amount)) || parseFloat(record.amount) === 0) {
  console.warn("Invalid amount:", record);
  return false;
}
if (isNaN(new Date(record.date).getTime())) {
  console.warn("Invalid date:", record);
  return false;
}


      // Check amount is valid number
      const amount = parseFloat(record.amount);
      if (isNaN(amount) || amount === 0) {
        console.warn('Invalid amount in record:', record);
        return false;
      }

      // Check date is valid
      const date = new Date(record.date);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date in record:', record);
        return false;
      }

      return true;
    });
  }

  // Split records into batches
  private splitIntoBatches(records: FinancialRecord[]): FinancialRecord[][] {
    const batches: FinancialRecord[][] = [];
    const batchSize = this.config.maxBatchSize;

    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }

    return batches;
  }

  // Prepare batch data for smart contract
  private prepareBatchData(records: FinancialRecord[]): any {
    return {
      contractAddress: this.config.contractAddress,
      methodName: this.config.methodName,
      data: records.map(record => ({
        description: record.description,
        amount: record.amount,
        category: record.category,
        date: record.date,
        notes: record.notes || '',
        recordType: record.recordType || 'original',
      })),
      gasLimit: this.config.gasLimit,
      gasPrice: this.config.gasPrice,
    };
  }

  // Call smart contract with actual blockchain transaction
  private async callSmartContract(batchData: any): Promise<{
    success: boolean;
    transactionHash?: string;
    gasUsed?: string;
    error?: string;
  }> {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      // Get current account
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No connected accounts");
      }

      const fromAddress = accounts[0];
      
      // Create batch data as hex
      const batchJson = JSON.stringify({
        method: batchData.methodName,
        records: batchData.data,
        timestamp: Date.now(),
        batchSize: batchData.data.length
      });
      
      const hexData = "0x" + Buffer.from(batchJson, 'utf8').toString('hex');
      
      console.log("📤 Preparing batch transaction:", {
        from: fromAddress,
        data: hexData,
        batchSize: batchData.data.length
      });

      // Get the current network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log("🌐 Current chain ID:", chainId);

      // Estimate gas for the batch transaction
      const gasEstimate = await window.ethereum.request({
        method: 'eth_estimateGas',
        params: [{
          from: fromAddress,
          to: batchData.contractAddress,
          data: hexData
        }]
      });

      console.log("⛽ Estimated gas for batch:", gasEstimate);

      // Get current gas price
      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      });

      console.log("💰 Current gas price:", gasPrice);

      // Send batch transaction - THIS WILL TRIGGER WALLET APPROVAL
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: fromAddress,
          to: batchData.contractAddress,
          value: "0x0", // No ETH transfer
          data: hexData,
          gas: gasEstimate,
          gasPrice: gasPrice,
          chainId: chainId
        }]
      });

      console.log("✅ Batch transaction sent:", txHash);
      
      return {
        success: true,
        transactionHash: txHash,
        gasUsed: gasEstimate,
      };

    } catch (error: any) {
      console.error("💥 Batch transaction failed:", error);
      
      if (error.code === 4001) {
        throw new Error("Transaction rejected by user");
      } else if (error.code === -32603) {
        throw new Error("Transaction failed: Insufficient funds or gas");
      } else {
        throw new Error(`Failed to send batch transaction: ${error.message}`);
      }
    }
  }

  // Get contract configuration
  getConfig(): SmartContractConfig {
    return { ...this.config };
  }

  // Update contract configuration
  updateConfig(newConfig: Partial<SmartContractConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Utility function to create batch processor
export const createSmartContractBatchProcessor = (
  config?: Partial<SmartContractConfig>
): SmartContractBatchProcessor => {
  return new SmartContractBatchProcessor(config);
};

// Process PDF transactions with smart contract
export const processPDFTransactionsWithContract = async (
  records: FinancialRecord[],
  config?: Partial<SmartContractConfig>,
  onProgress?: (progress: number) => void
): Promise<BatchContractResult> => {
  const processor = createSmartContractBatchProcessor(config);
  
  try {
    const result = await processor.processBatchInContract(records, onProgress);
    
    if (result.success) {
      toast.success(`Successfully processed ${result.processedRecords} transactions on blockchain`);
    } else {
      toast.error(`Failed to process transactions: ${result.error}`);
    }
    
    return result;
  } catch (error: any) {
    toast.error(`Error processing transactions: ${error.message}`);
    throw error;
  }
}; 