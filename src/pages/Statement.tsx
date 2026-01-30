import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { getTotalsForMonth } from "../utils/balance";
import type { Transaction } from "../types";

function buildSparkline(points: { day: string; net: number }[], width = 320, height = 120) {
  if (points.length === 0) return "";
  const maxAbs = Math.max(1, ...points.map((p) => Math.abs(p.net)));
  const step = width / Math.max(points.length - 1, 1);
  return points
    .map((p, idx) => {
      const x = idx * step;
      const y = height / 2 - (p.net / maxAbs) * (height / 2 - 10);
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

  const sparkPoints = useMemo(() => {
    const dayMap: Record<string, number> = {};
    transactions
      .filter((t) => t.date.startsWith(selectedMonth))
      .forEach((t) => {
        const day = t.date.slice(8, 10);
        dayMap[day] = (dayMap[day] ?? 0) + (t.type === "income" ? t.amount : -t.amount);
      });
    return Object.keys(dayMap)
      .sort()
      .map((day) => ({ day, net: dayMap[day] }));
  }, [transactions, selectedMonth]);

  const polyline = buildSparkline(sparkPoints);

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
            <div className="text-sm font-semibold text-slate-900">Grafik Net Harian</div>
            <div className="text-xs text-slate-500">Pergerakan net dalam bulan terpilih</div>
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
          {sparkPoints.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">Belum ada data bulan ini.</div>
          ) : (
            <svg viewBox="0 0 320 120" className="h-28 w-full text-sky-500">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polyline}
              />
            </svg>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Income</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {totals.income.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-rose-600">Expense</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {totals.expense.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Net</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">
            {totals.net.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm space-y-2">
        <div className="text-sm font-semibold text-slate-900">Export Statement</div>
        <div className="text-xs text-slate-500">Unduh ringkasan transaksi bulan terpilih ke CSV.</div>
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
          {loading ? "Menyiapkan..." : "Export CSV Bulan Ini"}
        </button>
      </div>
    </div>
  );
}
