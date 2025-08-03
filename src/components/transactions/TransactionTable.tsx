import React, { useEffect, useState } from "react";
import { getContract } from "@/utils/blockchain"; // Make sure this exists
import { getAllBlockchainRecords } from "@/utils/blockchain";
import { formatCurrency } from "@/config/currency";
import { formatUnits } from "ethers"; // top of file

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Database,
  Eye,
  AlertTriangle,
  CheckCircle,
  Edit,
} from "lucide-react";
import { FinancialRecord } from "@/types/financial";
import { useBlockchain } from "@/contexts/BlockchainContext";
import TransactionDetails from "./TransactionDetails";
import CorrectionForm from "@/components/CorrectionForm";

// Removed TransactionTableProps interface as records will be fetched internally
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Blockchain timestamp is in seconds
  return date.toLocaleString(); // Shows date and time in readable format
}

const TransactionTable: React.FC = () => {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);


useEffect(() => {
  const loadBlockchainData = async () => {
    try {
      const contract = await getContract();

      const count = await contract.getRecordCount();
      const logs = await contract.queryFilter("RecordAdded"); // 🔥 Gets all events

      const all: FinancialRecord[] = [];

      for (let i = 0; i < count; i++) {
        const r = await contract.getRecord(i);
        const timestamp = Number(r[3]);

        // 👇 Match event with this index
        const matchingLog = logs.find((log) => {
  return "args" in log && log.args.index.toString() === i.toString();
});


        all.push({
          id: i.toString(),
          description: r[0],
amount: (Number(r[1]) / 100).toFixed(2),

          category: r[2],
          timestamp,
          date: new Date(timestamp * 1000).toISOString(),
          transactionHash: matchingLog?.transactionHash || "", // ✅ Now you'll get real hash!
          recordType: "original",
        });
      }

      setRecords(all);
    } catch (err) {
      console.error("ADDED", err);
    } finally {
      setLoading(false);
    }
  };

  loadBlockchainData();
}, []);



  const { getNetEffectForRecord } = useBlockchain();
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(
    null
  );
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [recordToCorrect, setRecordToCorrect] =
    useState<FinancialRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Sort records by timestamp (newest first)
  const sortedRecords = [...records].sort((a, b) => {
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedRecords = sortedRecords.slice(startIndex, endIndex);

  const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return "N/A";
  return new Date(timestamp * 1000).toLocaleString();
};


  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const truncateHash = (hash: string | undefined) => {
    if (!hash) return "N/A";
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "asset":
        return "bg-blue-100 text-blue-800";
      case "liability":
        return "bg-red-100 text-red-800";
      case "income":
        return "bg-green-100 text-green-800";
      case "expense":
        return "bg-amber-100 text-amber-800";
      case "equity":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCorrectRecord = (record: FinancialRecord) => {
    setRecordToCorrect(record);
    setShowCorrectionForm(true);
  };

  const handleCorrectionComplete = () => {
    setShowCorrectionForm(false);
    setRecordToCorrect(null);
    // You might want to re-fetch the records here to see the updated data after a correction
    // or update the `records` state if the correction form returns the updated record.
    // For now, it just closes the form.
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

// Using the formatCurrency function from utils/format
// which uses the correct currency configuration


  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center items-center h-48">
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                View all financial records stored on the blockchain
              </CardDescription>
            </div>
            <Badge variant="outline" className="ml-auto">
              {records.length} Records
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transaction records found. Try adjusting your filters or add
              some transactions.
            </div>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction Hash</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((record) => {
                      const netEffect = getNetEffectForRecord(record.id || "");
                      const isCorrected = netEffect !== null;
                      const displayAmount = isCorrected
                        ? netEffect.netEffect.amount
                        : record.amount;
                      const displayDescription = isCorrected
                        ? netEffect.netEffect.description
                        : record.description;
                      const displayCategory = isCorrected
                        ? netEffect.netEffect.category
                        : record.category;
                      const canBeCorrected =
                        record.transactionHash && record.recordType !== "correction";

                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {formatDate(record.timestamp)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            <div className="flex items-center">
                              {displayDescription}
                              {isCorrected && (
                                <AlertTriangle className="ml-2 h-3 w-3 text-amber-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {formatCurrency(displayAmount)}
                              {isCorrected && (
                                <div className="ml-2 text-xs text-muted-foreground">
                                  {parseFloat(netEffect.netEffect.difference) >=
                                  0
                                    ? "+"
                                    : ""}
                                  {formatCurrency(netEffect.netEffect.difference)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(displayCategory)}>
                              {formatCategory(displayCategory)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isCorrected ? (
                              <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-200"
                              >
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Corrected
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-200"
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Original
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.transactionHash ? (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${record.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                {truncateHash(record.transactionHash)}
                              </a>
                            ) : (
                              "Not confirmed"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRecord(record)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              {canBeCorrected && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCorrectRecord(record)}
                                  className="text-amber-600 hover:text-amber-700"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Correct
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, sortedRecords.length)} of{" "}
                    {sortedRecords.length} records
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {generatePageNumbers().map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      {selectedRecord && (
        <TransactionDetails
          record={selectedRecord}
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* Correction Form Modal */}
      {showCorrectionForm && recordToCorrect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Correct Transaction</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCorrectionComplete}
                >
                  ×
                </Button>
              </div>
              <CorrectionForm
                onCorrectionComplete={handleCorrectionComplete}
                preselectedRecord={recordToCorrect}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionTable;