import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Account, Transaction, Transfer } from "../types";
import { AccountCard } from "../components/AccountCard";
import { TransactionItem } from "../components/TransactionItem";
import { calculateAccountBalance, getTotalsForMonth } from "../utils/balance";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const [{ data: acc }, { data: tx }, { data: tr }] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(50),
        supabase
          .from("transfers")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(50),
      ]);
      setAccounts(acc ?? []);
      setTransactions(tx ?? []);
      setTransfers(tr ?? []);
      setLoading(false);
    };

    load();
  }, [user]);

  const balances = useMemo(
    () =>
      accounts.map((account) => ({
        account,
        balance: calculateAccountBalance({ account, transactions, transfers }),
      })),
    [accounts, transactions, transfers]
  );

  const totalBalance = balances.reduce((sum, entry) => sum + entry.balance, 0);
  const spendableTotal = balances
    .filter(({ account }) => account.role !== "savings")
    .reduce((sum, entry) => sum + entry.balance, 0);
  const savingsTotal = balances
    .filter(({ account }) => account.role === "savings")
    .reduce((sum, entry) => sum + entry.balance, 0);

  const monthIso = new Date().toISOString().slice(0, 7);
  const totals = getTotalsForMonth(transactions, monthIso);
  const [chartMonth, setChartMonth] = useState(monthIso);

  // derive month options from data
  const chartMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.date.slice(0, 7)));
    if (set.size === 0) set.add(monthIso);
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [transactions, monthIso]);

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    transactions
      .filter((t) => t.date.startsWith(chartMonth))
      .forEach((t) => {
        const day = t.date.slice(8, 10);
        const delta = t.type === "income" ? t.amount : -t.amount;
        days[day] = (days[day] ?? 0) + delta;
      });
    const entries = Object.entries(days).sort((a, b) => Number(a[0]) - Number(b[0]));
    const maxAbs = Math.max(1, ...entries.map(([, v]) => Math.abs(v)));
    return entries.map(([day, val]) => ({
      day,
      val,
      height: Math.min(100, Math.round((Math.abs(val) / maxAbs) * 100)),
      positive: val >= 0,
    }));
  }, [transactions, chartMonth]);
  const accountNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach((a) => {
      map[a.id] = a.name;
    });
    return map;
  }, [accounts]);

  const basePadding = "space-y-6 p-4 pb-12";

  if (loading) {
    return (
      <div className={`${basePadding}`}>
        <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={basePadding}>
      <header className="rounded-3xl bg-gradient-to-br from-primary to-primaryDark p-5 text-white shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/80">
              Total Balance
            </div>
            <div className="mt-1 text-3xl font-bold">
              {totalBalance.toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
          <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            {new Date().toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
        <p className="mt-3 text-sm text-white/80">
          Track income, expense, dan transfer di semua akun.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl bg-white/15 p-3">
            <div className="text-white/80">Income</div>
            <div className="text-lg font-semibold">
              {totals.income.toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3">
            <div className="text-white/80">Expense</div>
            <div className="text-lg font-semibold">
              {totals.expense.toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3">
            <div className="text-white/80">Net</div>
            <div className="text-lg font-semibold">
              {totals.net.toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/15 p-3">
            <div className="text-white/80">Spendable</div>
            <div className="text-lg font-semibold">
              {spendableTotal.toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3">
            <div className="text-white/80">Savings</div>
            <div className="text-lg font-semibold">
              {savingsTotal.toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Accounts</h2>
          <span className="text-xs text-slate-500">Swipe</span>
        </div>
        <div className="grid grid-cols-2 gap-3 pb-2">
          {balances.map(({ account, balance }) => (
            <AccountCard key={account.id} account={account} balance={balance} />
          ))}
          {balances.length === 0 && (
            <div className="text-sm text-slate-500">No accounts yet. Add one in Settings.</div>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-slate-900">Monthly Net Flow</div>
            <div className="text-xs text-slate-500">Net income/expense by day</div>
          </div>
          <select
            value={chartMonth}
            onChange={(e) => setChartMonth(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {chartMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2 overflow-x-auto">
          {chartData.length === 0 && (
            <div className="text-sm text-slate-500">No data this month.</div>
          )}
          {chartData.map((bar) => (
            <div key={bar.day} className="flex flex-col items-center text-[10px]">
              <div
                className={`w-6 rounded-t-md ${bar.positive ? "bg-emerald-400" : "bg-rose-400"}`}
                style={{ height: `${Math.max(bar.height, 6)}px` }}
                title={`${bar.day}: ${bar.val}`}
              ></div>
              <span className="mt-1 text-slate-600">{bar.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-slate-900">Activity</div>
            <div className="text-xs text-slate-500">View full history and filters</div>
          </div>
          <Link
            to="/transactions"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft"
          >
            Open
          </Link>
        </div>
      </section>
    </div>
  );
}
