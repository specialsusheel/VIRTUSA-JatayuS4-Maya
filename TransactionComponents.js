import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Popover, PopoverContent, PopoverTrigger } from "./UIComponents";
import { Eye, Database, CalendarIcon, Search, X, Activity } from "lucide-react";
import { useBlockchain } from "./BlockchainContext";
import { fetchNullAddressTransactions, cn } from "./utils";
import { format } from "date-fns";

// --- TransactionTable ---
function TransactionTable({ records }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const sortedRecords = [...records].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedRecords = sortedRecords.slice(startIndex, endIndex);
  const formatDate = (timestamp) => timestamp ? new Date(timestamp).toLocaleString() : "N/A";
  const formatCategory = (category) => category.charAt(0).toUpperCase() + category.slice(1);
  const truncateHash = (hash) => hash ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : "N/A";
  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case "asset": return "bg-blue-100 text-blue-800";
      case "liability": return "bg-red-100 text-red-800";
      case "income": return "bg-green-100 text-green-800";
      case "expense": return "bg-amber-100 text-amber-800";
      case "equity": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  const handlePageChange = (page) => setCurrentPage(page);
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
      }
    }
    return pages;
  };
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center"><Database className="mr-2 h-5 w-5" />Transaction History</CardTitle>
            </div>
            <Badge variant="outline" className="ml-auto">{records.length} Records</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transaction records found. Try adjusting your filters or add some transactions.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Transaction Hash</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{formatDate(record.timestamp)}</TableCell>
                        <TableCell className="max-w-xs truncate">{record.description}</TableCell>
                        <TableCell>${parseFloat(record.amount).toFixed(2)}</TableCell>
                        <TableCell><Badge className={getCategoryColor(record.category)}>{formatCategory(record.category)}</Badge></TableCell>
                        <TableCell>{record.transactionHash ? (<a href={`https://sepolia.etherscan.io/tx/${record.transactionHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{truncateHash(record.transactionHash)}</a>) : ("Not confirmed")}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setSelectedRecord(record)}><Eye className="h-4 w-4 mr-1" />Details</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</div>
                  <div className="flex gap-1">
                    {generatePageNumbers().map((page) => (
                      <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" onClick={() => handlePageChange(page)}>{page}</Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      {selectedRecord && <TransactionDetails record={selectedRecord} isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} />}
    </>
  );
}

// --- TransactionDetails ---
function TransactionDetails({ record, isOpen, onClose }) {
  const formatDate = (timestamp) => timestamp ? new Date(timestamp).toLocaleString() : "N/A";
  const formatCategory = (category) => category.charAt(0).toUpperCase() + category.slice(1);
  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case "asset": return "bg-blue-100 text-blue-800";
      case "liability": return "bg-red-100 text-red-800";
      case "income": return "bg-green-100 text-green-800";
      case "expense": return "bg-amber-100 text-amber-800";
      case "equity": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>Complete information about this financial record</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><h4 className="text-sm font-medium mb-1">Description</h4><p className="text-sm">{record.description}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div><h4 className="text-sm font-medium mb-1">Amount</h4><p className="text-sm">${parseFloat(record.amount).toFixed(2)}</p></div>
            <div><h4 className="text-sm font-medium mb-1">Category</h4><Badge className={getCategoryColor(record.category)}>{formatCategory(record.category)}</Badge></div>
            <div><h4 className="text-sm font-medium mb-1">Date</h4><p className="text-sm">{record.date}</p></div>
            <div><h4 className="text-sm font-medium mb-1">Timestamp</h4><p className="text-sm">{formatDate(record.timestamp)}</p></div>
          </div>
          {record.notes && (<div><h4 className="text-sm font-medium mb-1">Notes</h4><p className="text-sm">{record.notes}</p></div>)}
          <div><h4 className="text-sm font-medium mb-1">Transaction Hash</h4>{record.transactionHash ? (<a href={`https://sepolia.etherscan.io/tx/${record.transactionHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm break-all hover:underline">{record.transactionHash}</a>) : (<p className="text-sm text-muted-foreground">Not confirmed</p>)}</div>
          <div><h4 className="text-sm font-medium mb-1">Hex Data</h4><div className="bg-slate-100 p-2 rounded-md"><p className="text-xs font-mono break-all overflow-x-auto">{record.hexData || "No hex data available"}</p></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- TransactionFilters ---
function TransactionFilters({ filters, setFilters }) {
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'equity', label: 'Equity' },
  ];
  const clearFilters = () => setFilters({ category: 'all', dateRange: { startDate: null, endDate: null }, searchTerm: '' });
  const hasActiveFilters = filters.category !== 'all' || filters.dateRange.startDate || filters.dateRange.endDate || filters.searchTerm;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2"><Label>Search</Label><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search description, notes..." value={filters.searchTerm} onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })} className="pl-9" /></div></div>
        <div className="space-y-2"><Label>Category</Label><Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map((category) => (<SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>))}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Start Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filters.dateRange.startDate && "text-muted-foreground") }><CalendarIcon className="mr-2 h-4 w-4" />{filters.dateRange.startDate ? format(filters.dateRange.startDate, "MMM dd, yyyy") : "Select date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={filters.dateRange.startDate || undefined} onSelect={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, startDate: date || null } })} initialFocus className="pointer-events-auto" /></PopoverContent></Popover></div>
        <div className="space-y-2"><Label>End Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filters.dateRange.endDate && "text-muted-foreground") }><CalendarIcon className="mr-2 h-4 w-4" />{filters.dateRange.endDate ? format(filters.dateRange.endDate, "MMM dd, yyyy") : "Select date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={filters.dateRange.endDate || undefined} onSelect={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, endDate: date || null } })} initialFocus className="pointer-events-auto" /></PopoverContent></Popover></div>
      </div>
      {hasActiveFilters && (<div className="flex justify-end"><Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-2 h-4 w-4" />Clear Filters</Button></div>)}
    </div>
  );
}

// --- TransactionHistory ---
function TransactionHistory() {
  const { records, account } = useBlockchain();
  const [nullTxs, setNullTxs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!account) return;
    setLoading(true);
    fetchNullAddressTransactions(account)
      .then(setNullTxs)
      .catch((e) => setError(e.message || "ADDED"))
      .finally(() => setLoading(false));
  }, [account]);
  // ...rest of TransactionHistory logic (omitted for brevity)
  return <div>Transaction History Table (see TransactionTable for details)</div>;
}

// Export all transaction components
export { TransactionTable, TransactionDetails, TransactionFilters, TransactionHistory };

// Default export for Transactions page (example usage)
export default function Transactions() {
  // You would compose the transactions page here using the above components
  const { records } = useBlockchain();
  return <TransactionTable records={records} />;
} 