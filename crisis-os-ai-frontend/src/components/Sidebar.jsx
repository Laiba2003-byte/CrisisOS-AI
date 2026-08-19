import {
  Ambulance,
  BarChart3,
  Bell,
  CircleGauge,
  FileText,
  Home,
  Map,
  Settings,
  Shield,
  ClipboardCheck,
  Warehouse
} from "lucide-react";
import { formatTime } from "../utils/formatters.js";

const navItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "alerts", label: "Alerts", icon: Bell, countKey: "alerts" },
  { id: "incidents", label: "Incidents", icon: CircleGauge, countKey: "incidents" },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "map", label: "Map View", icon: Map },
  { id: "resources", label: "Resources", icon: Ambulance, countKey: "resources" },
  { id: "shelters", label: "Shelters", icon: Warehouse, countKey: "shelters" },
  { id: "analytics", label: "Analytics", icon: BarChart3, countKey: "analytics" },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "test", label: "Test Page", icon: ClipboardCheck }
];

function Sidebar({ activeView = "overview", apiOnline, counts = {}, onViewChange }) {
  return (
    <aside className="border-white/10 bg-[#07111d] text-white md:min-h-screen md:border-r">
      <div className="flex h-full flex-col px-4 py-5 md:px-5">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 text-red-400 ring-1 ring-red-500/30">
            <Shield className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold">CrisisOS</span>
        </div>

        <nav className="mt-8 flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const count = item.countKey ? counts[item.countKey] : null;

            return (
              <button
                aria-current={isActive ? "page" : undefined}
                className={`flex min-w-max items-center gap-3 rounded-lg px-4 py-3 text-sm transition md:min-w-0 ${
                  isActive
                    ? "border border-red-500/25 bg-red-500/20 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
                key={item.id}
                onClick={() => onViewChange(item.id)}
                type="button"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {Number.isFinite(count) && count > 0 ? (
                  <span className="min-w-6 rounded-full bg-white/10 px-2 py-0.5 text-center text-xs text-slate-200">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 hidden rounded-lg border border-white/10 bg-white/[0.03] p-4 md:mt-auto md:block">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className={`h-2.5 w-2.5 rounded-full ${apiOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span>System Status</span>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            {apiOnline ? "Backend connected" : "Demo data active"}
          </p>
          <p className="mt-3 text-xs text-slate-500">Last checked: {formatTime(Date.now())}</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;