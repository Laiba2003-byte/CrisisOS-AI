import { useMemo } from "react";
import { trendSeries } from "../data/dashboardData.js";
import { getTypeStyle } from "../utils/formatters.js";

export function TrendChart() {
  const width = 560;
  const height = 170;
  const max = 34;

  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1725] p-5">
      <h2 className="text-base font-semibold text-white">Incident Trends (7 Days)</h2>
      <svg className="mt-6 h-48 w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Incident trends">
        {[0, 1, 2, 3].map((line) => (
          <line key={line} x1="0" x2={width} y1={line * 42 + 8} y2={line * 42 + 8} stroke="rgba(148,163,184,0.16)" />
        ))}
        {trendSeries.map((series) => {
          const points = series.points
            .map((point, index) => {
              const x = (index / (series.points.length - 1)) * width;
              const y = height - (point / max) * (height - 12);
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <polyline key={series.label} points={points} fill="none" stroke={series.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
        {trendSeries.map((series) => (
          <span key={series.label} className="flex items-center gap-2">
            <span className="h-0.5 w-5" style={{ backgroundColor: series.color }} />
            {series.label}
          </span>
        ))}
      </div>
    </section>
  );
}

export function TypeBreakdown({ incidents }) {
  const counts = useMemo(() => {
    const result = incidents.reduce((acc, incident) => {
      const key = incident.type || "other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return [
      ["flood", result.flood || 0, "#ef4444"],
      ["accident", result.accident || 0, "#f59e0b"],
      ["building_collapse", result.building_collapse || 0, "#38bdf8"],
      ["medical", result.medical || 0, "#34d399"],
      ["other", result.other || 0, "#64748b"]
    ];
  }, [incidents]);
  const total = counts.reduce((sum, [, count]) => sum + count, 0) || 1;
  let angleStart = 0;
  const gradientStops = counts
    .map(([, count, color]) => {
      const angleEnd = angleStart + (count / total) * 100;
      const stop = `${color} ${angleStart}% ${angleEnd}%`;
      angleStart = angleEnd;
      return stop;
    })
    .join(", ");

  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1725] p-5">
      <h2 className="text-base font-semibold text-white">Top Incident Types</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-[140px_1fr] sm:items-center">
        <div className="relative h-32 w-32 rounded-full" style={{ background: `conic-gradient(${gradientStops})` }}>
          <div className="absolute inset-8 rounded-full bg-[#0b1725]" />
        </div>
        <div className="space-y-3">
          {counts.map(([type, count, color]) => {
            const meta = getTypeStyle(type);
            const percent = Math.round((count / total) * 100);
            return (
              <div key={type} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex min-w-0 items-center gap-3 text-slate-200">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="truncate">{meta.label}</span>
                </span>
                <span className="text-slate-400">{percent}% ({count})</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ResourceAvailability({ resources }) {
  const groups = [
    { key: "rescue_team", label: "Rescue Teams", color: "bg-red-400" },
    { key: "ambulance", label: "Ambulances", color: "bg-amber-400" },
    { key: "fire_truck", label: "Fire Units", color: "bg-sky-400" }
  ].map((group) => {
    const total = resources.filter((resource) => resource.type === group.key).length;
    const available = resources.filter(
      (resource) => resource.type === group.key && resource.status === "available"
    ).length;
    return { ...group, total, available, percent: total ? Math.round((available / total) * 100) : 0 };
  });

  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1725] p-5">
      <h2 className="text-base font-semibold text-white">Resource Availability</h2>
      <div className="mt-6 space-y-5">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-200">{group.label}</span>
              <span className="text-slate-400">Available <b className="font-semibold text-white">{group.available}/{group.total}</b></span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${group.color}`} style={{ width: `${group.percent}%` }} />
            </div>
          </div>
        ))}
        <div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-200">Medical Supplies</span>
            <span className="text-slate-400">Available <b className="font-semibold text-white">65%</b></span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[65%] rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>
    </section>
  );
}