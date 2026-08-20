import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ambulance,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Hospital,
  Loader2,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  Users,
  Warehouse,
  Wifi,
  WifiOff,
  Wrench
} from "lucide-react";
import { API_BASE_URL } from "../utils/api.js";
import { fallbackShelters } from "../data/dashboardData.js";
import {
  confidenceLabel,
  formatTime,
  getSeverityStyle,
  getTypeStyle,
  statusLabel
} from "../utils/formatters.js";
import { ResourceAvailability, TrendChart, TypeBreakdown } from "./AnalyticsPanels.jsx";
import DashboardMap from "./DashboardMap.jsx";
import IncidentDashboard from "./IncidentDashboard.jsx";
import RecentAlerts from "./RecentAlerts.jsx";
import ReportForm from "./ReportForm.jsx";

const resourceTypeMeta = {
  ambulance: { label: "Ambulance", icon: Ambulance, tone: "text-emerald-300 bg-emerald-500/15" },
  fire_truck: { label: "Fire Unit", icon: Flame, tone: "text-red-300 bg-red-500/15" },
  rescue_team: { label: "Rescue Team", icon: Users, tone: "text-sky-300 bg-sky-500/15" }
};

const resourceStatusStyles = {
  available: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
  busy: "border-amber-500/30 bg-amber-500/15 text-amber-200",
  offline: "border-slate-500/30 bg-slate-500/15 text-slate-300"
};

const resourceStatusOptions = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "offline", label: "Offline" }
];

const shelters = [
  {
    id: "shelter-lhr-model-town",
    name: "Model Town Relief Center",
    location: "Model Town Lahore",
    status: "open",
    capacity: 320,
    occupied: 214,
    medical: "staffed"
  },
  {
    id: "shelter-lhr-shahdara",
    name: "Shahdara Evacuation School",
    location: "Shahdara Lahore",
    status: "open",
    capacity: 450,
    occupied: 318,
    medical: "limited"
  },
  {
    id: "shelter-rwp-saddar",
    name: "Saddar Community Hall",
    location: "Rawalpindi Saddar",
    status: "standby",
    capacity: 260,
    occupied: 62,
    medical: "staffed"
  },
  {
    id: "shelter-khi-clifton",
    name: "Clifton Relief Camp",
    location: "Karachi Clifton",
    status: "open",
    capacity: 520,
    occupied: 387,
    medical: "staffed"
  },
  {
    id: "shelter-swat-mingora",
    name: "Mingora Sports Complex",
    location: "Mingora Swat",
    status: "standby",
    capacity: 600,
    occupied: 121,
    medical: "limited"
  }
];

function Panel({ children, className = "" }) {
  return (
    <section className={`rounded-lg border border-white/10 bg-[#0b1725] p-5 ${className}`}>
      {children}
    </section>
  );
}

function MetricCard({ detail, icon: Icon, label, tone, value }) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Panel>
  );
}

function EmptyPanel({ icon: Icon = AlertTriangle, title }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-5 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
    </div>
  );
}

function getAverageConfidence(incidents) {
  const values = incidents
    .map((incident) => incident.confidence)
    .filter((value) => typeof value === "number");

  if (!values.length) {
    return "--";
  }

  return `${Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100)}%`;
}

function IncidentRows({ incidents }) {
  if (!incidents.length) {
    return <EmptyPanel icon={FileText} title="No report records" />;
  }

  return (
    <div className="divide-y divide-white/10 rounded-lg border border-white/10 bg-black/10">
      {incidents.map((incident) => {
        const type = getTypeStyle(incident.type);
        const severity = getSeverityStyle(incident.severity);

        return (
          <article className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center" key={incident.id}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-2 py-1 text-xs font-medium ${type.bg} ${type.color}`}>
                  {type.label}
                </span>
                <span className={`rounded-md border px-2 py-1 text-xs font-medium ${severity.badge}`}>
                  {severity.label}
                </span>
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300">
                  {statusLabel(incident.status)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{incident.rawText}</p>
              <p className="mt-2 text-xs text-slate-500">{incident.locationText || "Unresolved location"}</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400 lg:justify-end">
              <Clock className="h-4 w-4" />
              {formatTime(incident.createdAt)}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function AlertsView({
  actionStates,
  apiOnline,
  incidents,
  isLoading,
  onAdvanceStatus,
  onConfirmDispatch,
  suggestionsByIncidentId
}) {
  const activeAlerts = incidents.filter((incident) => incident.status !== "resolved");
  const criticalAlerts = activeAlerts.filter((incident) => incident.severity === "critical");
  const reviewAlerts = activeAlerts.filter((incident) => incident.status === "needs_review");

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Active" value={activeAlerts.length} detail="Unresolved alerts" icon={AlertTriangle} tone="bg-red-500/15 text-red-300" />
        <MetricCard label="Critical" value={criticalAlerts.length} detail="Highest severity" icon={ShieldCheck} tone="bg-amber-500/15 text-amber-300" />
        <MetricCard label="Review" value={reviewAlerts.length} detail="Operator check" icon={FileText} tone="bg-sky-500/15 text-sky-300" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.35fr]">
        <RecentAlerts incidents={activeAlerts} />
        <Panel>
          <h2 className="text-base font-semibold text-white">Alert Feed</h2>
          <div className="mt-4">
            <IncidentRows incidents={activeAlerts.slice(0, 8)} />
          </div>
        </Panel>
      </section>

      <IncidentDashboard
        actionStates={actionStates}
        apiOnline={apiOnline}
        incidents={activeAlerts}
        isLoading={isLoading}
        onAdvanceStatus={onAdvanceStatus}
        onConfirmDispatch={onConfirmDispatch}
        suggestionsByIncidentId={suggestionsByIncidentId}
      />
    </>
  );
}

export function IncidentsView(props) {
  return <IncidentDashboard {...props} />;
}

export function ReportsView({ apiOnline, incidents, onIncidentCreated, onResourcesRefresh }) {
  const recentReports = incidents.slice(0, 8);
  const needsReview = incidents.filter((incident) => incident.status === "needs_review").length;

  return (
    <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-5">
        <ReportForm onIncidentCreated={onIncidentCreated} onResourcesRefresh={onResourcesRefresh} />
        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="AI Intake" value={apiOnline ? "Live" : "Demo"} detail="Analysis service" icon={Wifi} tone="bg-emerald-500/15 text-emerald-300" />
          <MetricCard label="Avg Confidence" value={getAverageConfidence(incidents)} detail="Saved reports" icon={BarChart3} tone="bg-sky-500/15 text-sky-300" />
          <MetricCard label="Manual Review" value={needsReview} detail="Needs operator check" icon={AlertTriangle} tone="bg-amber-500/15 text-amber-300" />
        </section>
      </div>

      <Panel>
        <h2 className="text-base font-semibold text-white">Report Archive</h2>
        <p className="mt-1 text-sm text-slate-400">{recentReports.length} latest records</p>
        <div className="mt-4">
          <IncidentRows incidents={recentReports} />
        </div>
      </Panel>
    </section>
  );
}

export function MapOnlyView({ incidents, resources }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <DashboardMap
        heightClass="h-[calc(100vh-210px)] min-h-[520px]"
        incidents={incidents}
        resources={resources}
        title="Operational Map"
      />
      <div className="space-y-5">
        <Panel>
          <h2 className="text-base font-semibold text-white">Map Totals</h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Incident pins</span>
              <span className="font-semibold text-white">{incidents.filter((incident) => typeof incident.lat === "number").length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Resource pins</span>
              <span className="font-semibold text-white">{resources.filter((resource) => typeof resource.lat === "number").length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Available teams</span>
              <span className="font-semibold text-emerald-200">{resources.filter((resource) => resource.status === "available").length}</span>
            </div>
          </div>
        </Panel>
        <RecentAlerts incidents={incidents} />
      </div>
    </section>
  );
}

export function ResourcesView({ actionStates = {}, apiOnline, onStatusChange, onTrackingUpdate, resources }) {
  const [trackingDrafts, setTrackingDrafts] = useState({});
  const grouped = useMemo(
    () => [
      { key: "ambulance", label: "Ambulances", count: resources.filter((resource) => resource.type === "ambulance").length },
      { key: "fire_truck", label: "Fire Units", count: resources.filter((resource) => resource.type === "fire_truck").length },
      { key: "rescue_team", label: "Rescue Teams", count: resources.filter((resource) => resource.type === "rescue_team").length }
    ],
    [resources]
  );

  useEffect(() => {
    setTrackingDrafts((current) => {
      const next = { ...current };
      const resourceIds = new Set(resources.map((resource) => resource.id));

      resources.forEach((resource) => {
        if (!next[resource.id]) {
          next[resource.id] = {
            lat: String(Number(resource.lat).toFixed(5)),
            lng: String(Number(resource.lng).toFixed(5))
          };
        }
      });

      Object.keys(next).forEach((resourceId) => {
        if (!resourceIds.has(resourceId)) {
          delete next[resourceId];
        }
      });

      return next;
    });
  }, [resources]);

  function updateTrackingDraft(resourceId, key, value) {
    setTrackingDrafts((current) => ({
      ...current,
      [resourceId]: {
        ...(current[resourceId] || {}),
        [key]: value
      }
    }));
  }

  function submitTrackingUpdate(event, resource) {
    event.preventDefault();
    const draft = trackingDrafts[resource.id] || {};
    onTrackingUpdate(resource, {
      lat: Number(draft.lat),
      lng: Number(draft.lng)
    });
  }

  function nudgeTracking(resource) {
    const lat = Number((resource.lat + 0.004).toFixed(5));
    const lng = Number((resource.lng + 0.004).toFixed(5));

    setTrackingDrafts((current) => ({
      ...current,
      [resource.id]: {
        lat: String(lat),
        lng: String(lng)
      }
    }));
    onTrackingUpdate(resource, { lat, lng });
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        {grouped.map((group) => (
          <MetricCard
            detail="Registered units"
            icon={resourceTypeMeta[group.key]?.icon || Wrench}
            key={group.key}
            label={group.label}
            tone={resourceTypeMeta[group.key]?.tone || "bg-slate-500/15 text-slate-300"}
            value={group.count}
          />
        ))}
      </section>

      <Panel>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Resource Control</h2>
            <p className="mt-1 text-sm text-slate-400">{resources.length} registered response units</p>
          </div>
          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-400">
            {resources.filter((resource) => resource.status === "available").length} available
          </span>
        </div>

        {resources.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {resources.map((resource) => {
              const meta = resourceTypeMeta[resource.type] || { label: resource.type, icon: Wrench, tone: "text-slate-300 bg-slate-500/15" };
              const Icon = meta.icon;
              const actionState = actionStates[resource.id];
              const draft = trackingDrafts[resource.id] || {
                lat: String(Number(resource.lat).toFixed(5)),
                lng: String(Number(resource.lng).toFixed(5))
              };
              const isTrackingLoading = actionState?.loading === "tracking";

              return (
                <article className="rounded-lg border border-white/10 bg-black/15 p-4" key={resource.id}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-white">{resource.name}</h3>
                        <span className={`rounded-md border px-2 py-1 text-xs font-medium ${resourceStatusStyles[resource.status] || resourceStatusStyles.offline}`}>
                          {statusLabel(resource.status)}
                        </span>
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {resource.lat.toFixed(4)}, {resource.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {resourceStatusOptions.map((option) => {
                      const isLoading = actionState?.loading === option.value;

                      return (
                        <button
                          className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-medium transition ${
                            resource.status === option.value
                              ? "border-red-500/30 bg-red-500/15 text-white"
                              : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                          disabled={!apiOnline || Boolean(actionState?.loading) || resource.status === option.value}
                          key={option.value}
                          onClick={() => onStatusChange(resource, option.value)}
                          type="button"
                        >
                          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <form className="mt-4 rounded-lg border border-white/10 bg-[#07111d] p-3" onSubmit={(event) => submitTrackingUpdate(event, resource)}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">GPS Tracking</p>
                        <p className="mt-1 text-xs text-slate-500">Manual ping from field team app</p>
                      </div>
                      <button
                        className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!apiOnline || Boolean(actionState?.loading)}
                        onClick={() => nudgeTracking(resource)}
                        type="button"
                      >
                        {isTrackingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Simulate Ping
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs text-slate-500">Latitude</span>
                        <input
                          className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/15 px-3 text-sm text-slate-100 outline-none focus:border-red-400/50"
                          onChange={(event) => updateTrackingDraft(resource.id, "lat", event.target.value)}
                          type="number"
                          step="0.00001"
                          value={draft.lat}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-slate-500">Longitude</span>
                        <input
                          className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/15 px-3 text-sm text-slate-100 outline-none focus:border-red-400/50"
                          onChange={(event) => updateTrackingDraft(resource.id, "lng", event.target.value)}
                          type="number"
                          step="0.00001"
                          value={draft.lng}
                        />
                      </label>
                    </div>
                    <button
                      className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!apiOnline || Boolean(actionState?.loading)}
                      type="submit"
                    >
                      {isTrackingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                      Update GPS
                    </button>
                  </form>

                  {!apiOnline ? <p className="mt-3 text-xs text-slate-500">Live backend required for status and tracking changes.</p> : null}
                  {actionState?.error ? (
                    <p className="mt-3 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                      {actionState.error}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyPanel icon={Ambulance} title="No resources registered" />
          </div>
        )}
      </Panel>
    </>
  );
}
export function SheltersView({ shelters: activeShelters, onUpdateShelter }) {
  const displayShelters = (Array.isArray(activeShelters) && activeShelters.length > 0) ? activeShelters : fallbackShelters;
  const totalCapacity = displayShelters.reduce((sum, s) => sum + (s.capacity || 0), 0);
  const totalOccupancy = displayShelters.reduce((sum, s) => sum + (s.occupancy || s.occupied || 0), 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Shelters" value={displayShelters.length} detail="Registered relief centers" icon={Warehouse} tone="bg-sky-500/15 text-sky-300" />
        <MetricCard label="Total Capacity" value={totalCapacity} detail="Available beds" icon={Users} tone="bg-emerald-500/15 text-emerald-300" />
        <MetricCard label="Occupied" value={`${occupancyPercent}%`} detail={`${totalOccupancy}/${totalCapacity} beds filled`} icon={Building2} tone="bg-amber-500/15 text-amber-300" />
      </section>

      <Panel>
        <h2 className="text-base font-semibold text-white">Emergency Shelter Network</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {displayShelters.map((shelter) => {
            const currentOccupancy = shelter.occupancy ?? shelter.occupied ?? 0;
            const percent = shelter.capacity > 0 ? Math.min(100, Math.round((currentOccupancy / shelter.capacity) * 100)) : 0;
            const isActive = shelter.status === "active" || shelter.status === "open";
            const isFull = shelter.status === "full" || percent >= 100;

            return (
              <article className="rounded-lg border border-white/10 bg-black/15 p-4" key={shelter.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{shelter.name}</h3>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="h-4 w-4 shrink-0 text-sky-400" />
                      {shelter.locationText || shelter.location}
                    </p>
                  </div>
                  <span className={`rounded-md border px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${
                    isFull
                      ? "border-red-500/30 bg-red-500/15 text-red-200"
                      : isActive
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                      : "border-slate-500/30 bg-slate-500/15 text-slate-300"
                  }`}>
                    {isFull ? "Full" : shelter.status}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Occupancy</span>
                    <span className="font-semibold text-white">{currentOccupancy} / {shelter.capacity} beds ({percent}%)</span>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percent >= 90 ? "bg-red-400" : percent >= 75 ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {shelter.contactPhone ? (
                  <p className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="text-slate-500">Contact:</span> {shelter.contactPhone}
                  </p>
                ) : null}

                {onUpdateShelter ? (
                  <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
                    <button
                      type="button"
                      disabled={currentOccupancy <= 0}
                      onClick={() => onUpdateShelter(shelter, { occupancy: Math.max(0, currentOccupancy - 10) })}
                      className="rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                    >
                      -10 Beds
                    </button>
                    <button
                      type="button"
                      disabled={currentOccupancy >= shelter.capacity}
                      onClick={() => onUpdateShelter(shelter, { occupancy: Math.min(shelter.capacity, currentOccupancy + 10) })}
                      className="rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                    >
                      +10 Beds
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </Panel>
    </>
  );
}

export function AnalyticsView({ assignedCount, criticalCount, incidents, resources, reviewCount }) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="Incidents" value={incidents.length} detail="Total records" icon={BarChart3} tone="bg-sky-500/15 text-sky-300" />
        <MetricCard label="Critical" value={criticalCount} detail="Open critical" icon={AlertTriangle} tone="bg-red-500/15 text-red-300" />
        <MetricCard label="Assigned" value={assignedCount} detail="Active dispatches" icon={CheckCircle2} tone="bg-emerald-500/15 text-emerald-300" />
        <MetricCard label="Review" value={reviewCount} detail="AI confidence queue" icon={FileText} tone="bg-amber-500/15 text-amber-300" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr_1fr]">
        <TrendChart />
        <TypeBreakdown incidents={incidents} />
        <ResourceAvailability resources={resources} />
      </section>
    </>
  );
}

export function SettingsView({ apiOnline, isLoading, onRefresh }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">System Connection</h2>
            <p className="mt-1 text-sm text-slate-400">{apiOnline ? "Backend connected" : "Demo data active"}</p>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${apiOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
            {apiOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-white/10 bg-black/15 p-4">
          <p className="text-xs uppercase text-slate-500">API Base URL</p>
          <p className="mt-2 break-all text-sm text-slate-200">{API_BASE_URL}</p>
        </div>
        <button
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          onClick={onRefresh}
          type="button"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Refresh Data
        </button>
      </Panel>

      <Panel>
        <h2 className="text-base font-semibold text-white">Operational Defaults</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase text-slate-500">AI Provider</p>
            <p className="mt-2 text-sm font-semibold text-white">OpenRouter</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase text-slate-500">Review Threshold</p>
            <p className="mt-2 text-sm font-semibold text-white">50% confidence</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/15 p-4 sm:col-span-2">
            <p className="text-xs uppercase text-slate-500">Dispatch Flow</p>
            <p className="mt-2 text-sm font-semibold text-white">{"needs_review -> new -> assigned -> en_route -> on_scene -> resolved"}</p>
          </div>
        </div>
      </Panel>
    </section>
  );
}