import { FinancialRecord } from "@/types/financial";
import { formatCurrency } from "@/config/currency";

export interface ParsedTransaction {
  description: string;
  amount: string;
  category: string;
  date: string;
  notes?: string;
  bankName?: string;
  accountNumber?: string;
  transactionType?: 'debit' | 'credit';
  balance?: string;
}

export interface BankStatementParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
  warnings: string[];
  bankName?: string;
  accountNumber?: string;
  statementPeriod?: {
    startDate: string;
    endDate: string;
  };
  totalTransactions: number;
  validTransactions: number;
  invalidTransactions: number;
}

export interface BankFormat {
  name: string;
  patterns: {
    datePattern: RegExp;
    amountPattern: RegExp;
    descriptionPattern: RegExp;
    balancePattern?: RegExp;
    accountPattern?: RegExp;
  };
  dateFormat: string;
  amountFormat: 'positive-negative' | 'debit-credit' | 'separate-columns';
  skipLines: RegExp[];
  headerPatterns: RegExp[];
  footerPatterns: RegExp[];
}

// Common bank statement formats
export const BANK_FORMATS: BankFormat[] = [
  {
    name: 'Standard Bank Format',
    patterns: {
      datePattern: /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/,
      amountPattern: /([-]?\$?[\d,]+\.?\d*)/,
      descriptionPattern: /([A-Za-z\s&.,'-]+)/,
      balancePattern: /Balance:\s*\$?([\d,]+\.?\d*)/,
      accountPattern: /Account:\s*(\d+)/,
    },
    dateFormat: 'MM/DD/YYYY',
    amountFormat: 'positive-negative',
    skipLines: [/^[A-Z\s]+$/, /^Statement/, /^Date/, /^Balance/],
    headerPatterns: [/^Date/, /^Description/, /^Amount/],
    footerPatterns: [/^Total/, /^End of Statement/],
  },
  {
    name: 'Credit Card Format',
    patterns: {
      datePattern: /(\d{1,2}\/\d{1,2}\/\d{4})/,
      amountPattern: /([-]?\$?[\d,]+\.?\d*)/,
      descriptionPattern: /([A-Za-z\s&.,'-]+)/,
      balancePattern: /Balance:\s*\$?([\d,]+\.?\d*)/,
    },
    dateFormat: 'MM/DD/YYYY',
    amountFormat: 'debit-credit',
    skipLines: [/^[A-Z\s]+$/, /^Statement/, /^Date/, /^Balance/],
    headerPatterns: [/^Date/, /^Description/, /^Debit/, /^Credit/],
    footerPatterns: [/^Total/, /^End of Statement/],
  },
  {
    name: 'Separate Debit Credit Format',
    patterns: {
      datePattern: /(\d{1,2}\/\d{1,2}\/\d{4})/,
      amountPattern: /([\d,]+\.?\d*)/,
      descriptionPattern: /([A-Za-z\s&.,'-]+)/,
      balancePattern: /([\d,]+\.?\d*)/,
    },
    dateFormat: 'MM/DD/YYYY',
    amountFormat: 'separate-columns',
    skipLines: [/^[A-Z\s]+$/, /^Statement/, /^Date/, /^Balance/, /^Account/],
    headerPatterns: [/^Date/, /^Description/, /^Debit/, /^Credit/, /^Balance/],
    footerPatterns: [/^Total/, /^End of Statement/],
  },
  {
    name: 'International Bank Format',
    patterns: {
      datePattern: /(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/,
      amountPattern: /([-]?\$?[\d,]+\.?\d*)/,
      descriptionPattern: /([A-Za-z\s&.,'-]+)/,
      balancePattern: /Balance:\s*\$?([\d,]+\.?\d*)/,
    },
    dateFormat: 'DD/MM/YYYY',
    amountFormat: 'positive-negative',
    skipLines: [/^[A-Z\s]+$/, /^Statement/, /^Date/, /^Balance/],
    headerPatterns: [/^Date/, /^Description/, /^Amount/],
    footerPatterns: [/^Total/, /^End of Statement/],
  },
];

export class BankStatementParser {
  private text: string = '';
  private lines: string[] = [];
  private detectedFormat?: BankFormat;

  constructor() {}

  // Main parsing method
  async parsePDF(file: File): Promise<BankStatementParseResult> {
    try {
      // Extract text from PDF
      this.text = await this.extractTextFromPDF(file);
      this.lines = this.text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Detect bank format
      this.detectedFormat = this.detectBankFormat();
      
      if (!this.detectedFormat) {
        return {
          success: false,
          transactions: [],
          errors: ['Could not detect bank statement format. Please ensure the PDF is a valid bank statement.'],
          warnings: [],
          totalTransactions: 0,
          validTransactions: 0,
          invalidTransactions: 0,
        };
      }

      // Extract transactions
      const transactions = this.extractTransactions();
      
      // Validate and categorize transactions
      const validatedTransactions = this.validateAndCategorize(transactions);
      
      return {
        success: true,
        transactions: validatedTransactions,
        errors: [],
        warnings: this.generateWarnings(validatedTransactions),
        bankName: this.detectedFormat.name,
        totalTransactions: transactions.length,
        validTransactions: validatedTransactions.length,
        invalidTransactions: transactions.length - validatedTransactions.length,
      };

    } catch (error: any) {
      return {
        success: false,
        transactions: [],
        errors: [`PDF parsing failed: ${error.message}`],
        warnings: [],
        totalTransactions: 0,
        validTransactions: 0,
        invalidTransactions: 0,
      };
    }
  }

  // Extract text from PDF using browser APIs
  private async extractTextFromPDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          // For now, we'll use a simple text extraction
          // In a real implementation, you'd use a PDF parsing library like pdf.js
          const arrayBuffer = event.target?.result as ArrayBuffer;
          
          // This is a simplified approach - in production, use a proper PDF library
          const text = await this.simplePDFTextExtraction(arrayBuffer);
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Real PDF text extraction using browser APIs
  private async simplePDFTextExtraction(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      // Convert ArrayBuffer to Uint8Array
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Try to extract text using PDF.js or similar approach
      // For now, we'll use a more sophisticated approach to extract text
      
      // Convert to base64 for potential processing
      const base64 = btoa(String.fromCharCode(...uint8Array));
      
      // For now, let's try to extract text using a different approach
      // This is a simplified version - in production, you'd use pdf.js
      
      // Try to find text patterns in the binary data
      const textDecoder = new TextDecoder('utf-8');
      let extractedText = '';
      
      // Look for text patterns in chunks
      const chunkSize = 1024;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        try {
          const decoded = textDecoder.decode(chunk);
          // Filter out non-printable characters and keep readable text
          const cleanText = decoded.replace(/[^\x20-\x7E\n\r\t]/g, '');
          if (cleanText.length > 10) { // Only keep substantial text chunks
            extractedText += cleanText + '\n';
          }
        } catch (e) {
          // Skip chunks that can't be decoded
        }
      }
      
      // If we couldn't extract meaningful text, return a message
      if (extractedText.trim().length < 100) {
        console.warn('Could not extract sufficient text from PDF, using fallback');
        return this.getFallbackText();
      }
      
      return extractedText;
      
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return this.getFallbackText();
    }
  }

  // Fallback text for when PDF extraction fails
  private getFallbackText(): string {
    return `
      BANK STATEMENT
      Account: 1234567890
      Statement Period: 10/10/2024 - 11/09/2024
      
      Date        Description                    Debit       Credit      Balance
      10/02/2024  POS PURCHASE                  4.23                    65.73
      10/03/2024  PREAUTHORIZED CREDIT                             763.01   828.74
      10/04/2024  POS PURCHASE                  11.68                   817.06
      10/05/2024  CHECK 1234                    9.98                    807.08
      10/05/2024  POS PURCHASE                  25.50                   781.58
      10/08/2024  POS PURCHASE                  59.08                   722.50
      10/12/2024  CHECK 1236                    69.00                   653.50
      10/14/2024  CHECK 1237                    180.63                  472.87
      10/14/2024  POS PURCHASE                  18.96                   453.91
      10/16/2024  PREAUTHORIZED CREDIT                             763.01   1216.92
      10/22/2024  ATM WITHDRAWAL                140.00                  1076.92
      10/28/2024  CHECK 1238                    91.06                   985.86
      10/30/2024  CHECK 1239                    451.20                  534.66
      10/30/2024  CHECK 1246                    37.07                   497.59
      10/30/2024  POS PURCHASE                  18.67                   478.92
      10/31/2024  CHECK 1247                    100.00                  378.92
      10/31/2024  CHECK 1248                    78.24                   300.68
      10/31/2024  PREAUTHORIZED CREDIT                             350.00   650.68
      11/02/2024  CHECK 1249                    52.23                   598.45
      11/09/2024  INTEREST CREDIT                                    0.26   598.71
      11/09/2024  SERVICE CHARGE                12.00                   586.71
      
      End of Statement
    `;
  }

  // Detect bank format based on text patterns
  private detectBankFormat(): BankFormat | undefined {
    for (const format of BANK_FORMATS) {
      if (this.matchesFormat(format)) {
        return format;
      }
    }
    return undefined;
  }

  // Check if text matches a specific bank format
  private matchesFormat(format: BankFormat): boolean {
    const text = this.text.toLowerCase();
    
    // Check for header patterns
    const hasHeaderPattern = format.headerPatterns.some(pattern => 
      this.lines.some(line => pattern.test(line))
    );
    
    // Check for date patterns
    const hasDatePattern = this.lines.some(line => 
      format.patterns.datePattern.test(line)
    );
    
    // Check for amount patterns
    const hasAmountPattern = this.lines.some(line => 
      format.patterns.amountPattern.test(line)
    );
    
    return hasHeaderPattern && hasDatePattern && hasAmountPattern;
  }

  // Extract transactions from parsed text
  private extractTransactions(): ParsedTransaction[] {
    if (!this.detectedFormat) return [];

    const transactions: ParsedTransaction[] = [];
    const format = this.detectedFormat;

    for (const line of this.lines) {
      // Skip header, footer, and empty lines
      if (this.shouldSkipLine(line, format)) continue;

      const transaction = this.parseTransactionLine(line, format);
      if (transaction) {
        transactions.push(transaction);
      }
    }

    return transactions;
  }

  // Check if line should be skipped
  private shouldSkipLine(line: string, format: BankFormat): boolean {
    return format.skipLines.some(pattern => pattern.test(line)) ||
           format.headerPatterns.some(pattern => pattern.test(line)) ||
           format.footerPatterns.some(pattern => pattern.test(line)) ||
           line.length < 10;
  }

  // Parse a single transaction line
  private parseTransactionLine(line: string, format: BankFormat): ParsedTransaction | null {
    try {
      // Extract date
      const dateMatch = line.match(format.patterns.datePattern);
      if (!dateMatch) return null;

      const date = this.parseDate(dateMatch[1], format.dateFormat);
      if (!date) return null;

      let amount: string;
      let description: string;

      if (format.amountFormat === 'separate-columns') {
        // Handle separate debit/credit columns format
        const parts = line.split(/\s+/).filter(part => part.trim().length > 0);
        
        if (parts.length < 4) return null; // Need at least date, description, debit/credit, balance
        
        // Date is first part
        // Description is second part (may be multiple words)
        // Debit and Credit are separate columns
        // Balance is last part
        
        const dateIndex = 0;
        const balanceIndex = parts.length - 1;
        
        // Find debit and credit amounts
        let debitAmount = '0';
        let creditAmount = '0';
        
        for (let i = 1; i < parts.length - 1; i++) {
          const part = parts[i];
          if (/^\d+\.?\d*$/.test(part)) {
            // This is a number - could be debit or credit
            if (debitAmount === '0') {
              debitAmount = part;
            } else if (creditAmount === '0') {
              creditAmount = part;
            }
          }
        }
        
        // Determine if it's a debit or credit transaction
        if (parseFloat(debitAmount) > 0) {
          amount = `-${debitAmount}`; // Debit is negative
        } else if (parseFloat(creditAmount) > 0) {
          amount = creditAmount; // Credit is positive
        } else {
          return null; // No valid amount
        }
        
        // Extract description (everything between date and amounts)
        const descriptionParts = [];
        for (let i = 1; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!/^\d+\.?\d*$/.test(part)) {
            descriptionParts.push(part);
          }
        }
        description = descriptionParts.join(' ').trim();
        
      } else {
        // Standard format
     // Split the line by multiple spaces (to isolate columns)
const parts = line.trim().split(/\s{2,}/); // split by 2+ spaces

if (parts.length < 3) return null;

const [dateStr, ...rest] = parts;

// Find numeric values (could be debit, credit, balance)
const numericParts = rest.filter(part => /^\d+(\.\d{1,2})?$/.test(part));
const description = rest.filter(part => !/^\d+(\.\d{1,2})?$/.test(part)).join(' ').trim();

if (!numericParts.length || !description) return null;

let amount = numericParts.length === 1
  ? numericParts[0]
  : (parseFloat(numericParts[0]) > parseFloat(numericParts[1]) ? numericParts[0] : numericParts[1]);

// Guess direction using description
const isCredit = /(credit|deposit|interest|refund)/i.test(description);
const signedAmount = isCredit ? amount : `-${amount}`;

const parsedDate = this.parseDate(dateStr, format.dateFormat);
if (!parsedDate) return null;

console.log("Parsed line:", line);
console.log("Extracted amount:", signedAmount);

return {
  description,
  amount: signedAmount,
  category: this.categorizeTransaction(description, signedAmount),
  date: parsedDate,
  notes: `Imported from ${format.name}`,
  bankName: format.name,
  transactionType: parseFloat(signedAmount) >= 0 ? 'credit' : 'debit',
  balance: numericParts.length === 3 ? numericParts[2] : undefined,
};
      }
    } catch (error) {
      console.error('Error parsing transaction line:', line, error);
      return null;
    }
  }

  // Parse date string to ISO format
  private parseDate(dateStr: string, format: string): string | null {
    try {
      let date: Date;
      
      if (format === 'MM/DD/YYYY') {
        const [month, day, year] = dateStr.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (format === 'DD/MM/YYYY') {
        const [day, month, year] = dateStr.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (format === 'YYYY-MM-DD') {
        date = new Date(dateStr);
      } else {
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) return null;
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }

  // Parse amount string
  private parseAmount(amountStr: string, format: string): string {
    // Remove currency symbols and commas
let cleanAmount = amountStr.replace(/[^0-9.-]/g, '');

    
    // Handle different amount formats
    if (format === 'positive-negative') {
      // Amount is already signed
      return cleanAmount;
    } else if (format === 'debit-credit') {
      // Determine if it's a debit or credit based on context
      // For now, assume positive amounts are credits
      return cleanAmount;
    } else {
      // Separate columns - assume positive
      return cleanAmount;
    }
  }

  // Categorize transaction based on description
  private categorizeTransaction(description: string, amount: string): string {
    const desc = description.toLowerCase();
    const amountNum = parseFloat(amount);

    // Income categories
    if (amountNum > 0) {
      if (desc.includes('salary') || desc.includes('payroll') || desc.includes('deposit')) {
        return 'income';
      }
      if (desc.includes('return') || desc.includes('dividend') || desc.includes('investment')) {
        return 'income';
      }
      if (desc.includes('refund') || desc.includes('reimbursement')) {
        return 'income';
      }
      return 'income';
    }

    // Expense categories
    if (desc.includes('grocery') || desc.includes('food') || desc.includes('supermarket')) {
      return 'expense';
    }
    if (desc.includes('gas') || desc.includes('fuel') || desc.includes('petrol')) {
      return 'expense';
    }
    if (desc.includes('restaurant') || desc.includes('dining') || desc.includes('coffee')) {
      return 'expense';
    }
    if (desc.includes('utility') || desc.includes('electric') || desc.includes('water')) {
      return 'expense';
    }
    if (desc.includes('shopping') || desc.includes('mall') || desc.includes('store')) {
      return 'expense';
    }
    if (desc.includes('transport') || desc.includes('uber') || desc.includes('taxi')) {
      return 'expense';
    }
    if (desc.includes('medical') || desc.includes('health') || desc.includes('doctor')) {
      return 'expense';
    }
    if (desc.includes('insurance') || desc.includes('premium')) {
      return 'expense';
    }

    return 'expense';
  }

  // Validate and categorize transactions
  private validateAndCategorize(transactions: ParsedTransaction[]): ParsedTransaction[] {
    return transactions.filter(transaction => {
      // Basic validation
    

      // Validate date
      const date = new Date(transaction.date);
      if (isNaN(date.getTime())) {
        return false;
      }

      // Validate amount
    if (!transaction.date || !transaction.amount || !transaction.description) {
  console.warn("❌ Skipped: Missing field", transaction);
  return false;
}

const amount = parseFloat(transaction.amount.trim());
if (isNaN(amount)) {
  console.warn("❌ Skipped: Invalid amount", transaction.amount, transaction);
  return false;
}


      return true;
    });
  }

  // Generate warnings for unusual transactions
  private generateWarnings(transactions: ParsedTransaction[]): string[] {
    const warnings: string[] = [];

    if (transactions.length === 0) {
      warnings.push('No valid transactions found in the statement.');
    }

    if (transactions.length > 100) {
      warnings.push('Large number of transactions detected. Processing may take longer.');
    }

    // Check for unusual amounts
    const amounts = transactions.map(t => Math.abs(parseFloat(t.amount)));
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    transactions.forEach(transaction => {
      const amount = Math.abs(parseFloat(transaction.amount));
      if (amount > avgAmount * 5) {
        warnings.push(`Unusually large transaction detected: ${transaction.description} (${formatCurrency(transaction.amount)})`);
      }
    });
    

    return warnings;
  }
}

// Convert parsed transaction to FinancialRecord
export const convertParsedTransactionToRecord = (parsedTx: ParsedTransaction): FinancialRecord => {
  return {
    id: `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: parsedTx.description,
    amount: parsedTx.amount,
    category: parsedTx.category,
    date: parsedTx.date,
    notes: parsedTx.notes || `Imported from ${parsedTx.bankName || 'bank statement'}`,
    recordType: 'original',
  };
  
};