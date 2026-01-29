import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem("displayName") ?? "";
  });

  const saveProfile = () => {
    localStorage.setItem("displayName", displayName);
    alert("Profil disimpan lokal. (Jika ingin sync, kita bisa buat tabel profiles)");
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      <header className="text-base font-semibold text-slate-900">Profile</header>
      <div className="rounded-2xl bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-600">
            {(user?.email ?? "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {displayName || "Tambah nama tampilan"}
            </div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Email</label>
          <input
            value={user?.email ?? ""}
            readOnly
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-600"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Nama tampilan</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Masukkan nama"
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Password</label>
          <input
            value="••••••••"
            readOnly
            className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-500"
          />
          <p className="text-xs text-slate-500">
            Reset password kirim email lewat Supabase Auth (belum di-hook di UI).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={saveProfile}
            className="rounded-xl bg-primary px-4 py-3 text-white shadow-soft hover:brightness-110"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={signOut}
            className="rounded-xl border border-slate-200 px-4 py-3 text-slate-800"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
