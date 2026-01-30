import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
  const [selected, setSelected] = useState<Combined | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<Transaction> & { password?: string }>({});
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const openTransaction = (item: Transaction) => {
    setSelected({ kind: "transaction", item });
    setEditing(false);
    setModalError(null);
    setEditDraft({
      id: item.id,
      date: item.date,
      amount: item.amount,
      account_id: item.account_id,
      category: item.category,
      note: item.note ?? "",
      type: item.type,
      password: "",
    });
  };

  const saveEdit = async () => {
    if (!selected || selected.kind !== "transaction") return;
    if (!user?.email) {
      setModalError("User email not found.");
      return;
    }
    if (!editDraft.password) {
      setModalError("Masukkan password untuk konfirmasi.");
      return;
    }
    setSaving(true);
    setModalError(null);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: editDraft.password,
      });
      if (authErr) throw authErr;

      const { error: updErr } = await supabase
        .from("transactions")
        .update({
          date: editDraft.date,
          amount: Number(editDraft.amount),
          account_id: editDraft.account_id,
          category: editDraft.category,
          note: editDraft.note ?? null,
          type: editDraft.type,
        })
        .eq("id", selected.item.id)
        .eq("user_id", user.id);
      if (updErr) throw updErr;

      await fetchData();
      setSelected(null);
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

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
                onSelect={() => openTransaction(entry.item)}
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

      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected?.kind === "transaction" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Detail Transaksi
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {selected.item.type === "income" ? "Income" : "Expense"}
                </div>
              </div>
              <button
                className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                onClick={() => setEditing(true)}
              >
                ✏️ Edit
              </button>
            </div>

            {!editing && (
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between"><span>Tanggal</span><span>{selected.item.date}</span></div>
                <div className="flex justify-between"><span>Amount</span><span>
                  {selected.item.amount.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                </span></div>
                <div className="flex justify-between"><span>Account</span><span>{accountName(selected.item.account_id)}</span></div>
                <div className="flex justify-between"><span>Category</span><span>{selected.item.category}</span></div>
                {selected.item.note && <div><div className="text-xs text-slate-500">Note</div><div>{selected.item.note}</div></div>}
              </div>
            )}

            {editing && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">Type</label>
                    <select
                      value={editDraft.type}
                      onChange={(e) => setEditDraft((d) => ({ ...d, type: e.target.value as "income" | "expense" }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">Tanggal</label>
                    <input
                      type="date"
                      value={editDraft.date}
                      onChange={(e) => setEditDraft((d) => ({ ...d, date: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Amount</label>
                  <input
                    inputMode="decimal"
                    value={editDraft.amount ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, amount: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">Account</label>
                    <select
                      value={editDraft.account_id}
                      onChange={(e) => setEditDraft((d) => ({ ...d, account_id: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">Category</label>
                    <input
                      value={editDraft.category ?? ""}
                      onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Note</label>
                  <input
                    value={editDraft.note ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, note: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Konfirmasi Password</label>
                  <input
                    type="password"
                    value={editDraft.password ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, password: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    placeholder="Password akun"
                  />
                </div>
                {modalError && <div className="text-sm text-rose-600">{modalError}</div>}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setModalError(null); }}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveEdit}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {selected?.kind !== "transaction" && (
          <div className="text-sm text-slate-600">Edit hanya untuk transaksi (bukan transfer).</div>
        )}
      </Modal>
    </div>
  );
}

function Modal({
  open,
  children,
  onClose,
}: {
  open: boolean;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[1px] p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
