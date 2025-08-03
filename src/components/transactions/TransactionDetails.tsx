
import React from "react";
import { formatCurrency } from "@/config/currency";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FinancialRecord } from "@/types/financial";

interface TransactionDetailsProps {
  record: FinancialRecord;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              <p className="text-sm">{formatCurrency(record.amount)}</p>
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
  );
};

export default TransactionDetails;
