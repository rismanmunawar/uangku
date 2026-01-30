import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  {
    title: "Profile",
    desc: "Email, display name, password",
    to: "/settings/profile",
  },
  {
    title: "Accounts",
    desc: "Manage your accounts",
    to: "/settings/accounts",
  },
  {
    title: "Data",
    desc: "Export transactions & master data",
    to: "/settings/data",
  },
  {
    title: "Logout",
    desc: "Sign out of the session",
    to: "/settings/logout",
  },
];

export default function Settings() {
  const { user } = useAuth();
  return (
    <div className="space-y-4 p-4 pb-24">
      <div className="rounded-2xl bg-white p-4 shadow-sm flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-600">
          {(user?.email ?? "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Me
          </div>
          <div className="text-base font-semibold text-slate-900">
            {user?.email ?? "User"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-2 shadow-sm">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-between rounded-xl px-3 py-4 hover:bg-slate-50"
          >
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {item.title}
              </div>
            <div className="text-xs text-slate-500">{item.desc}</div>
          </div>
          <span className="text-slate-400">{">"}</span>
        </Link>
      ))}
    </div>
  </div>
);
}


