import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./UIComponents";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { convertRecordToHex, sendTransaction } from "./utils";
import { useBlockchain } from "./BlockchainContext";
import { toast } from "sonner";
import { AlertCircle, ArrowRight, Check, Loader2 } from "lucide-react";

// Zod schema for form validation
const formSchema = z.object({
  description: z.string().min(2, { message: "Description must be at least 2 characters." }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: "Amount must be a valid positive number" }),
  category: z.string().min(1, { message: "Please select a category" }),
  date: z.string().min(1, { message: "Please select a date" }),
  notes: z.string().optional(),
});

/**
 * FinancialRecordForm component for submitting financial records to the blockchain
 */
function FinancialRecordForm() {
  const { connected, addRecord } = useBlockchain();
  const [txStatus, setTxStatus] = useState({ pending: false, success: false, error: null, hash: null });
  const [hexData, setHexData] = useState("");
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });
  const onSubmit = async (values) => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }
    try {
      setTxStatus({ pending: true, success: false, error: null, hash: null });
      const record = {
        description: values.description,
        amount: values.amount,
        category: values.category,
        date: values.date,
        notes: values.notes || "",
      };
      const hex = convertRecordToHex(record);
      setHexData(hex);
      record.hexData = hex;
      const txHash = await sendTransaction({ ...record, amount: "0.0001" });
      if (txHash) {
        setTxStatus({ pending: false, success: true, error: null, hash: txHash });
        record.transactionHash = txHash;
        record.timestamp = Date.now();
        addRecord(record);
        form.reset();
        toast.success("Transaction confirmed!");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      setTxStatus({ pending: false, success: false, error: error.message || "Transaction failed", hash: null });
      toast.error(error.message || "Transaction failed");
    }
  };
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Record Financial Data</CardTitle>
        <CardDescription>Enter financial record details to store on the blockchain</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="financial-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input placeholder="Enter description" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl><Input placeholder="0.00" type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="liability">Liability</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea placeholder="Optional notes..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={txStatus.pending} className="w-full">
              {txStatus.pending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>) : (<><ArrowRight className="mr-2 h-4 w-4" />Submit</>)}
            </Button>
            {txStatus.error && (<div className="flex items-center text-red-600 text-sm mt-2"><AlertCircle className="mr-2 h-4 w-4" />{txStatus.error}</div>)}
            {txStatus.success && (<div className="flex items-center text-green-600 text-sm mt-2"><Check className="mr-2 h-4 w-4" />Transaction successful!</div>)}
            {txStatus.hash && (<div className="text-xs mt-2">Transaction Hash: <a href={`https://sepolia.etherscan.io/tx/${txStatus.hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{txStatus.hash}</a></div>)}
            {hexData && (<div className="text-xs mt-2">Hex Data: <span className="font-mono break-all">{hexData}</span></div>)}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default FinancialRecordForm; 