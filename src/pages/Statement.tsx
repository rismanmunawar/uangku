import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { getTotalsForMonth } from "../utils/balance";
import type { Transaction } from "../types";

function buildSparkline(points: { day: string; value: number }[], width = 320, height = 120) {
  if (points.length === 0) return "";
  const maxAbs = Math.max(1, ...points.map((p) => Math.abs(p.value)));
  const step = width / Math.max(points.length - 1, 1);
  // for single point, duplicate to make a flat line visible
  const normalized = points.length === 1 ? [...points, { ...points[0], day: points[0].day + "_dup" }] : points;
  return normalized
    .map((p, idx) => {
      const x = idx * step;
      const y = height / 2 - (p.value / maxAbs) * (height / 2 - 12);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function StatementPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const monthIso = new Date().toISOString().slice(0, 7);
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.date.slice(0, 7)));
    if (set.size === 0) set.add(monthIso);
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [transactions, monthIso]);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthIso);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });
      setTransactions(data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const totals = useMemo(() => getTotalsForMonth(transactions, selectedMonth), [transactions, selectedMonth]);

  const { incomePoints, expensePoints, netPoints } = useMemo(() => {
    const dayIncome: Record<string, number> = {};
    const dayExpense: Record<string, number> = {};
    transactions
      .filter((t) => t.date.startsWith(selectedMonth))
      .forEach((t) => {
        const day = t.date.slice(8, 10);
        if (t.type === "income") {
          dayIncome[day] = (dayIncome[day] ?? 0) + t.amount;
        } else {
          dayExpense[day] = (dayExpense[day] ?? 0) + t.amount;
        }
      });
    const days = Array.from(new Set([...Object.keys(dayIncome), ...Object.keys(dayExpense)])).sort();
    const incomePts = days.map((d) => ({ day: d, value: dayIncome[d] ?? 0 }));
    const expensePts = days.map((d) => ({ day: d, value: -(dayExpense[d] ?? 0) }));
    const netPts = days.map((d) => ({ day: d, value: (dayIncome[d] ?? 0) - (dayExpense[d] ?? 0) }));
    return { incomePoints: incomePts, expensePoints: expensePts, netPoints: netPts };
  }, [transactions, selectedMonth]);

  const incomeLine = buildSparkline(incomePoints);
  const expenseLine = buildSparkline(expensePoints);
  const netLine = buildSparkline(netPoints);

  return (
    <div className="space-y-4 p-4 pb-24">
      <header className="flex items-center gap-3">
        <Link
          to="/settings/data"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
        >
          {"<"}
        </Link>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Me / Data
          </div>
          <div className="text-lg font-semibold text-slate-900">Uangku Statement</div>
        </div>
      </header>

      <div className="rounded-2xl bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Daily Net Graph</div>
            <div className="text-xs text-slate-500">Net movement in the selected month</div>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl bg-gradient-to-b from-sky-100 to-white p-3 ring-1 ring-sky-200/60">
          {netPoints.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">No data for this month.</div>
          ) : (
            <svg viewBox="0 0 320 120" className="h-28 w-full text-sky-500">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={incomeLine}
              />
              <polyline
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={expenseLine}
              />
              <polyline
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 4"
                points={netLine}
              />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-4 rounded-full bg-emerald-500"></span> Income
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-4 rounded-full bg-rose-500"></span> Expense
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-4 rounded-full bg-sky-500"></span> Net
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 p-3.5 shadow-sm ring-1 ring-emerald-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Income</div>
          <div className="mt-1 text-xl font-bold text-slate-900 leading-tight break-words">
            {totals.income.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="rounded-2xl bg-rose-50 p-3.5 shadow-sm ring-1 ring-rose-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-rose-700">Expense</div>
          <div className="mt-1 text-xl font-bold text-slate-900 leading-tight break-words">
            {totals.expense.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="col-span-2 rounded-2xl bg-sky-50 p-3.5 shadow-sm ring-1 ring-sky-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">Net</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 leading-tight break-words">
            {totals.net.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm space-y-2">
        <div className="text-sm font-semibold text-slate-900">Export Statement</div>
        <div className="text-xs text-slate-500">Download the selected month's summary to CSV.</div>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            const filtered = transactions.filter((t) => t.date.startsWith(selectedMonth));
            const csv = ["id,date,amount,type,account_id,category,note"]
              .concat(
                filtered.map((t) =>
                  [t.id, t.date, t.amount, t.type, t.account_id, t.category, t.note ?? ""]
                    .map((v) => `"${String(v).replace(/\"/g, '""')}"`)
                    .join(",")
                )
              )
              .join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `statement-${selectedMonth}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
        >
          {loading ? "Preparing..." : "Export CSV for this Month"}
        </button>
      </div>
    </div>
  );
}

