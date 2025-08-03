import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Popover, PopoverContent, PopoverTrigger } from "./UIComponents";
import { Download, FileSpreadsheet, Settings, CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from "sonner";
import { formatCurrency } from './src/config/currency';

// --- ExportButton ---
function ExportButton({ records, exportConfig }) {
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
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      // Sheet 1: Transaction Details
      const transactionSheet = workbook.addWorksheet('Transactions');
      transactionSheet.columns = [
        { header: 'Serial No.', key: 'serial', width: 10 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Amount (INR)', key: 'amount', width: 15 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Notes', key: 'notes', width: 30 },
        { header: 'Transaction Hash', key: 'hash', width: 40 },
        { header: 'Block Number', key: 'block', width: 15 },
        { header: 'Timestamp', key: 'timestamp', width: 20 },
        { header: 'Hex Data', key: 'hexData', width: 40 },
      ];
      records.forEach((record, index) => {
        transactionSheet.addRow({
          serial: index + 1,
          date: record.date,
          description: record.description,
          amount: parseFloat(record.amount),
          category: record.category,
          notes: record.notes || '',
          hash: record.transactionHash || 'Pending',
          block: record.blockNumber || 'N/A',
          timestamp: record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A',
          hexData: record.hexData || 'N/A',
        });
      });
      // Sheet 2: Category Summary
      const summarySheet = workbook.addWorksheet('Category Summary');
      summarySheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Total Amount (INR)', key: 'total', width: 20 },
        { header: 'Transaction Count', key: 'count', width: 20 },
        { header: 'Percentage', key: 'percentage', width: 15 },
      ];
      const categoryTotals = records.reduce((acc, record) => {
        const category = record.category;
        const amount = parseFloat(record.amount);
        acc[category] = (acc[category] || 0) + amount;
        return acc;
      }, {});
      const totalAmount = records.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      Object.entries(categoryTotals).forEach(([category, total]) => {
        summarySheet.addRow({
          category,
          total,
          count: records.filter(r => r.category === category).length,
          percentage: `${((total / totalAmount) * 100).toFixed(2)}%`,
        });
      });
      summarySheet.addRow({ category: 'TOTAL', total: totalAmount, count: records.length, percentage: '100.00%' });
      // Sheet 3: Metadata
      const metadataSheet = workbook.addWorksheet('Metadata');
      metadataSheet.columns = [
        { header: 'Property', key: 'property', width: 20 },
        { header: 'Value', key: 'value', width: 40 },
      ];
      const metadata = [
        { property: 'Export Date', value: new Date().toLocaleString() },
        { property: 'Export Type', value: exportConfig.type === 'financial-year' ? 'Financial Year' : 'Custom Range' },
        { property: 'Period', value: exportConfig.type === 'financial-year' ? `FY ${exportConfig.financialYear}-${exportConfig.financialYear + 1}` : `${exportConfig.customRange.startDate?.toLocaleDateString()} - ${exportConfig.customRange.endDate?.toLocaleDateString()}` },
        { property: 'Total Records', value: records.length },
        { property: 'Total Amount (INR)', value: totalAmount.toFixed(2) },
        { property: 'Blockchain Network', value: 'Ethereum Sepolia Testnet' },
        { property: 'Application', value: 'VIRTUSA LEDGER' },
        { property: 'Version', value: '1.0.0' },
      ];
      metadata.forEach(row => metadataSheet.addRow(row));
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
            <p className="text-sm text-muted-foreground">Download your financial data as an Excel file</p>
          </div>
          <Button onClick={handleExport} disabled={isExportDisabled()} size="lg" className="min-w-[200px]"><Download className="mr-2 h-5 w-5" />Export to Excel</Button>
          {isExportDisabled() && (<p className="text-sm text-muted-foreground text-center">{records.length === 0 ? "No data available for export" : "Please select both start and end dates"}</p>)}
          {!isExportDisabled() && (<div className="text-center text-sm text-muted-foreground"><FileSpreadsheet className="inline h-4 w-4 mr-1" />File: {generateFileName()}</div>)}
        </div>
      </CardContent>
    </Card>
  );
}

// --- ExportFilters ---
function ExportFilters({ exportConfig, setExportConfig }) {
  const currentYear = new Date().getFullYear();
  const financialYears = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const setQuickDateRange = (range) => {
    const now = new Date();
    let start, end;
    switch (range) {
      case 'thisMonth': start = new Date(now.getFullYear(), now.getMonth(), 1); end = new Date(now.getFullYear(), now.getMonth() + 1, 0); break;
      case 'lastMonth': start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0); break;
      case 'thisYear': start = new Date(now.getFullYear(), 0, 1); end = new Date(now.getFullYear(), 11, 31); break;
    }
    setExportConfig({ ...exportConfig, type: 'custom-range', customRange: { startDate: start, endDate: end } });
  };
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5" />Export Configuration</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label>Export Type</Label><Select value={exportConfig.type} onValueChange={(value) => setExportConfig({ ...exportConfig, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="financial-year">Financial Year</SelectItem><SelectItem value="custom-range">Custom Date Range</SelectItem></SelectContent></Select></div>
        {exportConfig.type === 'financial-year' && (<div className="space-y-2"><Label>Financial Year</Label><Select value={exportConfig.financialYear.toString()} onValueChange={(value) => setExportConfig({ ...exportConfig, financialYear: parseInt(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{financialYears.map((year) => (<SelectItem key={year} value={year.toString()}>FY {year}-{year + 1}</SelectItem>))}</SelectContent></Select><p className="text-sm text-muted-foreground">Financial year runs from April to March</p></div>)}
        {exportConfig.type === 'custom-range' && (<div className="space-y-4"><div className="space-y-2"><Label>Quick Ranges</Label><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setQuickDateRange('thisMonth')}>This Month</Button><Button variant="outline" size="sm" onClick={() => setQuickDateRange('lastMonth')}>Last Month</Button><Button variant="outline" size="sm" onClick={() => setQuickDateRange('thisYear')}>This Year</Button></div></div><div className="space-y-2"><Label>Start Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={!exportConfig.customRange.startDate ? "text-muted-foreground" : ""}><CalendarIcon className="mr-2 h-4 w-4" />{exportConfig.customRange.startDate ? format(exportConfig.customRange.startDate, "PPP") : "Select start date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><input type="date" value={exportConfig.customRange.startDate ? format(exportConfig.customRange.startDate, "yyyy-MM-dd") : ""} onChange={e => setExportConfig({ ...exportConfig, customRange: { ...exportConfig.customRange, startDate: e.target.value ? new Date(e.target.value) : null } })} /></PopoverContent></Popover></div><div className="space-y-2"><Label>End Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={!exportConfig.customRange.endDate ? "text-muted-foreground" : ""}><CalendarIcon className="mr-2 h-4 w-4" />{exportConfig.customRange.endDate ? format(exportConfig.customRange.endDate, "PPP") : "Select end date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><input type="date" value={exportConfig.customRange.endDate ? format(exportConfig.customRange.endDate, "yyyy-MM-dd") : ""} onChange={e => setExportConfig({ ...exportConfig, customRange: { ...exportConfig.customRange, endDate: e.target.value ? new Date(e.target.value) : null } })} /></PopoverContent></Popover></div></div>)}</CardContent>
    </Card>
  );
}

// --- ExportPreview ---
function ExportPreview({ records, exportConfig }) {
  const summary = records.reduce((acc, record) => {
    const amount = parseFloat(record.amount);
    const category = record.category.toLowerCase();
    acc.total += amount;
    acc.categories[category] = (acc.categories[category] || 0) + amount;
    return acc;
  }, { total: 0, categories: {} });
  // Using the centralized formatCurrency function
  const getDateRangeDisplay = () => {
    if (exportConfig.type === 'financial-year') {
      return `FY ${exportConfig.financialYear}-${exportConfig.financialYear + 1}`;
    } else {
      if (exportConfig.customRange.startDate && exportConfig.customRange.endDate) {
        return `${exportConfig.customRange.startDate.toLocaleDateString()} - ${exportConfig.customRange.endDate.toLocaleDateString()}`;
      }
      return 'Custom Range (incomplete)';
    }
  };
  const isValidForExport = () => {
    if (exportConfig.type === 'financial-year') {
      return records.length > 0;
    } else {
      return exportConfig.customRange.startDate && exportConfig.customRange.endDate && records.length > 0;
    }
  };
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center"><FileSpreadsheet className="mr-2 h-5 w-5" />Export Preview</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center"><span className="text-sm font-medium">Date Range:</span><Badge variant="outline">{getDateRangeDisplay()}</Badge></div>
          <div className="flex justify-between items-center"><span className="text-sm font-medium">Total Records:</span><Badge variant={records.length > 0 ? "default" : "secondary"}>{records.length}</Badge></div>
        </div>
        {!isValidForExport() && (<div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md"><AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" /><div className="text-sm"><p className="font-medium text-amber-800">Export not ready</p><p className="text-amber-700">{records.length === 0 ? "No records found for the selected period." : "Please select both start and end dates for custom range export."}</p></div></div>)}
        {records.length > 0 && (<div className="space-y-3"><h4 className="text-sm font-medium">Category Breakdown</h4><div className="space-y-2">{Object.entries(summary.categories).map(([category, amount]) => (<div key={category} className="flex justify-between items-center text-sm"><span className="capitalize">{category}:</span><span className="font-medium">{formatCurrency(amount)}</span></div>))}<div className="border-t pt-2 flex justify-between items-center font-medium"><span>Total Amount:</span><span>{formatCurrency(summary.total)}</span></div></div></div>)}
        {isValidForExport() && (<div className="space-y-2"><h4 className="text-sm font-medium">Export will include:</h4><ul className="text-sm text-muted-foreground space-y-1"><li>• Transaction details sheet</li><li>• Category summary sheet</li><li>• Blockchain verification data</li><li>• Export metadata</li></ul></div>)}
      </CardContent>
    </Card>
  );
}

// Export all export components
export { ExportButton, ExportFilters, ExportPreview };

// Default export for Export page (example usage)
export default function ExportPage() {
  // Example state for export config and records
  const [exportConfig, setExportConfig] = useState({
    type: 'financial-year',
    financialYear: new Date().getFullYear(),
    customRange: { startDate: null, endDate: null },
  });
  const [records, setRecords] = useState([]); // You would get this from context or props
  return (
    <div>
      <ExportFilters exportConfig={exportConfig} setExportConfig={setExportConfig} />
      <ExportPreview records={records} exportConfig={exportConfig} />
      <ExportButton records={records} exportConfig={exportConfig} />
    </div>
  );
}