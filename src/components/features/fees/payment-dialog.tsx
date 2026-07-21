"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema, type PaymentInput } from "@/lib/validators";
import { recordPayment } from "@/actions/fees";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    full_name: string;
    monthly_fee: number;
    paid: number;
    balance: number;
  };
  month: string;
  onSuccess: () => void;
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function PaymentDialog({
  open,
  onOpenChange,
  student,
  month,
  onSuccess,
}: PaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [amountValue, setAmountValue] = useState(student.balance > 0 ? student.balance : student.monthly_fee);
  const [amountError, setAmountError] = useState("");

  const pendingAmount = Math.max(0, student.balance);
  const isFullyPaid = pendingAmount <= 0;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: isFullyPaid ? 0 : pendingAmount,
      payment_date: new Date().toISOString().split("T")[0],
      mode: undefined,
      receipt_number: "",
      notes: "",
    },
  });

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) {
      setAmountValue(0);
      setAmountError("");
      setValue("amount", 0, { shouldValidate: true });
      return;
    }
    if (val > pendingAmount) {
      setAmountValue(pendingAmount);
      setAmountError(`Cannot exceed ₹${pendingAmount.toLocaleString("en-IN")} (pending amount)`);
      setValue("amount", pendingAmount, { shouldValidate: true });
    } else {
      setAmountValue(val);
      setAmountError("");
      setValue("amount", val, { shouldValidate: true });
    }
  }

  async function onSubmit(data: PaymentInput) {
    setLoading(true);
    try {
      const result = await recordPayment(student.id, month, data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Payment recorded");
        reset();
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>

        <div className="bg-muted rounded-md p-3 space-y-1">
          <p className="text-sm font-medium">{student.full_name}</p>
          <p className="text-xs text-muted-foreground">{formatMonth(month)}</p>
          <Separator className="my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly fee</span>
            <span className="font-mono">₹{student.monthly_fee.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Already paid</span>
            <span className="font-mono text-success">₹{student.paid.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>Balance due</span>
            <span className={`font-mono ${pendingAmount > 0 ? "text-destructive" : "text-success"}`}>
              ₹{pendingAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {isFullyPaid ? (
          <div className="text-center py-4">
            <p className="text-sm text-success font-medium">Fees fully paid for this month.</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Amount (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={pendingAmount}
                  value={amountValue}
                  onChange={handleAmountChange}
                  className={amountError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {amountError && (
                  <p className="text-sm text-destructive">{amountError}</p>
                )}
                {errors.amount && !amountError && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Payment date <span className="text-destructive">*</span>
                </Label>
                <Input type="date" max={new Date().toISOString().split("T")[0]} {...register("payment_date")} />
                {errors.payment_date && (
                  <p className="text-sm text-destructive">{errors.payment_date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Payment mode <span className="text-destructive">*</span>
              </Label>
              <Select onValueChange={(v) => setValue("mode", v as "cash" | "upi" | "bank_transfer" | "cheque", { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
              {errors.mode && (
                <p className="text-sm text-destructive">{errors.mode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Receipt number</Label>
              <Input placeholder="Optional" {...register("receipt_number")} />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Optional" {...register("notes")} />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Recording..." : "Record payment"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
