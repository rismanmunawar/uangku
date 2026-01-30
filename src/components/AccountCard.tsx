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
  const roleLabel = account.role === "savings" ? "Savings" : "Spendable";
  const roleClass =
    account.role === "savings"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
      : "bg-slate-100 text-slate-700 border border-slate-200";

  return (
    <div className="h-full rounded-2xl border border-orange-100 bg-white p-3.5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex h-6 items-center text-[10px] font-semibold tracking-wide text-orange-500 whitespace-nowrap">
          {typeLabel[account.type].toUpperCase()}
        </div>
        <span
          className={`flex h-6 items-center rounded-full px-2 text-[10px] font-semibold ${roleClass}`}
        >
          {roleLabel}
        </span>
      </div>
      <div className="mt-2 text-base font-semibold text-slate-900 leading-snug">
        {account.name}
      </div>
      <div className="mt-4 text-xs text-slate-500">Balance</div>
      <div className="text-xl font-bold text-slate-900 leading-tight break-words">
        {balance.toLocaleString("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        })}
      </div>
    </div>
  );
}
