import {
  Activity,
  AlertTriangle,
  Ambulance,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Hospital,
  Loader2,
  MapPin,
  Radio,
  Route,
  Zap
} from "lucide-react";
import { statusStyles } from "../data/dashboardData.js";
import {
  confidenceLabel,
  getSeverityStyle,
  getTypeStyle,
  statusLabel
} from "../utils/formatters.js";

const iconByType = {
  flood: Radio,
  fire: AlertTriangle,
  medical: Hospital,
  accident: Ambulance,
  building_collapse: Building2,
  drowning: AlertTriangle,
  other: Zap
};

const nextStatusAction = {
  needs_review: "Approve Review",
  assigned: "Mark En Route",
  en_route: "Mark On Scene",
  on_scene: "Resolve"
};

function getSuggestedResource(incident, suggestionsByIncidentId) {
  return (
    incident.assignedResource ||
    incident.suggestedResource ||
    suggestionsByIncidentId[incident.id] ||
    null
  );
}

function getActionLabel(incident) {
  if (incident.status === "new") {
    return "Confirm Dispatch";
  }

  return nextStatusAction[incident.status] || null;
}

function CardAction({ actionState, apiOnline, incident, onAdvanceStatus, onConfirmDispatch, suggestion }) {
  const isLoading = Boolean(actionState?.loading);
  const actionLabel = getActionLabel(incident);

  if (incident.status === "needs_review") {
    const hasResolvedLocation =
      typeof incident.lat === "number" && typeof incident.lng === "number";

    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Manual review required before dispatch.
        </div>
        {hasResolvedLocation ? (
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/15 px-4 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={!apiOnline || isLoading}
            onClick={() => onAdvanceStatus(incident)}
            type="button"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isLoading ? "Approving" : "Approve Review"}
          </button>
        ) : (
          <p className="text-xs text-slate-500">
            A resolved location is required before resource suggestion.
          </p>
        )}
        {!apiOnline ? (
          <p className="text-xs text-slate-500">Live backend required for review approval.</p>
        ) : null}
        {actionState?.error ? (
          <p className="rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {actionState.error}
          </p>
        ) : null}
      </div>
    );
  }

  if (["resolved", "merged"].includes(incident.status)) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
        <CheckCircle2 className="h-4 w-4" /> {incident.status === "merged" ? "Merged" : "Resolved"}
      </div>
    );
  }

  if (!actionLabel) {
    return null;
  }

  const handleClick = () => {
    if (incident.status === "new") {
      onConfirmDispatch(incident, suggestion);
      return;
    }

    onAdvanceStatus(incident);
  };

  return (
    <div className="space-y-2">
      <button
        className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition sm:w-auto ${
          incident.status === "new"
            ? "bg-red-500 text-white hover:bg-red-400"
            : "border border-white/10 bg-white/[0.05] text-slate-100 hover:bg-white/[0.08]"
        } disabled:cursor-not-allowed disabled:opacity-60`}
        disabled={!apiOnline || isLoading}
        onClick={handleClick}
        type="button"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {isLoading ? "Updating" : actionLabel}
      </button>
      {!apiOnline ? (
        <p className="text-xs text-slate-500">Live backend required for status changes.</p>
      ) : null}
      {incident.status === "new" && suggestion ? (
        <p className="text-xs text-slate-500">Will assign {suggestion.name}.</p>
      ) : null}
      {actionState?.error ? (
        <p className="rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {actionState.error}
        </p>
      ) : null}
    </div>
  );
}

function DuplicateMatches({ actionState, apiOnline, incident, matches = [], onMergeDuplicate }) {
  if (!matches.length) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
        <AlertTriangle className="h-4 w-4" /> Possible duplicate incident
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {matches.map((match) => {
          const loadingKey = `merge:${match.id}`;
          const isLoading = actionState?.loading === loadingKey;
          const isAnotherActionLoading = Boolean(actionState?.loading) && !isLoading;
          const disableReason = !apiOnline
            ? "Backend is offline."
            : !onMergeDuplicate
              ? "Merge handler is unavailable."
              : isAnotherActionLoading
                ? null
                : null;

          return (
            <div className="rounded-lg border border-white/10 bg-black/15 p-3" key={match.id}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-amber-100">
                  {Math.round((match.duplicateScore || 0) * 100)}% match
                </span>
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-slate-300">
                  {statusLabel(match.status)}
                </span>
                {match.distanceKm !== null && match.distanceKm !== undefined ? (
                  <span className="text-slate-500">{match.distanceKm} km away</span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-300">{match.rawText}</p>
              <p className="mt-2 text-xs text-slate-500">{match.reason}</p>
              <button
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 text-xs font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={!apiOnline || isLoading || !onMergeDuplicate}
                onClick={() => onMergeDuplicate(incident, match)}
                type="button"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {isLoading ? "Merging" : "Merge Into This"}
              </button>
              {disableReason ? (
                <p className="mt-2 text-xs text-slate-500">{disableReason}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function IncidentCard({ actionState, apiOnline, incident, onAdvanceStatus, onConfirmDispatch, onMergeDuplicate, suggestion }) {
  const type = getTypeStyle(incident.type);
  const severity = getSeverityStyle(incident.severity);
  const Icon = iconByType[incident.type] || iconByType.other;
  const statusClass = statusStyles[incident.status] || statusStyles.new;

  return (
    <article className={`rounded-lg border bg-[#0b1725] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] ${severity.panel}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${type.bg} ${type.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-white">{type.label}</h3>
              <span className={`rounded-md border px-2 py-1 text-xs font-medium ${severity.badge}`}>
                {severity.label}
              </span>
              <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${statusClass}`}>
                {statusLabel(incident.status)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{incident.rawText}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start xl:flex-col xl:items-end">
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-sm text-slate-300">
            <Activity className="h-4 w-4 text-sky-300" />
            {confidenceLabel(incident.confidence)} confidence
          </div>
          <CardAction
            actionState={actionState}
            apiOnline={apiOnline}
            incident={incident}
            onAdvanceStatus={onAdvanceStatus}
            onConfirmDispatch={onConfirmDispatch}
            suggestion={suggestion}
          />
        </div>
      </div>

      <DuplicateMatches
        actionState={actionState}
        apiOnline={apiOnline}
        incident={incident}
        matches={incident.possibleDuplicates}
        onMergeDuplicate={onMergeDuplicate}
      />

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-black/15 p-3">
          <div className="flex items-center gap-2 text-xs uppercase text-slate-500">
            <MapPin className="h-3.5 w-3.5" /> Location
          </div>
          <p className="mt-2 text-sm text-slate-200">{incident.locationText || "Needs review"}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/15 p-3">
          <div className="flex items-center gap-2 text-xs uppercase text-slate-500">
            <Route className="h-3.5 w-3.5" /> Resource
          </div>
          <p className="mt-2 text-sm text-slate-200">
            {suggestion ? suggestion.name : incident.status === "needs_review" ? "Pending review" : "Auto-select nearest available"}
          </p>
          {suggestion?.distanceKm !== undefined ? (
            <p className="mt-1 text-xs text-slate-500">{suggestion.distanceKm} km away</p>
          ) : null}
          {suggestion?.dispatchReason ? (
            <p className="mt-1 text-xs text-slate-500">{suggestion.dispatchReason}</p>
          ) : null}
          {suggestion?.requiresSupervisorReview ? (
            <p className="mt-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-xs text-amber-100">
              Far fallback. Supervisor review recommended before dispatch.
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-white/10 bg-black/15 p-3">
          <div className="flex items-center gap-2 text-xs uppercase text-slate-500">
            <Clock className="h-3.5 w-3.5" /> AI Notes
          </div>
          <p className="mt-2 text-sm text-slate-200">{incident.aiNotes || "No notes recorded."}</p>
        </div>
      </div>
    </article>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-lg border border-white/10 bg-[#0b1725] p-5">
          <div className="flex animate-pulse gap-4">
            <div className="h-12 w-12 rounded-lg bg-white/10" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-48 rounded bg-white/10" />
              <div className="h-3 w-full max-w-2xl rounded bg-white/10" />
              <div className="grid gap-3 md:grid-cols-3">
                <div className="h-16 rounded-lg bg-white/5" />
                <div className="h-16 rounded-lg bg-white/5" />
                <div className="h-16 rounded-lg bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function IncidentDashboard({
  actionStates = {},
  apiOnline,
  incidents,
  isLoading,
  onAdvanceStatus,
  onConfirmDispatch,
  onMergeDuplicate,
  suggestionsByIncidentId
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#07111d] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Incident Dashboard</h2>
          <p className="mt-1 text-sm text-slate-400">Sorted by severity and recency</p>
        </div>
        <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-400">
          {incidents.length} records
        </span>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <LoadingCards />
        ) : incidents.length ? (
          <div className="grid gap-4">
            {incidents.map((incident) => (
              <IncidentCard
                actionState={actionStates[incident.id]}
                apiOnline={apiOnline}
                key={incident.id}
                incident={incident}
                onAdvanceStatus={onAdvanceStatus}
                onConfirmDispatch={onConfirmDispatch}
                onMergeDuplicate={onMergeDuplicate}
                suggestion={getSuggestedResource(incident, suggestionsByIncidentId)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-white">No incidents saved yet</h3>
            <p className="mt-2 text-sm text-slate-500">Submit an incoming report to create the first incident record.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default IncidentDashboard;