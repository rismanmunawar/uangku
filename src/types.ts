export type AccountType = "bank" | "ewallet" | "cash";

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  role?: "spend" | "savings"; // spendable vs savings/pocket
  opening_balance: number;
  created_at: string;
};

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  user_id: string;
  date: string;
  amount: number; // always positive
  type: TransactionType;
  account_id: string;
  category: string;
  note?: string | null;
  created_at: string;
};

export type Transfer = {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  admin_fee?: number | null;
  from_account_id: string;
  to_account_id: string;
  note?: string | null;
  created_at: string;
};
