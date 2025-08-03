
import React, { useState, useMemo } from "react";
import { useBlockchain } from "@/contexts/BlockchainContext";
import FinancialRecordForm from "@/components/FinancialRecordForm";
import TransactionTable from "@/components/transactions/TransactionTable";
import TransactionFilters from "@/components/transactions/TransactionFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialRecord } from "@/types/financial";

const Transactions = () => {
  const { records } = useBlockchain();
  const [filters, setFilters] = useState<{
    category: string;
    dateRange: {
      startDate: Date | null;
      endDate: Date | null;
    };
    searchTerm: string;
  }>({
    category: 'all',
    dateRange: {
      startDate: null,
      endDate: null,
    },
    searchTerm: '',
  });

  // Filter records based on filters
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Category filter
      if (filters.category !== 'all' && record.category.toLowerCase() !== filters.category) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.startDate && filters.dateRange.endDate) {
        const recordDate = new Date(record.date);
        if (recordDate < filters.dateRange.startDate || recordDate > filters.dateRange.endDate) {
          return false;
        }
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          record.description.toLowerCase().includes(searchLower) ||
          record.notes?.toLowerCase().includes(searchLower) ||
          record.amount.includes(filters.searchTerm)
        );
      }

      return true;
    });
  }, [records, filters]);

  return (
    <div>
      <div className="container mx-auto">
        
        <div className="space-y-6">
          {/* Financial Record Form */}
          <FinancialRecordForm />

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionFilters filters={filters} setFilters={setFilters} />
            </CardContent>
          </Card>

          {/* Transaction Table */}
          <TransactionTable records={filteredRecords} />
        </div>
      </div>
    </div>
  );
};

export default Transactions;
