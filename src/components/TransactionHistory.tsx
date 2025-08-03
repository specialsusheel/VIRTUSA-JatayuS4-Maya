import React, { useEffect, useState } from "react";
import { useBlockchain } from "@/contexts/BlockchainContext";

import { fetchNullAddressTransactions } from "@/utils/blockchain";
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
import { Badge } from "@/components/ui/badge";
import { Database, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/config/currency";

const TransactionHistory: React.FC = () => {
 const [records, setRecords] = useState([]);

  const [nullTxs, setNullTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  fetch("http://localhost:3001/api/transactions")
    .then((res) => res.json())
    .then((data) => setRecords(data))
    .catch((err) => console.error("Failed to load transactions:", err));
}, []);


  // Sort records by timestamp (newest first)
  const sortedRecords = [...records].sort((a, b) => {
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const truncateHash = (hash: string | undefined) => {
    if (!hash) return "N/A";
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const truncateHex = (hex: string | undefined) => {
    if (!hex) return "N/A";
    return `${hex.slice(0, 20)}...${hex.slice(-20)}`;
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

  return (
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
            No transaction records found. Start by submitting a financial record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Timee</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Transaction Hash</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {formatDate(record.timestamp)}
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(record.amount))}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(record.category)}>
                        {formatCategory(record.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.transactionHash ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${record.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                {truncateHash(record.transactionHash)}
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View on Etherscan</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        "Not confirmed"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Transaction Details</DialogTitle>
                            <DialogDescription>
                              Complete information about this financial record
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-1">Description</h4>
                              <p className="text-sm">{record.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium mb-1">Amount</h4>
                                <p className="text-sm">{formatCurrency(parseFloat(record.amount))}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-1">Category</h4>
                                <Badge className={getCategoryColor(record.category)}>
                                  {formatCategory(record.category)}
                                </Badge>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-1">Date</h4>
                                <p className="text-sm">{record.date}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-1">Timestamp</h4>
                                <p className="text-sm">{formatDate(record.timestamp)}</p>
                              </div>
                            </div>
                            {record.notes && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">Notes</h4>
                                <p className="text-sm">{record.notes}</p>
                              </div>
                            )}
                            <div>
                              <h4 className="text-sm font-medium mb-1">Transaction Hash</h4>
                              {record.transactionHash ? (
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${record.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 text-sm break-all hover:underline"
                                >
                                  {record.transactionHash}
                                </a>
                              ) : (
                                <p className="text-sm text-muted-foreground">Not confirmed</p>
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1">Hex Data</h4>
                              <div className="bg-slate-100 p-2 rounded-md">
                                <p className="text-xs font-mono break-all overflow-x-auto">
                                  {record.hexData || "No hex data available"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {loading && <div>Loading on-chain transactions...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {nullTxs.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-xs border">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Txn Hash</th>
                  <th className="border px-2 py-1">Block</th>
                  <th className="border px-2 py-1">Date</th>
                  <th className="border px-2 py-1">Decoded Data</th>
                  <th className="border px-2 py-1">Etherscan</th>
                </tr>
              </thead>
              <tbody>
                {nullTxs.map((tx) => (
                  <tr key={tx.hash}>
                    <td className="border px-2 py-1">{tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}</td>
                    <td className="border px-2 py-1">{tx.blockNumber}</td>
                    <td className="border px-2 py-1">{new Date(Number(tx.timeStamp) * 1000).toLocaleString()}</td>
                    <td className="border px-2 py-1 text-left">
                      <pre className="whitespace-pre-wrap break-all">{tx.decoded ? JSON.stringify(tx.decoded, null, 2) : "(unreadable)"}</pre>
                    </td>
                    <td className="border px-2 py-1">
                      <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
