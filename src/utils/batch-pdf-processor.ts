import { FinancialRecord } from "@/types/financial";
import { formatCurrency } from "@/config/currency";
import { ParsedTransaction, BankStatementParseResult, convertParsedTransactionToRecord } from "./pdf-parser";
import { toast } from "sonner";

export interface BatchPDFProcessStatus {
  isProcessing: boolean;
  totalTransactions: number;
  processedTransactions: number;
  failedTransactions: number;
  currentStep: 'parsing' | 'validating' | 'categorizing' | 'blockchain' | 'complete';
  errors: string[];
  warnings: string[];
  bankName?: string;
  accountNumber?: string;
  statementPeriod?: {
    startDate: string;
    endDate: string;
  };
}

export interface BatchPDFConfig {
  autoCategorize: boolean;
  validateAmounts: boolean;
  processOnBlockchain: boolean;
  batchSize: number;
  retryFailed: boolean;
  maxRetries: number;
}

export const DEFAULT_BATCH_PDF_CONFIG: BatchPDFConfig = {
  autoCategorize: true,
  validateAmounts: true,
  processOnBlockchain: true,
  batchSize: 50,
  retryFailed: true,
  maxRetries: 3,
};

export class BatchPDFProcessor {
  private config: BatchPDFConfig;
  private status: BatchPDFProcessStatus;

  constructor(config: Partial<BatchPDFConfig> = {}) {
    this.config = { ...DEFAULT_BATCH_PDF_CONFIG, ...config };
    this.status = this.createInitialStatus();
  }

  // Main processing method
  async processBankStatement(
    parseResult: BankStatementParseResult,
    addRecord: (record: FinancialRecord) => void,
    processOnBlockchain?: (records: FinancialRecord[]) => Promise<void>
  ): Promise<BatchPDFProcessStatus> {
    this.status = this.createInitialStatus();
    this.status.totalTransactions = parseResult.totalTransactions;
    this.status.bankName = parseResult.bankName;
    this.status.accountNumber = parseResult.accountNumber;
    this.status.statementPeriod = parseResult.statementPeriod;

    try {
      // Step 1: Parse and validate
      this.status.currentStep = 'parsing';
      const validatedTransactions = this.validateTransactions(parseResult.transactions);
      
      // Step 2: Categorize transactions
      this.status.currentStep = 'categorizing';
      const categorizedTransactions = this.categorizeTransactions(validatedTransactions);
      
      // Step 3: Convert to FinancialRecord format
      const records = categorizedTransactions.map(convertParsedTransactionToRecord);
      
      // Step 4: Add to context immediately
      records.forEach(record => {
        addRecord(record);
        this.status.processedTransactions++;
      });

      // Step 5: Process on blockchain if enabled
      if (this.config.processOnBlockchain && processOnBlockchain) {
        this.status.currentStep = 'blockchain';
        await this.processOnBlockchain(records, processOnBlockchain);
      }

      this.status.currentStep = 'complete';
      this.status.isProcessing = false;

      // Show success message
      toast.success(`Successfully processed ${this.status.processedTransactions} transactions from ${parseResult.bankName || 'bank statement'}`);

    } catch (error: any) {
      this.status.errors.push(`Processing failed: ${error.message}`);
      this.status.isProcessing = false;
      toast.error(`Failed to process bank statement: ${error.message}`);
    }

    return this.status;
  }

  // Validate transactions
  private validateTransactions(transactions: ParsedTransaction[]): ParsedTransaction[] {
    const validated: ParsedTransaction[] = [];

    for (const transaction of transactions) {
      try {
        // Basic validation
        if (!transaction.date || !transaction.amount || !transaction.description) {
          this.status.errors.push(`Invalid transaction: ${transaction.description || 'Unknown'}`);
          this.status.failedTransactions++;
          continue;
        }

        // Validate date
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) {
          this.status.errors.push(`Invalid date for transaction: ${transaction.description}`);
          this.status.failedTransactions++;
          continue;
        }

        // Validate amount
        const amount = parseFloat(transaction.amount);
        if (isNaN(amount) || amount === 0) {
          this.status.errors.push(`Invalid amount for transaction: ${transaction.description}`);
          this.status.failedTransactions++;
          continue;
        }

        // Additional validation if enabled
        if (this.config.validateAmounts) {
          if (Math.abs(amount) > 1000000) {
            this.status.warnings.push(`Large amount detected: ${transaction.description} (${formatCurrency(transaction.amount)})`);
          }
        }

        validated.push(transaction);

      } catch (error) {
        this.status.errors.push(`Error validating transaction: ${transaction.description}`);
        this.status.failedTransactions++;
      }
    }

    return validated;
  }

  // Categorize transactions
  private categorizeTransactions(transactions: ParsedTransaction[]): ParsedTransaction[] {
    if (!this.config.autoCategorize) {
      return transactions;
    }

    return transactions.map(transaction => {
      const categorized = { ...transaction };
      
      // Enhanced categorization based on description and amount
      const desc = transaction.description.toLowerCase();
      const amount = parseFloat(transaction.amount);

      // Income categorization
      if (amount > 0) {
        if (desc.includes('salary') || desc.includes('payroll') || desc.includes('deposit') || desc.includes('direct deposit')) {
          categorized.category = 'income';
        } else if (desc.includes('return') || desc.includes('dividend') || desc.includes('investment') || desc.includes('interest')) {
          categorized.category = 'income';
        } else if (desc.includes('refund') || desc.includes('reimbursement') || desc.includes('cashback')) {
          categorized.category = 'income';
        } else if (desc.includes('transfer') && amount > 0) {
          categorized.category = 'income';
        } else {
          categorized.category = 'income';
        }
      } else {
        // Expense categorization
        if (desc.includes('grocery') || desc.includes('food') || desc.includes('supermarket') || desc.includes('market')) {
          categorized.category = 'expense';
        } else if (desc.includes('gas') || desc.includes('fuel') || desc.includes('petrol') || desc.includes('exxon') || desc.includes('shell')) {
          categorized.category = 'expense';
        } else if (desc.includes('restaurant') || desc.includes('dining') || desc.includes('coffee') || desc.includes('starbucks') || desc.includes('mcdonalds')) {
          categorized.category = 'expense';
        } else if (desc.includes('utility') || desc.includes('electric') || desc.includes('water') || desc.includes('gas bill') || desc.includes('power')) {
          categorized.category = 'expense';
        } else if (desc.includes('shopping') || desc.includes('mall') || desc.includes('store') || desc.includes('amazon') || desc.includes('walmart')) {
          categorized.category = 'expense';
        } else if (desc.includes('transport') || desc.includes('uber') || desc.includes('taxi') || desc.includes('lyft') || desc.includes('bus')) {
          categorized.category = 'expense';
        } else if (desc.includes('medical') || desc.includes('health') || desc.includes('doctor') || desc.includes('pharmacy') || desc.includes('hospital')) {
          categorized.category = 'expense';
        } else if (desc.includes('insurance') || desc.includes('premium') || desc.includes('coverage')) {
          categorized.category = 'expense';
        } else if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('housing')) {
          categorized.category = 'expense';
        } else if (desc.includes('phone') || desc.includes('mobile') || desc.includes('cellular')) {
          categorized.category = 'expense';
        } else if (desc.includes('internet') || desc.includes('wifi') || desc.includes('broadband')) {
          categorized.category = 'expense';
        } else if (desc.includes('entertainment') || desc.includes('netflix') || desc.includes('spotify') || desc.includes('hulu')) {
          categorized.category = 'expense';
        } else if (desc.includes('transfer') && amount < 0) {
          categorized.category = 'expense';
        } else {
          categorized.category = 'expense';
        }
      }

      return categorized;
    });
  }

  // Process transactions on blockchain
  private async processOnBlockchain(
    records: FinancialRecord[],
    processOnBlockchain: (records: FinancialRecord[]) => Promise<void>
  ): Promise<void> {
    try {
      // Process in batches
      const batchSize = this.config.batchSize;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        try {
          await processOnBlockchain(batch);
          this.status.processedTransactions += batch.length;
        } catch (error: any) {
          this.status.errors.push(`Blockchain processing failed for batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          this.status.failedTransactions += batch.length;
        }
      }
    } catch (error: any) {
      this.status.errors.push(`Blockchain processing failed: ${error.message}`);
    }
  }

  // Create initial status
  private createInitialStatus(): BatchPDFProcessStatus {
    return {
      isProcessing: true,
      totalTransactions: 0,
      processedTransactions: 0,
      failedTransactions: 0,
      currentStep: 'parsing',
      errors: [],
      warnings: [],
    };
  }

  // Get current status
  getStatus(): BatchPDFProcessStatus {
    return { ...this.status };
  }

  // Reset status
  reset(): void {
    this.status = this.createInitialStatus();
  }
}

// Utility function to create batch processor
export const createBatchPDFProcessor = (config?: Partial<BatchPDFConfig>): BatchPDFProcessor => {
  return new BatchPDFProcessor(config);
};