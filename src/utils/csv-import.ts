import { CSVTransaction, CSVImportResult, CSVValidationRule, CSVImportConfig } from "@/types/financial";
import { FinancialRecord } from "@/types/financial";

// CSV Import validation rules
const CSV_VALIDATION_RULES: CSVValidationRule[] = [
  {
    field: 'description',
    required: true,
    validator: (value) => ({
      isValid: value.trim().length > 0,
      error: 'Description is required'
    })
  },
  {
    field: 'amount',
    required: true,
    validator: (value) => {
      const numValue = parseFloat(value);
      return {
        isValid: !isNaN(numValue) && numValue !== 0,
        error: 'Amount must be a valid non-zero number'
      };
    },
    transformer: (value) => parseFloat(value).toFixed(2)
  },
  {
    field: 'category',
    required: true,
    validator: (value) => ({
      isValid: value.trim().length > 0,
      error: 'Category is required'
    }),
    transformer: (value) => value.trim().toLowerCase()
  },
  {
    field: 'date',
    required: true,
    validator: (value) => {
      const date = new Date(value);
      return {
        isValid: !isNaN(date.getTime()),
        error: 'Date must be in a valid format (YYYY-MM-DD)'
      };
    },
    transformer: (value) => {
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    }
  }
];

// Import CSV content and return structured data
export const importCSV = (content: string, config: Partial<CSVImportConfig> = {}): CSVImportResult => {
  const lines = content.trim().split('\n');
  const result: CSVImportResult = {
    success: false,
    data: [],
    errors: [],
    warnings: [],
    totalRows: lines.length - 1, // Exclude header
    validRows: 0,
    invalidRows: 0
  };

  if (lines.length < 2) {
    result.errors.push('CSV must have at least a header row and one data row');
    return result;
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredFields = ['description', 'amount', 'category', 'date'];
  
  // Validate headers
  const missingFields = requiredFields.filter(field => !headers.includes(field));
  if (missingFields.length > 0) {
    result.errors.push(`Missing required columns: ${missingFields.join(', ')}`);
    return result;
  }

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length !== headers.length) {
      result.errors.push(`Row ${i + 1}: Column count mismatch`);
      result.invalidRows++;
      continue;
    }

    const row: CSVTransaction = {
      description: '',
      amount: '',
      category: '',
      date: ''
    };

    // Map values to fields
    headers.forEach((header, index) => {
      if (header in row) {
        (row as any)[header] = values[index];
      }
    });

    // Validate row
    const validationResult = validateCSVRow(row, i + 1);
    if (validationResult.isValid) {
      result.data.push(row);
      result.validRows++;
    } else {
      result.errors.push(...validationResult.errors);
      result.invalidRows++;
    }
  }

  result.success = result.validRows > 0 && result.errors.length === 0;
  return result;
};

// Parse CSV line handling quoted values
const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
};

// Validate a single CSV row
const validateCSVRow = (row: CSVTransaction, rowNumber: number): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  CSV_VALIDATION_RULES.forEach(rule => {
    const value = (row as any)[rule.field];
    
    if (rule.required && (!value || value.trim() === '')) {
      errors.push(`Row ${rowNumber}: ${rule.field} is required`);
      return;
    }

    if (rule.validator) {
      const validation = rule.validator(value);
      if (!validation.isValid) {
        errors.push(`Row ${rowNumber}: ${validation.error}`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Convert CSV transaction to FinancialRecord
export const convertCSVTransactionToRecord = (csvTx: CSVTransaction): FinancialRecord => {
  // Apply transformers
  const transformed: CSVTransaction = { ...csvTx };
  CSV_VALIDATION_RULES.forEach(rule => {
    if (rule.transformer && (csvTx as any)[rule.field]) {
      (transformed as any)[rule.field] = rule.transformer((csvTx as any)[rule.field]);
    }
  });

  const parsedAmount = parseFloat(transformed.amount);
  const isExpense = parsedAmount < 0 || transformed.category.toLowerCase() === 'expense';

  return {
    id: `csv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: transformed.description,
amount: parsedAmount.toFixed(2), // as string
    category: transformed.category,
    date: transformed.date,
    notes: transformed.notes || '',
    isExpense,
    recordType: 'original'
  };
};


// Generate sample CSV content for testing
export const generateSampleCSV = (): string => {
  return `description,amount,category,date,notes
Salary,5000.00,income,2024-01-15,Monthly salary
Groceries,150.00,expense,2024-01-16,Weekly groceries
Gas,45.00,expense,2024-01-17,Fuel for car
Freelance Work,800.00,income,2024-01-18,Web development project
Restaurant,75.00,expense,2024-01-19,Dinner with friends
Utilities,120.00,expense,2024-01-20,Electricity and water
Investment Return,200.00,income,2024-01-21,Dividend payment
Shopping,89.99,expense,2024-01-22,Clothing purchase
Consulting,1200.00,income,2024-01-23,Business consulting
Transportation,35.00,expense,2024-01-24,Public transport`;
};

// Validate CSV import configuration
export const validateCSVConfig = (config: CSVImportConfig): string[] => {
  const errors: string[] = [];

  if (config.maxBatchSize && config.maxBatchSize < 1) {
    errors.push('Max batch size must be at least 1');
  }

  if (config.maxRetries && config.maxRetries < 0) {
    errors.push('Max retries cannot be negative');
  }

  if (config.gasLimit && parseFloat(config.gasLimit) <= 0) {
    errors.push('Gas limit must be a positive number');
  }

  return errors;
}; 