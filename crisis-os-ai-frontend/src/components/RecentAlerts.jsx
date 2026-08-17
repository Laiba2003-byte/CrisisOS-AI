import { AlertTriangle, Ambulance, Building2, Hospital, Radio, Zap } from "lucide-react";
import { formatTime, getSeverityStyle, getTypeStyle } from "../utils/formatters.js";

const iconByType = {
  flood: Radio,
  fire: AlertTriangle,
  medical: Hospital,
  accident: Ambulance,
  building_collapse: Building2,
  drowning: AlertTriangle,
  other: Zap
};

function RecentAlerts({ incidents }) {
  const alerts = incidents.slice(0, 5);

  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1725]">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-base font-semibold text-white">Recent Alerts</h2>
        <span className="text-sm text-slate-500">{alerts.length} shown</span>
      </div>
      {alerts.length ? (
        <div className="divide-y divide-white/10">
          {alerts.map((incident) => {
            const type = getTypeStyle(incident.type);
            const severity = getSeverityStyle(incident.severity);
            const Icon = iconByType[incident.type] || iconByType.other;

            return (
              <article key={incident.id} className="grid grid-cols-[48px_1fr_auto] gap-4 px-5 py-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${type.bg} ${type.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${severity.dot}`} />
                    <h3 className="truncate text-sm font-semibold text-white">{type.label}</h3>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-400">{incident.locationText || incident.rawText}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">{formatTime(incident.createdAt)}</div>
                  <div className={`mt-2 rounded-md border px-2 py-1 text-xs font-medium ${severity.badge}`}>
                    {severity.label}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="border-t border-white/10 px-5 py-10 text-sm text-slate-500">No live alerts.</div>
      )}
    </section>
  );
}

export default RecentAlerts;