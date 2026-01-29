import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Account, Transaction, Transfer } from "../types";
import { TransactionItem } from "../components/TransactionItem";
import { useAuth } from "../context/AuthContext";

const monthKey = (date: string) => date.slice(0, 7); // YYYY-MM from ISO

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [monthOptions, setMonthOptions] = useState<string[]>([]);
  const [month, setMonth] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const [{ data: acc }, { data: tx }, { data: tr }] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false }),
        supabase
          .from("transfers")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false }),
      ]);
      setAccounts(acc ?? []);
      setTransactions(tx ?? []);
      setTransfers(tr ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  // Derive available months from data so it follows real history
  useEffect(() => {
    const allMonths = new Set<string>();
    transactions.forEach((t) => allMonths.add(monthKey(t.date)));
    transfers.forEach((t) => allMonths.add(monthKey(t.date)));
    const list = Array.from(allMonths).sort((a, b) => (a < b ? 1 : -1));
    if (list.length === 0) {
      const now = new Date();
      const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      list.push(current);
    }
    setMonthOptions(list);
    if (!month || !list.includes(month)) {
      setMonth(list[0]);
    }
  }, [transactions, transfers, month]);

  type Combined =
    | { kind: "transaction"; item: Transaction }
    | { kind: "transferOut" | "transferIn"; item: Transfer };

  const combinedList = useMemo<Combined[]>(() => {
    const txItems: Combined[] = transactions.map((t) => ({
      kind: "transaction",
      item: t,
    }));
    const transferItems: Combined[] = transfers.flatMap((t) => [
      { kind: "transferOut", item: t },
      { kind: "transferIn", item: t },
    ]);
    return [...txItems, ...transferItems];
  }, [transactions, transfers]);

  const filtered = useMemo(() => {
    return combinedList
      .filter((entry) => {
        const date =
          entry.kind === "transaction"
            ? entry.item.date
            : entry.item.date;
        const monthMatch = date.startsWith(month);
        if (!monthMatch) return false;
        if (accountId === "all") return true;
        if (entry.kind === "transaction") {
          return entry.item.account_id === accountId;
        }
        // transfer
        return (
          entry.item.from_account_id === accountId ||
          entry.item.to_account_id === accountId
        );
      })
      .sort((a, b) => {
        const da =
          a.kind === "transaction"
            ? new Date(a.item.created_at ?? a.item.date).getTime()
            : new Date(a.item.created_at ?? a.item.date).getTime();
        const db =
          b.kind === "transaction"
            ? new Date(b.item.created_at ?? b.item.date).getTime()
            : new Date(b.item.created_at ?? b.item.date).getTime();
        return db - da;
      });
  }, [combinedList, month, accountId]);

  const accountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name ?? "Account";

  if (loading) {
    return <div className="p-4"><div className="rounded-2xl bg-white p-4 shadow-sm text-sm text-slate-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-3 p-4 pb-24">
      <div className="text-lg font-semibold text-slate-900">Activity</div>
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-3 shadow-sm">
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
          >
            <option value="all">All</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="space-y-2">
        {filtered.map((entry, idx) => {
          if (entry.kind === "transaction") {
            return (
              <TransactionItem
                key={`tx-${entry.item.id}-${idx}`}
                kind="transaction"
                item={entry.item}
                accountName={accountName(entry.item.account_id)}
              />
            );
          }
          return (
            <TransactionItem
              key={`tr-${entry.item.id}-${entry.kind}-${idx}`}
              kind={entry.kind}
              item={entry.item}
              fromName={accountName(entry.item.from_account_id)}
              toName={accountName(entry.item.to_account_id)}
            />
          );
        })}
        {filtered.length === 0 && (
          <div className="text-sm text-slate-500">No activity for this filter.</div>
        )}
      </ul>
    </div>
  );
}
