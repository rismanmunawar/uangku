import type { Transaction, Transfer } from "../types";

type TransactionLike =
  | { kind: "transaction"; item: Transaction; accountName?: string }
  | {
      kind: "transferOut" | "transferIn";
      item: Transfer;
      fromName?: string;
      toName?: string;
      onSelect?: () => void;
    };

const colorPalette = {
  transaction: {
    income: "bg-emerald-100 text-emerald-600",
    expense: "bg-rose-100 text-rose-600",
  },
  transfer: "bg-orange-100 text-orange-600",
};

export function TransactionItem(props: TransactionLike & { onSelect?: () => void }) {
  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });

  if (props.kind === "transaction") {
    const { item, accountName } = props;
    const color =
      item.type === "income" ? "text-emerald-600" : "text-rose-600";
    const sign = item.type === "income" ? "+" : "-";
    const displayDate = item.date; // trust the editable date field
    return (
      <li
        className="flex cursor-pointer items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-[1px] hover:shadow-md"
        onClick={props.onSelect}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
              colorPalette.transaction[item.type]
            }`}
          >
            {item.category.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span>{item.category}</span>
              {accountName && (
                <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                  {accountName}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">{displayDate}</div>
            {item.note && (
              <div className="text-xs text-slate-500">{item.note}</div>
            )}
          </div>
        </div>
        <div className={`text-sm font-semibold ${color}`}>
          {sign}
          {item.amount.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          })}
        </div>
      </li>
    );
  }

  const { item, fromName, toName } = props;
  const isOut = props.kind === "transferOut";
  return (
    <li
      className="flex cursor-pointer items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
      onClick={props.onSelect}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          {"<->"}
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-900">
            {isOut ? "Transfer Out" : "Transfer In"}
          </div>
          <div className="text-xs text-slate-500">
            {isOut ? fromName ?? "From" : toName ?? "To"} →{" "}
            {isOut ? toName ?? "Destination" : fromName ?? "Source"} ·{" "}
            {formatDateTime(item.created_at ?? item.date)}
          </div>
          {item.note && <div className="text-xs text-slate-500">{item.note}</div>}
        </div>
      </div>
      <div
        className={`text-sm font-semibold ${
          isOut ? "text-rose-600" : "text-emerald-600"
        }`}
      >
        {isOut ? "-" : "+"}
        {item.amount.toLocaleString("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        })}
      </div>
    </li>
  );
}


