import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FinancialRecord, CorrectionRecord } from "@/types/financial";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useBlockchain } from "@/contexts/BlockchainContext";
import { formatCurrency, getCurrencyCode, getCurrencySymbol } from "@/config/currency";

interface ExportButtonProps {
  records: FinancialRecord[];
  exportConfig: {
    type: 'financial-year' | 'custom-range';
    financialYear: number;
    customRange: {
      startDate: Date | null;
      endDate: Date | null;
    };
  };
}

const ExportButton: React.FC<ExportButtonProps> = ({
  records,
  exportConfig,
}) => {
  const { getNetEffectForRecord } = useBlockchain();

  const isExportDisabled = () => {
    if (records.length === 0) return true;
    
    if (exportConfig.type === 'custom-range') {
      return !exportConfig.customRange.startDate || !exportConfig.customRange.endDate;
    }
    
    return false;
  };

  const generateFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (exportConfig.type === 'financial-year') {
      return `VIRTUSA_LEDGER_FY${exportConfig.financialYear}-${exportConfig.financialYear + 1}_${timestamp}.xlsx`;
    } else {
      const start = exportConfig.customRange.startDate?.toISOString().split('T')[0] || 'start';
      const end = exportConfig.customRange.endDate?.toISOString().split('T')[0] || 'end';
      return `VIRTUSA_LEDGER_${start}_to_${end}_${timestamp}.xlsx`;
    }
  };

  // Process records to show net corrected values
  const processRecordsForExport = () => {
    const processedRecords: any[] = [];
    const correctionHistory: any[] = [];
    let correctionIndex = 1;

    // Helper function to determine tax category based on transaction category
  const determineTaxCategory = (category: string, description: string): string => {
    const lowerCategory = category.toLowerCase();
    const lowerDesc = description.toLowerCase();
    
    if (lowerCategory.includes('income')) {
      if (lowerDesc.includes('salary') || lowerDesc.includes('wage')) {
        return 'Income from Salary';
      } else if (lowerDesc.includes('dividend')) {
        return 'Income from Other Sources: Dividend';
      } else if (lowerDesc.includes('interest')) {
        return 'Income from Other Sources: Interest';
      } else if (lowerDesc.includes('rent')) {
        return 'Income from House Property';
      } else if (lowerDesc.includes('business') || lowerDesc.includes('professional')) {
        return 'Income from Business/Profession';
      } else if (lowerDesc.includes('capital') || lowerDesc.includes('gain') || lowerDesc.includes('profit')) {
        return 'Capital Gains';
      } else {
        return 'Other Income';
      }
    } else if (lowerCategory.includes('investment')) {
      if (lowerDesc.includes('ppf') || lowerDesc.includes('life insurance')) {
        return 'Deductions under Section 80C: PPF/Insurance';
      } else if (lowerDesc.includes('elss') || lowerDesc.includes('mutual fund')) {
        return 'Deductions under Section 80C: ELSS/Mutual Funds';
      } else if (lowerDesc.includes('nsc') || lowerDesc.includes('savings certificate')) {
        return 'Deductions under Section 80C: NSC';
      } else if (lowerDesc.includes('nps') || lowerDesc.includes('pension')) {
        return 'Deductions under Section 80CCD: NPS';
      } else if (lowerDesc.includes('insurance') || lowerDesc.includes('medical')) {
        return 'Deductions under Section 80D: Health Insurance';
      } else if (lowerDesc.includes('fd') || lowerDesc.includes('fixed deposit')) {
        return 'Investment: Fixed Deposits';
      } else if (lowerDesc.includes('share') || lowerDesc.includes('stock')) {
        return 'Investment: Shares/Securities';
      } else {
        return 'Investment: Other';
      }
    } else if (lowerCategory.includes('expense')) {
      if (lowerDesc.includes('education') || lowerDesc.includes('tuition')) {
        return 'Deductions under Section 80E: Education Loan';
      } else if (lowerDesc.includes('donation') || lowerDesc.includes('charity')) {
        return 'Deductions under Section 80G: Donations';
      } else if (lowerDesc.includes('rent')) {
        return 'House Rent Allowance/Section 80GG';
      } else if (lowerDesc.includes('medical') || lowerDesc.includes('health')) {
        return 'Expense: Medical/Health';
      } else if (lowerDesc.includes('travel')) {
        return 'Expense: Travel';
      } else if (lowerDesc.includes('utility') || lowerDesc.includes('electricity') || lowerDesc.includes('water')) {
        return 'Expense: Utilities';
      } else if (lowerCategory.includes('business')) {
        if (lowerDesc.includes('equipment') || lowerDesc.includes('machinery')) {
          return 'Business Expense: Equipment';
        } else if (lowerDesc.includes('salary') || lowerDesc.includes('employee')) {
          return 'Business Expense: Employee Cost';
        } else if (lowerDesc.includes('professional') || lowerDesc.includes('legal')) {
          return 'Business Expense: Professional Fees';
        } else {
          return 'Business Expense: Other';
        }
      } else {
        return 'General Expense';
      }
    }
    
    return 'Other';
  };

  // Helper function to determine if transaction is eligible for tax deduction
  const isEligibleForDeduction = (category: string, description: string): string => {
    const lowerCategory = category.toLowerCase();
    const lowerDesc = description.toLowerCase();
    
    if (lowerCategory.includes('investment')) {
      if (lowerDesc.includes('ppf') || lowerDesc.includes('elss') || lowerDesc.includes('80c') || 
          lowerDesc.includes('life insurance') || lowerDesc.includes('nsc') || lowerDesc.includes('sukanya') ||
          lowerDesc.includes('tuition fee') || lowerDesc.includes('home loan principal')) {
        return 'Section 80C (₹1,50,000)';
      } else if (lowerDesc.includes('nps') || lowerDesc.includes('pension')) {
        return 'Section 80CCD (₹50,000)';
      } else if (lowerDesc.includes('rajiv gandhi') || lowerDesc.includes('equity saving')) {
        return 'Section 80CCG (₹25,000)';
      }
    } else if (lowerCategory.includes('expense')) {
      if (lowerDesc.includes('insurance') || lowerDesc.includes('medical') || lowerDesc.includes('health')) {
        return 'Section 80D (₹25,000-₹1,00,000)';
      } else if (lowerDesc.includes('donation') || lowerDesc.includes('charity')) {
        return 'Section 80G (Varies)';
      } else if (lowerDesc.includes('education') || lowerDesc.includes('tuition') || lowerDesc.includes('student loan')) {
        return 'Section 80E (No Limit)';
      } else if (lowerDesc.includes('rent') && !lowerDesc.includes('income')) {
        return 'Section 80GG (₹60,000)';
      } else if (lowerDesc.includes('disability') || lowerDesc.includes('handicap')) {
        return 'Section 80U (₹75,000-₹1,25,000)';
      } else if (lowerDesc.includes('interest') && lowerDesc.includes('saving')) {
        return 'Section 80TTA (₹10,000)';
      } else if (lowerDesc.includes('electric vehicle') || lowerDesc.includes('ev loan')) {
        return 'Section 80EEB (₹1,50,000)';
      }
    }
    
    const taxCategory = determineTaxCategory(category, description);
    if (taxCategory.includes('Deductions under Section')) {
      return taxCategory;
    }
    return 'No';
  };

    // Helper function to format date in DD/MM/YYYY format
    const formatDateToDDMMYYYY = (dateStr: string): string => {
      try {
        // Check if it's a timestamp (number)
        const dateNum = Number(dateStr);
        if (!isNaN(dateNum)) {
          const date = new Date(dateNum * 1000); // Convert seconds to milliseconds
          return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).replace(/\//g, '/'); // Ensure DD/MM/YYYY format
        }
        
        // If it's already a date string
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '/');
      } catch (e) {
        return 'Invalid Date';
      }
    };
    
    // Helper function to extract section reference from tax deduction
    const extractSectionReference = (taxDeduction: string): string => {
      if (taxDeduction === 'No') return '';
      
      // Extract section number (e.g., "Section 80C (₹1,50,000)" -> "80C")
      const match = taxDeduction.match(/Section (\d+[A-Z]+)/);
      return match ? match[1] : '';
    };

    records.forEach((record, index) => {
      const netEffect = getNetEffectForRecord(record.id || "");
      
      if (netEffect) {
        // This record has been corrected - show net effect
        const category = netEffect.netEffect.category;
        const description = netEffect.netEffect.description;
        const amount = parseFloat(netEffect.netEffect.amount);
        const taxDeduction = isEligibleForDeduction(category, description);
        const taxCategory = determineTaxCategory(category, description);
        
        // Calculate TDS for income transactions (assuming 10% standard rate for salary, 2% for others)
        let tdsRate = 0;
        if (category.toLowerCase().includes('income')) {
          if (taxCategory.includes('Salary')) {
            tdsRate = 0.1; // 10% for salary
          } else if (taxCategory.includes('Business')) {
            tdsRate = 0.02; // 2% for business income
          } else {
            tdsRate = 0.05; // 5% for other income
          }
        }
        const tdsAmount = amount > 0 ? amount * tdsRate : 0;
        
        processedRecords.push({
          serial: index + 1,
          date: netEffect.netEffect.date,
          formattedDate: formatDateToDDMMYYYY(netEffect.netEffect.date),
          description: netEffect.netEffect.description,
          amount: amount,
          category: netEffect.netEffect.category,
          notes: netEffect.netEffect.notes || '',
          hash: record.transactionHash || 'Pending',
          block: record.blockNumber || 'N/A',
          timestamp: record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A',
          status: 'Corrected',
          originalAmount: netEffect.original.amount,
          correctionReason: netEffect.corrections[0]?.correctionData?.correctionReason || 'N/A',
          pan: '', // Placeholder for PAN
          gstin: '', // Placeholder for GSTIN
          tdsDeducted: tdsAmount,
          taxDeduction: taxDeduction,
          sectionReference: extractSectionReference(taxDeduction),
          taxCategory: taxCategory,
        });

        // Add to correction history
        netEffect.corrections.forEach((correction) => {
          correctionHistory.push({
            serial: correctionIndex++,
            originalId: record.id,
            originalHash: record.transactionHash,
            correctionHash: correction.transactionHash,
            correctionDate: new Date(correction.timestamp || 0).toLocaleString(),
            correctionReason: correction.correctionData.correctionReason,
            originalAmount: netEffect.original.amount,
            correctedAmount: correction.amount,
            difference: (parseFloat(correction.amount) - parseFloat(netEffect.original.amount)).toFixed(2),
            correctedFields: correction.correctionData.correctedFields.join(', '),
          });
        });
      } else {
        // This record has not been corrected - show as is
        const category = record.category;
        const description = record.description;
        const amount = parseFloat(record.amount);
        const taxDeduction = isEligibleForDeduction(category, description);
        const taxCategory = determineTaxCategory(category, description);
        
        // Calculate TDS for income transactions based on income type
        let tdsRate = 0;
        if (category.toLowerCase().includes('income')) {
          if (taxCategory.includes('Salary')) {
            tdsRate = 0.1; // 10% for salary
          } else if (taxCategory.includes('Business')) {
            tdsRate = 0.02; // 2% for business income
          } else {
            tdsRate = 0.05; // 5% for other income
          }
        }
        const tdsAmount = amount > 0 ? amount * tdsRate : 0;
        
        processedRecords.push({
          serial: index + 1,
          date: record.date,
          formattedDate: formatDateToDDMMYYYY(record.date),
          description: record.description,
          amount: amount,
          category: record.category,
          notes: record.notes || '',
          hash: record.transactionHash || 'Pending',
          block: record.blockNumber || 'N/A',
          timestamp: record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A',
          status: 'Original',
          originalAmount: record.amount,
          correctionReason: 'N/A',
          pan: '', // Placeholder for PAN
          gstin: '', // Placeholder for GSTIN
          tdsDeducted: tdsAmount,
          taxDeduction: taxDeduction,
          sectionReference: extractSectionReference(taxDeduction),
          taxCategory: taxCategory,
        });
      }
    });

    return { processedRecords, correctionHistory };
  };

  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const { processedRecords, correctionHistory } = processRecordsForExport();
      
      // Sheet 1: Transaction Details (Net Corrected Values)
      const transactionSheet = workbook.addWorksheet('Transactions');
      transactionSheet.columns = [
        { header: 'Serial No.', key: 'serial', width: 10 },
        { header: 'Date (DD/MM/YYYY)', key: 'formattedDate', width: 18 },
        { header: 'Description', key: 'description', width: 30 },
        { header: `Amount (${getCurrencySymbol()})`, key: 'amount', width: 15 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Tax Category', key: 'taxCategory', width: 25 },
        { header: 'PAN Number', key: 'pan', width: 15 },
        { header: 'GSTIN', key: 'gstin', width: 20 },
        { header: `TDS Deducted (${getCurrencySymbol()})`, key: 'tdsDeducted', width: 15 },
        { header: 'Eligible for Deduction', key: 'taxDeduction', width: 25 },
        { header: 'Section Reference', key: 'sectionReference', width: 20 },
        { header: 'Remarks/Notes', key: 'notes', width: 30 },
        { header: 'Status', key: 'status', width: 12 },
        { header: `Original Amount (${getCurrencySymbol()})`, key: 'originalAmount', width: 15 },
        { header: 'Correction Reason', key: 'correctionReason', width: 30 },
        { header: 'Transaction Hash', key: 'hash', width: 40 },
        { header: 'Block Number', key: 'block', width: 15 },
        { header: 'Timestamp', key: 'timestamp', width: 20 },
      ];
      
      // Add conditional formatting to highlight missing PAN/GSTIN
      transactionSheet.addConditionalFormatting({
        ref: 'G2:G1000', // PAN column
        rules: [
          {
            type: 'expression',
            formulae: ['LEN(G2)=0'],
            style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFCCCC' } } },
          }
        ]
      });
      
      transactionSheet.addConditionalFormatting({
        ref: 'H2:H1000', // GSTIN column
        rules: [
          {
            type: 'expression',
            formulae: ['AND(LEN(H2)=0,SEARCH("Business",F2)>0)'],
            style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFCCCC' } } },
          }
        ]
      });

      processedRecords.forEach((record) => {
        transactionSheet.addRow(record);
      });
      
      // Add dropdown list for Status column
      for (let i = 2; i <= transactionSheet.rowCount; i++) {
        transactionSheet.getCell(`M${i}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['"Original,Corrected,Pending,Verified"']
        };
      }
      
      // Add conditional formatting to highlight missing TDS for income transactions
      transactionSheet.addConditionalFormatting({
        ref: 'I2:I1000',
        rules: [
          {
            type: 'expression',
            formulae: ['AND(D2>10000,SEARCH("Income",F2)>0,I2=0)'],
            style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFFF00' } } }, // Yellow highlight
          }
        ]
      });
      
      // Freeze the top row
      transactionSheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }
      ];
      
      // Enable filters
      transactionSheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: transactionSheet.columns.length }
      };

      // Sheet 2: Correction History
      if (correctionHistory.length > 0) {
        const correctionSheet = workbook.addWorksheet('Correction History');
        correctionSheet.columns = [
          { header: 'Serial No.', key: 'serial', width: 10 },
          { header: 'Original Transaction ID', key: 'originalId', width: 20 },
          { header: 'Original Hash', key: 'originalHash', width: 40 },
          { header: 'Correction Hash', key: 'correctionHash', width: 40 },
          { header: 'Correction Date', key: 'correctionDate', width: 20 },
          { header: 'Correction Reason', key: 'correctionReason', width: 40 },
          { header: 'Original Amount', key: 'originalAmount', width: 15 },
          { header: 'Corrected Amount', key: 'correctedAmount', width: 15 },
          { header: 'Difference', key: 'difference', width: 15 },
          { header: 'Corrected Fields', key: 'correctedFields', width: 30 },
        ];

        correctionHistory.forEach((correction) => {
          correctionSheet.addRow(correction);
        });
      }

      // Sheet 3: Category Summary (Based on Net Values)
      const summarySheet = workbook.addWorksheet('Category Summary');
      summarySheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: `Total Amount (${getCurrencySymbol()})`, key: 'total', width: 20 },
        { header: 'Transaction Count', key: 'count', width: 20 },
        { header: 'Percentage', key: 'percentage', width: 15 },
        { header: 'Corrected Count', key: 'correctedCount', width: 20 },
      ];

      const categoryTotals = processedRecords.reduce((acc, record) => {
        const category = record.category;
        const amount = record.amount;
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0, correctedCount: 0 };
        }
        acc[category].total += amount;
        acc[category].count += 1;
        if (record.status === 'Corrected') {
          acc[category].correctedCount += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; count: number; correctedCount: number }>);

      const totalAmount = processedRecords.reduce((sum, r) => sum + r.amount, 0);
      const totalCorrectedCount = processedRecords.filter(r => r.status === 'Corrected').length;

      Object.entries(categoryTotals).forEach(([category, data]) => {
        summarySheet.addRow({
          category,
          total: data.total,
          count: data.count,
          percentage: `${((data.total / totalAmount) * 100).toFixed(2)}%`,
          correctedCount: data.correctedCount,
        });
      });

      // Add totals row
      summarySheet.addRow({
        category: 'TOTAL',
        total: totalAmount,
        count: processedRecords.length,
        percentage: '100.00%',
        correctedCount: totalCorrectedCount,
      });

      // Sheet 4: Metadata
      const metadataSheet = workbook.addWorksheet('Metadata');
      metadataSheet.columns = [
        { header: 'Property', key: 'property', width: 20 },
        { header: 'Value', key: 'value', width: 40 },
      ];

      const metadata = [
        { property: 'Export Date', value: new Date().toLocaleString() },
        { property: 'Export Type', value: exportConfig.type === 'financial-year' ? 'Financial Year' : 'Custom Range' },
        { property: 'Period', value: exportConfig.type === 'financial-year' 
          ? `FY ${exportConfig.financialYear}-${exportConfig.financialYear + 1}` 
          : `${exportConfig.customRange.startDate?.toLocaleDateString()} - ${exportConfig.customRange.endDate?.toLocaleDateString()}` },
        { property: 'Total Records', value: processedRecords.length },
        { property: `Total Amount (${getCurrencySymbol()})`, value: formatCurrency(totalAmount).replace(getCurrencySymbol(), '') },
        { property: 'Corrected Records', value: totalCorrectedCount },
        { property: 'Correction Rate', value: `${((totalCorrectedCount / processedRecords.length) * 100).toFixed(2)}%` },
        { property: 'Blockchain Network', value: 'Ethereum Sepolia Testnet' },
        { property: 'Application', value: 'VIRTUSA LEDGER' },
        { property: 'Version', value: '1.0.0' },
      ];

      metadata.forEach(row => metadataSheet.addRow(row));

      // Sheet 5: Tax Summary
      const taxSummarySheet = workbook.addWorksheet('Tax Summary');
      
      // Section 1: Income Summary
      taxSummarySheet.addRow(['INCOME SUMMARY', '', '', '']);
      taxSummarySheet.getRow(taxSummarySheet.rowCount).font = { bold: true, size: 12 };
      taxSummarySheet.getRow(taxSummarySheet.rowCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
      
      taxSummarySheet.addRow(['Income Type', `Amount (${getCurrencySymbol()})`, 'TDS Deducted', 'Net Amount']);
      taxSummarySheet.getRow(taxSummarySheet.rowCount).font = { bold: true };
      
      // Group income by tax category with formulas to auto-populate from transaction sheet
      const incomeCategoryRows: Record<string, number> = {};
      let currentRow = 3; // Starting after header and title rows
      
      // Get unique tax categories for income
      const incomeTaxCategories = Array.from(new Set(
        processedRecords
          .filter(record => record.amount > 0)
          .map(record => record.taxCategory)
      ));
      
      let totalIncome = 0;
      let totalTDS = 0;
      
      incomeTaxCategories.forEach(category => {
        taxSummarySheet.addRow([
          category,
          { formula: `SUMIFS(Transactions!D:D,Transactions!F:F,"${category}")` },
          { formula: `SUMIFS(Transactions!I:I,Transactions!F:F,"${category}")` },
          { formula: `B${currentRow}-C${currentRow}` }
        ]);
        incomeCategoryRows[category] = currentRow;
        currentRow++;
      });
      
      // Add total row with formulas
      const totalIncomeRow = currentRow;
      taxSummarySheet.addRow([
        'Total Income',
        { formula: `SUM(B3:B${currentRow-1})` },
        { formula: `SUM(C3:C${currentRow-1})` },
        { formula: `B${currentRow}-C${currentRow}` }
      ]);
      taxSummarySheet.getRow(taxSummarySheet.rowCount).font = { bold: true };
      currentRow++;
      
      // Add a blank row
      taxSummarySheet.addRow(['']);
      currentRow++;
      
      // Section 2: Deductions Summary
      taxSummarySheet.addRow(['DEDUCTIONS SUMMARY', '', '', '']);
      taxSummarySheet.getRow(taxSummarySheet.rowCount).font = { bold: true, size: 12 };
      taxSummarySheet.getRow(taxSummarySheet.rowCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
      currentRow++;
      
      taxSummarySheet.addRow(['Deduction Type', `Amount (${getCurrencySymbol()})`, 'Limit', 'Eligible Amount']);
      taxSummarySheet.getRow(taxSummarySheet.rowCount).font = { bold: true };
      currentRow++;
      
      // Define deduction limits as per Indian Income Tax Act with search patterns for formulas
      const deductionSections = [
        { section: 'Section 80C', limit: 150000, searchPattern: 'Section 80C' },
        { section: 'Section 80CCD', limit: 50000, searchPattern: 'Section 80CCD' },
        { section: 'Section 80CCG', limit: 25000, searchPattern: 'Section 80CCG' },
        { section: 'Section 80D', limit: 100000, searchPattern: 'Section 80D' },
        { section: 'Section 80E', limit: 0, searchPattern: 'Section 80E' }, // No limit
        { section: 'Section 80G', limit: 0, searchPattern: 'Section 80G' }, // Varies
        { section: 'Section 80GG', limit: 60000, searchPattern: 'Section 80GG' },
        { section: 'Section 80TTA', limit: 10000, searchPattern: 'Section 80TTA' },
        { section: 'Section 80TTB', limit: 50000, searchPattern: 'Section 80TTB' },
        { section: 'Section 80U', limit: 125000, searchPattern: 'Section 80U' },
        { section: 'Section 80EEB', limit: 150000, searchPattern: 'Section 80EEB' }
      ];
      
      const deductionSectionRows: Record<string, number> = {};
      
      deductionSections.forEach(({ section, limit, searchPattern }) => {
        taxSummarySheet.addRow([
          section,
          { formula: `ABS(SUMIFS(Transactions!D:D,Transactions!J:J,"*${searchPattern}*"))` },
          limit > 0 ? limit : 'No Limit',
          { formula: `MIN(B${currentRow},${limit > 0 ? limit : 999999999})` }
        ]);
        
        deductionSectionRows[section] = currentRow;
        currentRow++;
      });
      
      // Add total row with formulas
      const totalDeductionsRow = currentRow;
      taxSummarySheet.addRow([
        'Total Deductions',
        { formula: `SUM(B${deductionSectionRows['Section 80C']}:B${currentRow-1})` },
        '',
        { formula: `SUM(D${deductionSectionRows['Section 80C']}:D${currentRow-1})` }
      ]);
      taxSummarySheet.getRow(taxSummarySheet.rowCount).font = { bold: true };
      currentRow++;
      
      // Add a blank row
      taxSummarySheet.addRow(['']);
      currentRow++;
      
      // Section 3: Tax Calculation Summary
      taxSummarySheet.addRow(['TAX CALCULATION SUMMARY', '', '', '']);
      taxSummarySheet.getRow(taxSummarySheet.rowCount).font = { bold: true, size: 12 };
      taxSummarySheet.getRow(taxSummarySheet.rowCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
      currentRow++;
      
      taxSummarySheet.addRow(['Description', `Amount (${getCurrencySymbol()})`, '', '']);
      taxSummarySheet.getRow(taxSummarySheet.rowCount).font = { bold: true };
      currentRow++;
      
      taxSummarySheet.addRow([
        'Gross Total Income',
        { formula: `B${totalIncomeRow}` },
        '',
        ''
      ]);
      currentRow++;
      
      taxSummarySheet.addRow([
        'Less: Total Eligible Deductions',
        { formula: `D${totalDeductionsRow}` },
        '',
        ''
      ]);
      currentRow++;
      
      taxSummarySheet.addRow([
        'Taxable Income',
        { formula: `MAX(0,B${currentRow-2}-B${currentRow-1})` },
        '',
        ''
      ]);
      taxSummarySheet.getRow(taxSummarySheet.rowCount).font = { bold: true };
      
      // Format the Tax Summary sheet
      taxSummarySheet.columns.forEach(column => {
        column.width = 25;
      });
      
      // Freeze the top row
      taxSummarySheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }
      ];
      
      // Enable filters
      taxSummarySheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: 4 }
      };
      
      // Sheet 6: Help & Instructions
      const helpSheet = workbook.addWorksheet('Help & Instructions');
      
      // Format the help sheet
      helpSheet.columns = [
        { header: '', key: 'section', width: 25 },
        { header: '', key: 'content', width: 75 }
      ];
      
      // Add title
      helpSheet.addRow(['INDIAN TAX FILING GUIDE', '']);
      helpSheet.getRow(helpSheet.rowCount).font = { bold: true, size: 14 };
      helpSheet.getRow(helpSheet.rowCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
      
      // Add introduction
      helpSheet.addRow(['', '']);
      helpSheet.addRow(['Introduction', 'This Excel file is designed to help you organize your financial records for Indian income tax filing. All monetary values are in Indian Rupees (₹).']);
      helpSheet.getRow(helpSheet.rowCount).font = { bold: true };
      
      // Add field explanations
      helpSheet.addRow(['', '']);
      helpSheet.addRow(['FIELD EXPLANATIONS', '']);
      helpSheet.getRow(helpSheet.rowCount).font = { bold: true, size: 12 };
      
      const fieldExplanations = [
        ['Date (DD/MM/YYYY)', 'Transaction date in the Indian date format (Day/Month/Year)'],
        ['Description', 'Details of the transaction'],
        ['Amount (₹)', 'Transaction amount in Indian Rupees'],
        ['Category', 'General category of the transaction (Income, Expense, Investment, etc.)'],
        ['Tax Category', 'Specific tax category aligned with Indian tax filing requirements'],
        ['PAN Number', 'Permanent Account Number - required for tax filing. Please fill in your PAN.'],
        ['GSTIN', 'Goods and Services Tax Identification Number - required for business transactions'],
        ['TDS Deducted (₹)', 'Tax Deducted at Source amount'],
        ['Eligible for Deduction', 'Whether the transaction is eligible for tax deduction and under which section'],
        ['Section Reference', 'Income Tax Act section reference for the deduction'],
        ['Remarks/Notes', 'Additional information about the transaction']
      ];
      
      fieldExplanations.forEach(([field, explanation]) => {
        helpSheet.addRow([field, explanation]);
      });
      
      // Add tax section explanations
      helpSheet.addRow(['', '']);
      helpSheet.addRow(['TAX SECTIONS', '']);
      helpSheet.getRow(helpSheet.rowCount).font = { bold: true, size: 12 };
      
      const taxSections = [
        ['Section 80C', 'Deductions for Life Insurance Premium, PPF, ELSS, NSC, etc. (Limit: ₹1,50,000)'],
        ['Section 80CCD', 'Deductions for contributions to National Pension System (NPS) (Additional limit: ₹50,000)'],
        ['Section 80D', 'Deductions for Medical Insurance Premium (Limit: ₹25,000 for self/family, additional ₹25,000 for parents, ₹50,000 for senior citizens)'],
        ['Section 80E', 'Deductions for Interest on Education Loan (No limit)'],
        ['Section 80G', 'Deductions for Donations to Charitable Institutions (Limits vary based on institution)'],
        ['Section 80GG', 'Deductions for House Rent Paid (Limit: ₹60,000)'],
        ['Section 80TTA', 'Deductions for Interest on Savings Account (Limit: ₹10,000)'],
        ['Section 80TTB', 'Deductions for Interest Income for Senior Citizens (Limit: ₹50,000)'],
        ['Section 80U', 'Deductions for Persons with Disabilities (Limit: ₹75,000 or ₹1,25,000 based on disability percentage)']
      ];
      
      taxSections.forEach(([section, explanation]) => {
        helpSheet.addRow([section, explanation]);
      });
      
      // Add sample data
      helpSheet.addRow(['', '']);
      helpSheet.addRow(['SAMPLE DATA', '']);
      helpSheet.getRow(helpSheet.rowCount).font = { bold: true, size: 12 };
      
      helpSheet.addRow(['Example 1', 'Salary Income: Date: 01/04/2023, Description: "Monthly Salary", Amount: ₹50,000, Category: "Income: Salary", Tax Category: "Income from Salary", PAN: "ABCDE1234F", TDS: ₹5,000']);
      helpSheet.addRow(['Example 2', 'Investment: Date: 15/06/2023, Description: "PPF Contribution", Amount: ₹25,000, Category: "Investment: PPF", Tax Category: "Deductions under Section 80C: PPF/Insurance", Eligible for Deduction: "Section 80C (₹1,50,000)"']);
      helpSheet.addRow(['Example 3', 'Business Expense: Date: 22/07/2023, Description: "Office Supplies", Amount: ₹-5,000, Category: "Expense: Business", Tax Category: "Business Expense: Other", GSTIN: "27AAPFU0939F1ZV"']);
      helpSheet.addRow(['Example 4', 'ELSS Investment: Date: 10/01/2023, Description: "ELSS Mutual Fund", Amount: ₹50,000, Category: "Investment: ELSS", Tax Category: "Deductions under Section 80C: ELSS/Mutual Funds", Eligible for Deduction: "Section 80C (₹1,50,000)"']);
      helpSheet.addRow(['Example 5', 'Health Insurance: Date: 05/05/2023, Description: "Health Insurance Premium", Amount: ₹25,000, Category: "Expense: Insurance", Tax Category: "Deductions under Section 80D: Health Insurance", Eligible for Deduction: "Section 80D (₹25,000)"']);
      helpSheet.addRow(['Example 6', 'House Rent: Date: 03/04/2023, Description: "Monthly Rent Payment", Amount: ₹-15,000, Category: "Expense: Rent", Tax Category: "House Rent Allowance/Section 80GG", Eligible for Deduction: "Section 80GG (₹60,000)"']);
      helpSheet.addRow(['Example 7', 'Business Income: Date: 25/06/2023, Description: "Client Payment", Amount: ₹100,000, Category: "Income: Business", Tax Category: "Income from Business/Profession", PAN: "ABCDE1234F", GSTIN: "27AAPFU0939F1ZV", TDS: ₹10,000']);
      
      // Add business user specific section
      helpSheet.addRow(['', '']);
      helpSheet.addRow(['BUSINESS USER GUIDE', '']);
      helpSheet.getRow(helpSheet.rowCount).font = { bold: true, size: 12 };
      
      const businessGuide = [
        ['Business Expenses', 'For ITR-3/4 filers, business expenses are categorized more granularly (Office Rent, Utilities, Travel, Professional Fees, etc.) to help with profit & loss statement preparation.'],
        ['GSTIN', 'Always include your GSTIN for all business transactions to ensure proper GST reconciliation.'],
        ['Expense Categories', 'Use specific expense categories like "Business Expense: Office Rent" instead of generic "Expense: Business" for easier ITR filing.'],
        ['Depreciation', 'For capital assets, note the depreciation rate in the Remarks column for reference during ITR filing.'],
        ['Section 44AD/ADA', 'For presumptive taxation scheme users (ITR-4), mark relevant transactions in the Remarks column.'],
        ['Books of Accounts', 'If maintaining books of accounts, use the Category Summary sheet to reconcile with your balance sheet and P&L statement.']
      ];
      
      businessGuide.forEach(([topic, explanation]) => {
        helpSheet.addRow([topic, explanation]);
      });
      
      // Add tips
      helpSheet.addRow(['', '']);
      helpSheet.addRow(['TIPS FOR TAX FILING', '']);
      helpSheet.getRow(helpSheet.rowCount).font = { bold: true, size: 12 };
      
      const tips = [
        ['Tip 1', 'Fill in your PAN Number for all income transactions to avoid TDS mismatches'],
        ['Tip 2', 'Ensure all business transactions have a valid GSTIN'],
        ['Tip 3', 'Check the Tax Summary sheet to ensure you haven\'t exceeded deduction limits'],
        ['Tip 4', 'Use the Section Reference column to easily identify which deductions to claim in your ITR'],
        ['Tip 5', 'Red highlighted cells indicate missing required information that should be filled in']
      ];
      
      tips.forEach(([tip, explanation]) => {
        helpSheet.addRow([tip, explanation]);
      });
      
      // Format help sheet
      for (let i = 1; i <= helpSheet.rowCount; i++) {
        const row = helpSheet.getRow(i);
        if (row.getCell(1).value && row.getCell(1).value.toString().includes('SECTION') || 
            row.getCell(1).value && row.getCell(1).value.toString().includes('FIELD') || 
            row.getCell(1).value && row.getCell(1).value.toString().includes('SAMPLE') || 
            row.getCell(1).value && row.getCell(1).value.toString().includes('TIPS')) {
          row.font = { bold: true };
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        }
      }
      
      // Sheet 7: ITR Reference
      const itrSheet = workbook.addWorksheet('ITR Reference');
      
      itrSheet.columns = [
        { header: 'ITR Form', key: 'form', width: 15 },
        { header: 'Applicable For', key: 'applicable', width: 40 },
        { header: 'Corresponding Sheet/Section', key: 'reference', width: 40 },
        { header: 'Sample Formula/Filter', key: 'formula', width: 60 }
      ];
      
      const itrForms = [
        ['ITR-1 (Sahaj)', 'Individuals with income from Salary, One House Property, Other Sources (interest etc.)', 'Transactions sheet (filter by Tax Category), Income Summary in Tax Summary sheet', '=SUMIFS(Transactions!D:D,Transactions!Q:Q,"Income from Salary")'],
        ['ITR-2', 'Individuals and HUFs not having income from Business/Profession', 'Transactions sheet, Tax Summary sheet', '=SUMIFS(Transactions!D:D,Transactions!Q:Q,"Income from House Property")'],
        ['ITR-3', 'Individuals and HUFs having income from Business/Profession', 'All sheets, especially Transactions with Business Income', '=SUMIFS(Transactions!D:D,Transactions!Q:Q,"Income from Business/Profession")'],
        ['ITR-4 (Sugam)', 'Presumptive Business Income', 'Transactions sheet (filter by Business Income)', '=SUMIFS(Transactions!D:D,Transactions!Q:Q,"*Business*")'],
        ['', '', '', '']
      ];
      
      itrForms.forEach(form => {
        itrSheet.addRow(form);
      });
      
      // Add ITR-specific sections
      itrSheet.addRow(['ITR Section', 'Description', 'Data Source', 'Sample Formula/Filter']);
      itrSheet.getRow(itrSheet.rowCount).font = { bold: true };
      itrSheet.getRow(itrSheet.rowCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
      
      const itrSections = [
        ['Salary Income', 'Income from salary/pension', 'Tax Summary sheet', '=SUMIFS(Transactions!D:D,Transactions!Q:Q,"Income from Salary")'],
        ['House Property', 'Income from house property', 'Tax Summary sheet', '=SUMIFS(Transactions!D:D,Transactions!Q:Q,"Income from House Property")'],
        ['Business Income', 'Income from business/profession', 'Tax Summary sheet', '=SUMIFS(Transactions!D:D,Transactions!Q:Q,"Income from Business/Profession")'],
        ['Capital Gains', 'Short-term and long-term capital gains', 'Tax Summary sheet', '=SUMIFS(Transactions!D:D,Transactions!Q:Q,"Capital Gains")'],
        ['Other Sources', 'Interest, dividends, etc.', 'Tax Summary sheet', '=SUMIFS(Transactions!D:D,Transactions!Q:Q,"Income from Other Sources*")'],
        ['Deductions 80C', 'Life insurance, PPF, ELSS, etc.', 'Tax Summary sheet', '=SUMIFS(Transactions!D:D,Transactions!Q:Q,"*Section 80C*")'],
        ['Deductions 80D', 'Medical insurance premium', 'Tax Summary sheet', '=SUMIFS(Transactions!D:D,Transactions!Q:Q,"*Section 80D*")'],
        ['TDS', 'Tax deducted at source', 'Tax Summary sheet', '=SUM(Transactions!I:I)'],
        ['Advance Tax', 'Tax paid in advance', 'Filter Transactions by "Advance Tax"', '=SUMIFS(Transactions!D:D,Transactions!C:C,"*Advance Tax*")']
      ];
      
      itrSections.forEach(section => {
        itrSheet.addRow(section);
      });
      
      // Format ITR sheet
      for (let i = 1; i <= itrSheet.rowCount; i++) {
        if (i === 1 || i === 6) {
          itrSheet.getRow(i).font = { bold: true };
          itrSheet.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
        }
      }
      
      // Freeze the top row and enable filters
      itrSheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }
      ];
      
      itrSheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: 4 }
      };
      
      // Add formulas to transaction sheet
      // Add formula to auto-calculate totals
      const lastRow = transactionSheet.rowCount + 1;
      transactionSheet.addRow({
        serial: 'TOTAL',
        amount: { formula: `SUM(D2:D${lastRow-1})` },
        tdsDeducted: { formula: `SUM(I2:I${lastRow-1})` }
      });
      transactionSheet.getRow(lastRow).font = { bold: true };
      
      // Protect formula cells
      transactionSheet.protect('password', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: true,
        formatColumns: true,
        formatRows: true,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: true,
        autoFilter: true,
        pivotTables: true
      });
      
      // Unlock cells that need manual entry
      for (let i = 2; i <= lastRow-1; i++) {
        // PAN and GSTIN columns
        transactionSheet.getCell(`G${i}`).protection = { locked: false };
        transactionSheet.getCell(`H${i}`).protection = { locked: false };
      }
      
      // Generate and download file
      const fileName = generateFileName();
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);

      toast.success(`Export completed! Downloaded as ${fileName}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Ready to Export</h3>
            <p className="text-sm text-muted-foreground">
              Download your financial data as an Excel file with correction history
            </p>
          </div>
          
          <Button
            onClick={handleExport}
            disabled={isExportDisabled()}
            size="lg"
            className="min-w-[200px]"
          >
            <Download className="mr-2 h-5 w-5" />
            Export to Excel
          </Button>
          
          {isExportDisabled() && (
            <p className="text-sm text-muted-foreground text-center">
              {records.length === 0 
                ? "No data available for export"
                : "Please select both start and end dates"
              }
            </p>
          )}
          
          {!isExportDisabled() && (
            <div className="text-center text-sm text-muted-foreground">
              <FileSpreadsheet className="inline h-4 w-4 mr-1" />
              File: {generateFileName()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportButton;