import React, { useState, useEffect } from "react";
import { FinancialRecord, CorrectionFormData, CorrectionRecord } from "@/types/financial";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/config/currency";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { sendCorrectionTransaction, validateCorrection, calculateNetEffect } from "@/utils/blockchain";
import { useBlockchain } from "@/contexts/BlockchainContext";
import { toast } from "sonner";
import { AlertTriangle, Check, Loader2, AlertCircle, Info, Edit3 } from "lucide-react";

const correctionFormSchema = z.object({
  correctionReason: z.string().min(10, {
    message: "Correction reason must be at least 10 characters",
  }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a valid positive number",
  }),
  category: z.string().min(1, {
    message: "Please select a category",
  }),
  date: z.string().min(1, {
    message: "Please select a date",
  }),
  notes: z.string().optional(),
});

interface CorrectionFormProps {
  onCorrectionComplete?: () => void;
  preselectedRecord?: FinancialRecord;
}

const CorrectionForm: React.FC<CorrectionFormProps> = ({ onCorrectionComplete, preselectedRecord }) => {
  const { connected, account, addRecord } = useBlockchain();
  const [correctionStatus, setCorrectionStatus] = useState<{
    pending: boolean;
    success: boolean;
    error: string | null;
    hash: string | null;
  }>({
    pending: false,
    success: false,
    error: null,
    hash: null,
  });
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({
    isValid: false,
    errors: [],
    warnings: [],
  });

  const form = useForm<z.infer<typeof correctionFormSchema>>({
    resolver: zodResolver(correctionFormSchema),
    defaultValues: {
      correctionReason: "",
      description: preselectedRecord?.description || "",
      amount: preselectedRecord?.amount || "",
      category: preselectedRecord?.category || "",
      date: preselectedRecord?.date || "",
      notes: preselectedRecord?.notes || "",
    },
  });

  // Validate correction when form data changes
  useEffect(() => {
    if (preselectedRecord) {
      const formData = form.getValues();
      const correctionData: CorrectionFormData = {
        originalRecordId: preselectedRecord.id || "",
        originalTransactionHash: preselectedRecord.transactionHash || "",
        correctionReason: formData.correctionReason,
        correctionType: 'multiple', // Since we're editing all fields
        correctedData: {
          description: formData.description,
          amount: formData.amount,
          category: formData.category,
          date: formData.date,
          notes: formData.notes,
        },
      };

      const validation = validateCorrection(preselectedRecord, correctionData);
      setValidationResult(validation);
    }
  }, [preselectedRecord, form.watch()]);

  const onSubmit = async (values: z.infer<typeof correctionFormSchema>) => {
    console.log("🚀 Correction form submitted with values:", values);
    
    if (!connected) {
      console.log("❌ Wallet not connected");
      toast.error("Please connect your wallet first");
      return;
    }

    if (!preselectedRecord) {
      console.log("❌ No record selected for correction");
      toast.error("No record selected for correction");
      return;
    }

    if (!validationResult.isValid) {
      console.log("❌ Validation failed:", validationResult.errors);
      toast.error("Please fix validation errors before submitting");
      return;
    }

    try {
      console.log("🔄 Starting correction submission...");
      setCorrectionStatus({ pending: true, success: false, error: null, hash: null });

      // Determine which fields have changed
      const changedFields: string[] = [];
      if (values.description !== preselectedRecord.description) changedFields.push('description');
      if (values.amount !== preselectedRecord.amount) changedFields.push('amount');
      if (values.category !== preselectedRecord.category) changedFields.push('category');
      if (values.date !== preselectedRecord.date) changedFields.push('date');
      if (values.notes !== (preselectedRecord.notes || "")) changedFields.push('notes');

      console.log("📊 Changed fields:", changedFields);

      if (changedFields.length === 0) {
        throw new Error("No changes detected. Please modify at least one field.");
      }

      // Create correction record
      const correctionRecord: CorrectionRecord = {
        id: Date.now().toString(),
        description: values.description,
        amount: values.amount,
        category: values.category,
        date: values.date,
        notes: values.notes || "",
        recordType: 'correction',
        correctionData: {
          originalTransactionHash: preselectedRecord.transactionHash || "",
          originalRecordId: preselectedRecord.id || "",
          correctionReason: values.correctionReason,
          correctionType: changedFields.length > 1 ? 'multiple' : (changedFields[0] as any),
          correctedFields: changedFields,
        },
      };

      console.log("📝 Created correction record:", correctionRecord);

      // Calculate and add net effect
      correctionRecord.netEffect = calculateNetEffect(preselectedRecord, correctionRecord);
      console.log("💰 Net effect calculated:", correctionRecord.netEffect);

      // Send correction transaction
      console.log("🌐 Sending correction transaction to blockchain...");
      const txHash = await sendCorrectionTransaction(correctionRecord);
      
      console.log("✅ Transaction hash received:", txHash);
      
      if (txHash) {
        // Update correction record with transaction hash
        correctionRecord.transactionHash = txHash;
        correctionRecord.timestamp = Date.now();

        console.log("💾 Adding correction record to context...");
        // Add to context
        addRecord(correctionRecord);

        setCorrectionStatus({
          pending: false,
          success: true,
          error: null,
          hash: txHash,
        });

        toast.success("Correction submitted successfully!");
        form.reset();
        
        if (onCorrectionComplete) {
          console.log("🔄 Calling onCorrectionComplete callback...");
          onCorrectionComplete();
        }
      } else {
        throw new Error("Correction transaction failed - no hash returned");
      }
    } catch (error: any) {
      console.error("💥 Correction error:", error);
      setCorrectionStatus({
        pending: false,
        success: false,
        error: error.message || "Correction failed",
        hash: null,
      });
      toast.error(error.message || "Correction failed");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Using the centralized formatCurrency function from @/config/currency

  if (!preselectedRecord) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No record selected for correction
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Edit3 className="mr-2 h-5 w-5 text-amber-500" />
          Edit Transaction
        </CardTitle>
        <CardDescription>
          Modify the transaction data below. All changes will be recorded as corrections on the blockchain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Original Record Info */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center">
            <Info className="mr-2 h-4 w-4" />
            Original Transaction
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Transaction Hash:</span> {preselectedRecord.transactionHash?.slice(0, 8)}...{preselectedRecord.transactionHash?.slice(-6)}</div>
            <div><span className="font-medium">Date:</span> {formatDate(preselectedRecord.date)}</div>
            <div><span className="font-medium">Original Amount:</span> {formatCurrency(preselectedRecord.amount)}</div>
            <div><span className="font-medium">Original Category:</span> {preselectedRecord.category}</div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Correction Reason */}
            <FormField
              control={form.control}
              name="correctionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correction Reason *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain why this correction is needed (minimum 10 characters)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear explanation for the correction. This will be stored on the blockchain.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Editable Fields */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Edit3 className="mr-2 h-4 w-4" />
                Transaction Data
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
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
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional information"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Validation Messages */}
            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationResult.warnings.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Transaction Status */}
            {correctionStatus.pending && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Submitting correction to blockchain... Please approve in MetaMask
                </AlertDescription>
              </Alert>
            )}

            {correctionStatus.success && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Correction submitted successfully! Transaction: {correctionStatus.hash}
                </AlertDescription>
              </Alert>
            )}

            {correctionStatus.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {correctionStatus.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={correctionStatus.pending || !validationResult.isValid || !connected}
              className="w-full"
            >
              {correctionStatus.pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Correction...
                </>
              ) : (
                <>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Submit Correction
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CorrectionForm;