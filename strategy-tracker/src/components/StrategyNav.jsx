import { NavLink, useParams } from "react-router-dom";

export default function StrategyNav() {
  const { accountId } = useParams();
  const aid = Number(accountId) || 1;

  const base = (sid) => `/strategy/${sid}/account/${aid}`;

  const linkCls = ({ isActive }) =>
    `px-4 py-2 rounded-full border text-sm ${
      isActive ? "border-purple-400 text-white" : "border-slate-600 text-gray-300"
    } hover:border-purple-300`;

  return (
    <nav className="flex items-center gap-2">
      <NavLink to={base(1)} className={linkCls}>Strategy 1</NavLink>
      <NavLink to={base(2)} className={linkCls}>Strategy 2</NavLink>
      {/* Add more strategies by duplicating the line above and changing the id */}
    </nav>
  );
}
