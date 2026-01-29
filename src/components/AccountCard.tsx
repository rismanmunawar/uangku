import type { Account } from "../types";

type Props = {
  account: Account;
  balance: number;
};

export function AccountCard({ account, balance }: Props) {
  const typeLabel: Record<Account["type"], string> = {
    bank: "Bank",
    ewallet: "E-Wallet",
    cash: "Cash",
  };

  return (
    <div className="min-w-[200px] rounded-2xl border border-orange-100 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-orange-500">
          {typeLabel[account.type]}
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-orange-100 px-2 py-1 text-[11px] font-semibold text-orange-600">
            {account.type === "bank" ? "Bank" : account.type === "ewallet" ? "E-Wallet" : "Cash"}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
            {account.role === "savings" ? "Savings" : "Spend"}
          </span>
        </div>
      </div>
      <div className="mt-1 text-lg font-semibold text-slate-900">
        {account.name}
      </div>
      <div className="mt-5 text-xs text-slate-500">Balance</div>
      <div className="text-2xl font-bold text-slate-900">
        {balance.toLocaleString("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        })}
      </div>
    </div>
  );
}
