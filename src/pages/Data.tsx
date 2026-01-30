import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function DataPage() {
  const { user } = useAuth();

  const exportCsv = async () => {
    if (!user) return;
    const [{ data: tx }, { data: tr }] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id),
      supabase.from("transfers").select("*").eq("user_id", user.id),
    ]);

    const txCsv =
      "transactions\n" +
      ["id,date,amount,type,account_id,category,note"]
        .concat(
          (tx ?? []).map((t) =>
            [
              t.id,
              t.date,
              t.amount,
              t.type,
              t.account_id,
              t.category,
              t.note ?? "",
            ]
              .map((v) => `"${String(v).replace(/\"/g, '""')}"`)
              .join(",")
          )
        )
        .join("\n");
    const trCsv =
      "\ntransfers\n" +
      ["id,date,amount,from_account_id,to_account_id,note"]
        .concat(
          (tr ?? []).map((t) =>
            [
              t.id,
              t.date,
              t.amount,
              t.from_account_id,
              t.to_account_id,
              t.note ?? "",
            ]
              .map((v) => `"${String(v).replace(/\"/g, '""')}"`)
              .join(",")
          )
        )
        .join("\n");

    const blob = new Blob([txCsv + trCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      <header className="text-base font-semibold text-slate-900">Data</header>
      <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
        <p className="text-sm text-slate-600">
          Ekspor data transaksi dan transfer ke CSV.
        </p>
        <button
          type="button"
          onClick={exportCsv}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800"
        >
          Export CSV
        </button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm space-y-2">
        <div className="text-sm font-semibold text-slate-900">
          Uangku Statement
        </div>
        <div className="text-xs text-slate-500">
          Ringkasan income, expense, dan net per bulan.
        </div>
        <Link
          to="/settings/data/statement"
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-soft"
        >
          Buka Statement
        </Link>
      </div>
    </div>
  );
}
