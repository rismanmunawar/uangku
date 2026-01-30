import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Account, TransactionType } from "../types";
import { useAuth } from "../context/AuthContext";

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AddTransaction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"income" | "expense" | "transfer">("expense");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("General");
  const [note, setNote] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [adminFee, setAdminFee] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const resetForm = () => {
    const first = accounts[0]?.id ?? "";
    const second = accounts[1]?.id ?? "";
    setDate(todayIso());
    setAmount("");
    setCategory("General");
    setNote("");
    setAdminFee("");
    setAccountId(first);
    setFromAccount(first);
    setToAccount(second && second !== first ? second : "");
  };

  useEffect(() => {
    const loadAccounts = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      setAccounts(data ?? []);
      if (!accountId && data && data.length > 0) {
        setAccountId(data[0].id);
        setFromAccount(data[0].id);
      }
    };
    loadAccounts();
  }, [user, accountId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) throw new Error("Not signed in");
      const parsedAmount = Number(amount);
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Amount must be a positive number");
      }

      if (mode === "transfer") {
        if (!fromAccount || !toAccount || fromAccount === toAccount) {
          throw new Error("Choose two different accounts");
        }
        const { error: insertError } = await supabase.from("transfers").insert({
          user_id: user.id,
          date,
          amount: parsedAmount,
          from_account_id: fromAccount,
          to_account_id: toAccount,
          note: note || null,
        });
        if (insertError) throw insertError;
      } else {
        const txType: TransactionType = mode;
        const { error: insertError } = await supabase.from("transactions").insert({
          user_id: user.id,
          date,
          amount: parsedAmount,
          type: txType,
          account_id: accountId,
          category,
          note: note || null,
        });
        if (insertError) throw insertError;
      }

      setToast("Saved successfully");
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["General", "Salary", "Food", "Transport", "Bills", "Shopping", "Transfer"];

  const renderForm = () => {
    if (mode === "transfer") {
      return (
        <>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-3"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Amount</label>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-200 px-3 py-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">From</label>
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-3"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">To</label>
              <select
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-3"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 px-3 py-3"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Admin fee</label>
            <input
              inputMode="decimal"
              value={adminFee}
              onChange={(e) => setAdminFee(e.target.value)}
              placeholder="0 (optional)"
              className="w-full rounded-xl border border-slate-200 px-3 py-3"
            />
            <p className="text-[11px] text-slate-500">
              Optional. Only fill if the source bank charges an admin fee.
            </p>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Amount</label>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-3"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-3"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Note</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
          />
        </div>
      </>
    );
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      {toast && (
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 shadow-sm">
          {toast}
          <button
            className="float-right text-xs font-semibold text-emerald-600"
            onClick={() => setToast(null)}
          >
            x
          </button>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {["income", "expense", "transfer"].map((tab) => (
          <button
            key={tab}
            onClick={() => setMode(tab as typeof mode)}
            className={`rounded-lg px-3 py-2 transition ${
              mode === tab
                ? "bg-white text-primary shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
            type="button"
          >
            {tab === "transfer"
              ? "Mutation"
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <form className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
        {renderForm()}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary px-4 py-3 text-white shadow-soft transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
