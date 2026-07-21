"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { FeeTable } from "@/components/features/fees/fee-table";
import { PaymentDialog } from "@/components/features/fees/payment-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getFeeData } from "@/actions/fees";
import { IndianRupee, CheckCircle, AlertCircle, Search, X, ArrowUpDown } from "lucide-react";

interface FeeRow {
  id: string;
  full_name: string;
  class_number: number;
  board: string;
  monthly_fee: number;
  paid: number;
  balance: number;
  status: "paid" | "partial" | "unpaid";
}

function getMonthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function FeesPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(getMonthString(now));
  const [data, setData] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<FeeRow | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return getMonthString(d);
  });

  const loadFees = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFeeData(selectedMonth);
      setData(result);
    } catch {
      console.error("Failed to load fee data");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  let filtered = data;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((s) => s.full_name.toLowerCase().includes(q));
  }
  if (statusFilter !== "all") {
    filtered = filtered.filter((s) => s.status === statusFilter);
  }

  const [sortKey, sortDir] = sortBy.split("-") as [string, "asc" | "desc"];
  filtered = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.full_name.localeCompare(b.full_name);
    else if (sortKey === "balance") cmp = a.balance - b.balance;
    else if (sortKey === "status") {
      const order = { unpaid: 0, partial: 1, paid: 2 };
      cmp = order[a.status] - order[b.status];
    } else if (sortKey === "class") cmp = a.class_number - b.class_number;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalExpected = data.reduce((sum, s) => sum + s.monthly_fee, 0);
  const totalCollected = data.reduce((sum, s) => sum + s.paid, 0);
  const paidCount = data.filter((s) => s.status === "paid").length;
  const partialCount = data.filter((s) => s.status === "partial").length;
  const unpaidCount = data.filter((s) => s.status === "unpaid").length;
  const collectionPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const hasFilters = search || statusFilter !== "all" || sortBy !== "name-asc";

  return (
    <>
      <AppHeader
        title="Fees"
        subtitle={formatMonth(selectedMonth)}
        actions={
          <Select value={selectedMonth} onValueChange={(v) => v && setSelectedMonth(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {formatMonth(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expected</p>
                <p className="text-2xl font-bold font-mono">₹{totalExpected.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-2 rounded-md bg-primary/10 text-primary"><IndianRupee className="h-4 w-4" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collected</p>
                <p className="text-2xl font-bold font-mono text-success">₹{totalCollected.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-2 rounded-md bg-success/10 text-success"><CheckCircle className="h-4 w-4" /></div>
            </div>
            <Progress value={collectionPct} className="mt-2 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{collectionPct}% collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid</p>
                <p className="text-2xl font-bold font-mono">{paidCount}</p>
              </div>
              <div className="p-2 rounded-md bg-success/10 text-success"><CheckCircle className="h-4 w-4" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unpaid</p>
                <p className="text-2xl font-bold font-mono text-destructive">{unpaidCount + partialCount}</p>
              </div>
              <div className="p-2 rounded-md bg-destructive/10 text-destructive"><AlertCircle className="h-4 w-4" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name A→Z</SelectItem>
              <SelectItem value="name-desc">Name Z→A</SelectItem>
              <SelectItem value="balance-desc">Balance high→low</SelectItem>
              <SelectItem value="balance-asc">Balance low→high</SelectItem>
              <SelectItem value="status-asc">Unpaid first</SelectItem>
              <SelectItem value="status-desc">Paid first</SelectItem>
              <SelectItem value="class-asc">Class low→high</SelectItem>
              <SelectItem value="class-desc">Class high→low</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setSortBy("name-asc"); }} className="gap-1">
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      <FeeTable
        data={filtered}
        loading={loading}
        onRecordPayment={(student) => {
          setSelectedStudent(student);
          setPaymentOpen(true);
        }}
      />

      {selectedStudent && (
        <PaymentDialog
          open={paymentOpen}
          onOpenChange={(open) => {
            setPaymentOpen(open);
            if (!open) setSelectedStudent(null);
          }}
          student={selectedStudent}
          month={selectedMonth}
          onSuccess={() => {
            setPaymentOpen(false);
            setSelectedStudent(null);
            loadFees();
          }}
        />
      )}
    </>
  );
}
