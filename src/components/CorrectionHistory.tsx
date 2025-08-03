import React, { useState, useMemo } from "react";
import { FinancialRecord, CorrectionRecord } from "@/types/financial";
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
import { AlertTriangle, Eye, ChevronRight, AlertCircle } from "lucide-react";
import { useBlockchain } from "@/contexts/BlockchainContext";
import { formatCurrency } from "@/config/currency";

interface CorrectionHistoryProps {
  onViewCorrection?: (correction: CorrectionRecord) => void;
}

const CorrectionHistory: React.FC<CorrectionHistoryProps> = ({ onViewCorrection }) => {
  const { records } = useBlockchain();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCorrection, setSelectedCorrection] = useState<CorrectionRecord | null>(null);
  const recordsPerPage = 10;

  // Filter correction records and their original records
  const correctionData = useMemo(() => {
    const corrections = records.filter(record => record.recordType === 'correction') as CorrectionRecord[];
    
    return corrections.map(correction => {
      const originalRecord = records.find(record => 
        record.id === correction.correctionData?.originalRecordId
      );
      
      return {
        correction,
        originalRecord,
        netEffect: correction.netEffect
      };
    }).sort((a, b) => (b.correction.timestamp || 0) - (a.correction.timestamp || 0));
  }, [records]);

  // Pagination
  const totalPages = Math.ceil(correctionData.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedCorrections = correctionData.slice(startIndex, endIndex);

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  // Using the centralized formatCurrency function from @/config/currency


  const truncateHash = (hash: string | undefined) => {
    if (!hash) return "N/A";
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const getCorrectionTypeColor = (type: string) => {
    switch (type) {
      case 'amount':
        return "bg-red-100 text-red-800";
      case 'category':
        return "bg-blue-100 text-blue-800";
      case 'description':
        return "bg-green-100 text-green-800";
      case 'date':
        return "bg-purple-100 text-purple-800";
      case 'multiple':
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewCorrection = (correction: CorrectionRecord) => {
    setSelectedCorrection(correction);
    if (onViewCorrection) {
      onViewCorrection(correction);
    }
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

  if (correctionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Correction History
          </CardTitle>
          <CardDescription>
            View all corrections made to financial records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
            <p>No corrections found.</p>
            <p className="text-sm">Corrections will appear here once you create them.</p>
          </div>
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
                <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                Correction History
              </CardTitle>
              <CardDescription>
                View all corrections made to financial records
              </CardDescription>
            </div>
            <Badge variant="outline" className="ml-auto">
              {correctionData.length} Corrections
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Original Record</TableHead>
                  <TableHead>Correction Type</TableHead>
                  <TableHead>Net Effect</TableHead>
                  <TableHead>Transaction Hash</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCorrections.map(({ correction, originalRecord, netEffect }) => (
                  <TableRow key={correction.id}>
                    <TableCell className="font-medium">
                      {formatDate(correction.timestamp)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">
                        <div className="font-medium">{originalRecord?.description || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(originalRecord?.amount || '0')} ({originalRecord?.category})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCorrectionTypeColor(correction.correctionData.correctionType)}>
                        {correction.correctionData.correctionType.charAt(0).toUpperCase() + 
                         correction.correctionData.correctionType.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {netEffect ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatCurrency(netEffect.correctedAmount)}
                          </div>
                          <div className={`text-xs ${
                            parseFloat(netEffect.difference) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {parseFloat(netEffect.difference) >= 0 ? '+' : ''}
                            {formatCurrency(netEffect.difference)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {correction.transactionHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${correction.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {truncateHash(correction.transactionHash)}
                        </a>
                      ) : (
                        "Not confirmed"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewCorrection(correction)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, correctionData.length)} of {correctionData.length} corrections
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Correction Details Modal */}
      {selectedCorrection && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
              Correction Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Record */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">ORIGINAL RECORD</h4>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <div><span className="font-medium">Description:</span> {selectedCorrection.correctionData.originalRecordId}</div>
                    <div><span className="font-medium">Amount:</span> {formatCurrency(selectedCorrection.netEffect?.originalAmount || '0')}</div>
                    <div><span className="font-medium">Category:</span> {selectedCorrection.category}</div>
                    <div><span className="font-medium">Date:</span> {selectedCorrection.date}</div>
                    {selectedCorrection.notes && (
                      <div><span className="font-medium">Notes:</span> {selectedCorrection.notes}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Corrected Record */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">CORRECTED RECORD</h4>
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="space-y-2">
                    <div><span className="font-medium">Description:</span> {selectedCorrection.description}</div>
                    <div><span className="font-medium">Amount:</span> {formatCurrency(selectedCorrection.amount)}</div>
                    <div><span className="font-medium">Category:</span> {selectedCorrection.category}</div>
                    <div><span className="font-medium">Date:</span> {selectedCorrection.date}</div>
                    {selectedCorrection.notes && (
                      <div><span className="font-medium">Notes:</span> {selectedCorrection.notes}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Correction Metadata */}
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">CORRECTION METADATA</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Reason:</span>
                  <p className="text-sm mt-1">{selectedCorrection.correctionData.correctionReason}</p>
                </div>
                <div>
                  <span className="font-medium">Type:</span>
                  <Badge className={`ml-2 ${getCorrectionTypeColor(selectedCorrection.correctionData.correctionType)}`}>
                    {selectedCorrection.correctionData.correctionType}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Corrected Fields:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCorrection.correctionData.correctedFields.map((field, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Transaction:</span>
                  <p className="text-sm mt-1">
                    {selectedCorrection.transactionHash ? (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${selectedCorrection.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {truncateHash(selectedCorrection.transactionHash)}
                      </a>
                    ) : (
                      "Not confirmed"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCorrection(null)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default CorrectionHistory;