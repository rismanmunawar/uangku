type Props = { message?: string };

export function FullScreenLoader({ message = "Loading..." }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-emerald-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-ping rounded-full bg-orange-300 opacity-40" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-primary" />
          <div className="absolute inset-4 rounded-full border-2 border-white shadow-inner" />
        </div>
        <div className="text-sm font-semibold text-slate-700">{message}</div>
      </div>
    </div>
  );
}
