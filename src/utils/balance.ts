import type { Account, Transaction, Transfer } from "../types";

type BalanceInput = {
  account: Account;
  transactions: Transaction[];
  transfers: Transfer[];
};

export function calculateAccountBalance({
  account,
  transactions,
  transfers,
}: BalanceInput): number {
  const income = transactions
    .filter((t) => t.type === "income" && t.account_id === account.id)
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense" && t.account_id === account.id)
    .reduce((sum, t) => sum + t.amount, 0);

  const incomingTransfers = transfers
    .filter((tr) => tr.to_account_id === account.id)
    .reduce((sum, tr) => sum + tr.amount, 0);

  const outgoingTransfers = transfers
    .filter((tr) => tr.from_account_id === account.id)
    .reduce((sum, tr) => sum + tr.amount + (tr.admin_fee ?? 0), 0);

  return (
    account.opening_balance + income - expense + incomingTransfers - outgoingTransfers
  );
}

export function getTotalsForMonth(
  transactions: Transaction[],
  monthIso: string
): { income: number; expense: number; net: number } {
  const filtered = transactions.filter((t) => t.date.startsWith(monthIso));
  const income = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, net: income - expense };
}
