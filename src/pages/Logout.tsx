import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function LogoutPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    signOut();
  }, [signOut]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="rounded-2xl bg-white px-4 py-6 text-center shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Logging out...</div>
        <div className="text-xs text-slate-500">Anda akan diarahkan.</div>
      </div>
    </div>
  );
}
