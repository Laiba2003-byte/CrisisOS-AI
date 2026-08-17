import { Bell, ChevronDown } from "lucide-react";

function Header({ alertCount = 0, apiOnline, onAlertsClick, subtitle, title }) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 bg-[#081321]/95 px-5 py-4 text-white lg:flex-row lg:items-center lg:justify-between lg:px-6">
      <div>
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-11 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-200">
          <span>Lahore, Pakistan</span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </div>
        <button
          aria-label="Open alerts"
          className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          onClick={onAlertsClick}
          type="button"
        >
          <Bell className="h-5 w-5" />
          {alertCount > 0 ? (
            <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {Math.min(alertCount, 99)}
            </span>
          ) : null}
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold ring-1 ring-blue-300/30">
            LA
          </div>
          <div>
            <div className="text-sm font-medium">Admin</div>
            <div className="text-xs text-slate-500">{apiOnline ? "Operations Team" : "Demo Mode"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;