import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Account } from "../types";
import { useAuth } from "../context/AuthContext";

export default function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<Account["type"]>("bank");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [role, setRole] = useState<"spend" | "savings">("spend");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; kind: "error" | "success" } | null>(null);
  const editingAccount = editingId
    ? accounts.find((a) => a.id === editingId)
    : null;

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id);
      setAccounts(data ?? []);
    };
    load();
  }, [user]);

  const addAccount = async () => {
    if (!user) return;
    if (!name.trim()) {
      setToast({ kind: "error", message: "Account name is required." });
      return;
    }
    const opening = Number(openingBalance) || 0;
    const { error, data } = await supabase
      .from("accounts")
      .upsert(
        {
          id: editingId ?? undefined,
          user_id: user.id,
          name,
          type,
          role,
          opening_balance: opening,
        },
        { onConflict: "id" }
      )
      .select()
      .single();
    if (error) {
      setToast({
        kind: "error",
        message:
          error.message.includes("role")
            ? "Column 'role' missing in Supabase. Run: ALTER TABLE accounts ADD COLUMN role text check (role in ('spend','savings')) default 'spend';"
            : error.message,
      });
      return;
    }
    setAccounts((prev) => {
      const exists = prev.find((p) => p.id === data?.id);
      if (exists) {
        return prev.map((p) => (p.id === data.id ? (data as Account) : p));
      }
      return [...prev, data as Account];
    });
    setName("");
    setOpeningBalance("0");
    setEditingId(null);
    setRole("spend");
    setType("bank");
    setToast({ kind: "success", message: editingId ? "Account updated." : "Account added." });
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-20 w-[90%] max-w-md -translate-x-1/2 rounded-xl px-4 py-3 text-sm shadow-lg ${
            toast.kind === "error" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {toast.message}
          <button
            className="float-right text-xs font-semibold text-slate-500"
            onClick={() => setToast(null)}
          >
            ✕
          </button>
        </div>
      )}
      <header className="text-base font-semibold text-slate-900">
        Account Rekening
      </header>
      <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama rekening"
            className="rounded-xl border border-slate-200 px-3 py-3"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Account["type"])}
            className="rounded-xl border border-slate-200 px-3 py-3"
          >
            <option value="bank">Bank</option>
            <option value="ewallet">E-Wallet</option>
            <option value="cash">Cash</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "spend" | "savings")}
            className="rounded-xl border border-slate-200 px-3 py-3"
          >
            <option value="spend">Spendable</option>
            <option value="savings">Savings</option>
          </select>
          <input
            inputMode="decimal"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            placeholder="Saldo awal"
            className="rounded-xl border border-slate-200 px-3 py-3"
          />
        </div>
        <button
          type="button"
          onClick={addAccount}
          className="w-full rounded-xl bg-primary px-4 py-3 text-white shadow-soft hover:brightness-110"
        >
          {editingId ? "Update account" : "Save account"}
        </button>
        {editingId && Number(editingAccount?.opening_balance ?? 0) === 0 && (
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase
                .from("accounts")
                .delete()
                .eq("id", editingId)
                .eq("user_id", user?.id ?? "");
              if (error) {
                setToast({ kind: "error", message: error.message });
                return;
              }
              setAccounts((prev) => prev.filter((a) => a.id !== editingId));
              setToast({ kind: "success", message: "Account deleted." });
              setEditingId(null);
              setName("");
              setOpeningBalance("0");
              setRole("spend");
              setType("bank");
            }}
            className="w-full rounded-xl border border-rose-200 px-4 py-3 text-rose-600 shadow-sm"
          >
            Delete account (balance 0)
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <div className="text-sm font-semibold text-slate-900 mb-2">Daftar rekening</div>
        <ul className="space-y-2 text-sm text-slate-700">
          {accounts.map((acc) => (
            <li
              key={acc.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
            >
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">
                  {acc.name} | {acc.type}
                </div>
                <div className="text-xs text-slate-500">
                  Role: {acc.role ?? "spend"} · Opening{" "}
                  {Number(acc.opening_balance).toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
              <button
                className="text-xs font-semibold text-primary"
                onClick={() => {
                  setEditingId(acc.id);
                  setName(acc.name);
                  setType(acc.type);
                  setOpeningBalance(String(acc.opening_balance));
                  setRole(acc.role ?? "spend");
                }}
              >
                Edit
              </button>
            </li>
          ))}
          {accounts.length === 0 && (
            <li className="text-slate-500">Belum ada rekening.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

