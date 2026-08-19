import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";
import { fallbackIncidents, fallbackResources } from "./data/dashboardData.js";
import { fetchJson } from "./utils/api.js";
import { sortIncidents } from "./utils/formatters.js";
import { ResourceAvailability, TrendChart, TypeBreakdown } from "./components/AnalyticsPanels.jsx";
import {
  AlertsView,
  AnalyticsView,
  IncidentsView,
  MapOnlyView,
  ReportsView,
  ResourcesView,
  SettingsView,
  SheltersView
} from "./components/DashboardViews.jsx";
import DashboardMap from "./components/DashboardMap.jsx";
import Header from "./components/Header.jsx";
import IncidentDashboard from "./components/IncidentDashboard.jsx";
import RecentAlerts from "./components/RecentAlerts.jsx";
import ReportForm from "./components/ReportForm.jsx";
import Sidebar from "./components/Sidebar.jsx";
import StatCard from "./components/StatCard.jsx";
import TestView from "./components/TestView.jsx";

const nextIncidentStatus = {
  needs_review: "new",
  assigned: "en_route",
  en_route: "on_scene",
  on_scene: "resolved"
};

const viewMeta = {
  overview: {
    title: "Emergency Dashboard",
    subtitle: "Pakistan operations overview"
  },
  alerts: {
    title: "Alerts",
    subtitle: "Active emergency alerts"
  },
  incidents: {
    title: "Incidents",
    subtitle: "Dispatch queue and status tracking"
  },
  reports: {
    title: "Reports",
    subtitle: "AI incident intake"
  },
  map: {
    title: "Map View",
    subtitle: "Incident and resource positions"
  },
  resources: {
    title: "Resources",
    subtitle: "Ambulances, fire units, and rescue teams"
  },
  shelters: {
    title: "Shelters",
    subtitle: "Relief shelter capacity"
  },
  analytics: {
    title: "Analytics",
    subtitle: "Operational trends and availability"
  },
  settings: {
    title: "Settings",
    subtitle: "Local system configuration"
  },
  test: {
    title: "Test Page",
    subtitle: "Manual smoke checks"
  }
};

function App() {
  const [activeView, setActiveView] = useState("overview");
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [suggestionsByIncidentId, setSuggestionsByIncidentId] = useState({});
  const [apiOnline, setApiOnline] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [actionStates, setActionStates] = useState({});
  const [resourceActionStates, setResourceActionStates] = useState({});

  const loadDashboardData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsDashboardLoading(true);
    }

    const [incidentResult, resourceResult] = await Promise.allSettled([
      fetchJson("/incidents"),
      fetchJson("/resources")
    ]);

    if (incidentResult.status === "fulfilled") {
      setIncidents(sortIncidents(Array.isArray(incidentResult.value) ? incidentResult.value : []));
    }

    if (resourceResult.status === "fulfilled") {
      setResources(Array.isArray(resourceResult.value) ? resourceResult.value : []);
    }

    const connected =
      incidentResult.status === "fulfilled" || resourceResult.status === "fulfilled";

    setApiOnline(connected);
    setDashboardError(
      connected
        ? null
        : "Backend is unavailable. Dashboard is showing demo data."
    );

    if (!silent) {
      setIsDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    let ignore = false;
    const candidates = incidents.filter(
      (incident) =>
        !incident.assignedResource &&
        !incident.suggestedResource &&
        incident.status !== "needs_review" &&
        incident.status !== "resolved" &&
        incident.status !== "merged" &&
        typeof incident.lat === "number" &&
        typeof incident.lng === "number"
    );

    async function loadSuggestions() {
      const results = await Promise.allSettled(
        candidates.map((incident) => fetchJson(`/incidents/${incident.id}/suggest-resource`))
      );

      if (ignore) {
        return;
      }

      const nextSuggestions = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          nextSuggestions[candidates[index].id] = result.value;
        }
      });

      if (Object.keys(nextSuggestions).length) {
        setSuggestionsByIncidentId((current) => ({ ...current, ...nextSuggestions }));
      }
    }

    if (candidates.length && apiOnline) {
      loadSuggestions();
    }

    return () => {
      ignore = true;
    };
  }, [apiOnline, incidents]);

  const displayIncidents = apiOnline ? sortIncidents(incidents) : fallbackIncidents;
  const displayResources = apiOnline ? resources : fallbackResources;
  const activeCount = displayIncidents.filter((incident) => !["resolved", "merged"].includes(incident.status)).length;
  const criticalCount = displayIncidents.filter(
    (incident) => incident.severity === "critical" && incident.status !== "resolved"
  ).length;
  const reviewCount = displayIncidents.filter((incident) => incident.status === "needs_review").length;
  const resolvedCount = displayIncidents.filter((incident) => incident.status === "resolved").length;
  const newAlertCount = displayIncidents.filter((incident) => ["new", "needs_review"].includes(incident.status)).length;
  const assignedCount = displayIncidents.filter((incident) => ["assigned", "en_route", "on_scene"].includes(incident.status)).length;

  const navCounts = useMemo(
    () => ({
      alerts: newAlertCount,
      incidents: activeCount,
      resources: displayResources.filter((resource) => resource.status === "available").length,
      shelters: 5,
      analytics: criticalCount + reviewCount
    }),
    [activeCount, criticalCount, displayResources, newAlertCount, reviewCount]
  );

  function upsertIncident(incident) {
    setIncidents((current) =>
      sortIncidents([incident, ...current.filter((item) => item.id !== incident.id)])
    );
  }

  function upsertResource(resource) {
    setResources((current) =>
      [resource, ...current.filter((item) => item.id !== resource.id)].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
  }

  function setIncidentActionState(incidentId, state) {
    setActionStates((current) => ({
      ...current,
      [incidentId]: state
    }));
  }

  function clearIncidentActionState(incidentId) {
    setActionStates((current) => {
      const next = { ...current };
      delete next[incidentId];
      return next;
    });
  }

  function setResourceActionState(resourceId, state) {
    setResourceActionStates((current) => ({
      ...current,
      [resourceId]: state
    }));
  }

  function clearResourceActionState(resourceId) {
    setResourceActionStates((current) => {
      const next = { ...current };
      delete next[resourceId];
      return next;
    });
  }

  function handleIncidentCreated(incident) {
    setApiOnline(true);
    upsertIncident(incident);

    if (incident.suggestedResource) {
      setSuggestionsByIncidentId((current) => ({
        ...current,
        [incident.id]: incident.suggestedResource
      }));
    }
  }

  async function patchIncidentStatus(incident, status, assignedResourceId) {
    if (!apiOnline) {
      setIncidentActionState(incident.id, {
        error: "Start the backend to update live dispatch status."
      });
      return;
    }

    setIncidentActionState(incident.id, { loading: status });

    try {
      const body = { status };

      if (assignedResourceId) {
        body.assignedResourceId = assignedResourceId;
      }

      const updatedIncident = await fetchJson(`/incidents/${incident.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body)
      });

      upsertIncident(updatedIncident);
      clearIncidentActionState(incident.id);

      if (status === "assigned") {
        setSuggestionsByIncidentId((current) => {
          const next = { ...current };
          delete next[incident.id];
          return next;
        });
      }

      await loadDashboardData({ silent: true });
    } catch (error) {
      setIncidentActionState(incident.id, { error: error.message });
    }
  }

  async function patchResourceStatus(resource, status) {
    if (!apiOnline) {
      setResourceActionState(resource.id, {
        error: "Start the backend to update resource status."
      });
      return;
    }

    setResourceActionState(resource.id, { loading: status });

    try {
      const updatedResource = await fetchJson(`/resources/${resource.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      upsertResource(updatedResource);
      clearResourceActionState(resource.id);
      await loadDashboardData({ silent: true });
    } catch (error) {
      setResourceActionState(resource.id, { error: error.message });
    }
  }

  async function patchResourceTracking(resource, trackingData) {
    if (!apiOnline) {
      setResourceActionState(resource.id, {
        error: "Start the backend to update resource tracking."
      });
      return;
    }

    setResourceActionState(resource.id, { loading: "tracking" });

    try {
      const updatedResource = await fetchJson(`/resources/${resource.id}/tracking`, {
        method: "PATCH",
        body: JSON.stringify(trackingData)
      });

      upsertResource(updatedResource);
      clearResourceActionState(resource.id);
      await loadDashboardData({ silent: true });
    } catch (error) {
      setResourceActionState(resource.id, { error: error.message });
    }
  }

  async function handleMergeDuplicate(primaryIncident, duplicateIncident) {
    if (!apiOnline) {
      setIncidentActionState(primaryIncident.id, {
        error: "Start the backend to merge duplicate incidents."
      });
      return;
    }

    const loadingKey = `merge:${duplicateIncident.id}`;
    setIncidentActionState(primaryIncident.id, { loading: loadingKey });

    try {
      const result = await fetchJson(`/incidents/${primaryIncident.id}/merge`, {
        method: "PATCH",
        body: JSON.stringify({ duplicateIncidentId: duplicateIncident.id })
      });

      if (result.primaryIncident) {
        upsertIncident(result.primaryIncident);
      }

      if (result.mergedIncident) {
        upsertIncident(result.mergedIncident);
      }

      clearIncidentActionState(primaryIncident.id);
      await loadDashboardData({ silent: true });
    } catch (error) {
      setIncidentActionState(primaryIncident.id, { error: error.message });
    }
  }

  function handleConfirmDispatch(incident) {
    const suggestedResource =
      incident.suggestedResource || suggestionsByIncidentId[incident.id] || null;

    patchIncidentStatus(incident, "assigned", suggestedResource?.id);
  }

  function handleAdvanceStatus(incident) {
    const nextStatus = nextIncidentStatus[incident.status];

    if (!nextStatus) {
      return;
    }

    patchIncidentStatus(incident, nextStatus);
  }

  function renderOverview() {
    return (
      <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active Alerts" value={activeCount} detail="Open operational incidents" icon={AlertTriangle} tone="border-red-500/20 bg-red-500/10 text-red-300" />
          <StatCard label="Critical Incidents" value={criticalCount} detail="Require immediate attention" icon={Activity} tone="border-amber-500/20 bg-amber-500/10 text-amber-300" />
          <StatCard label="Needs Review" value={reviewCount} detail="Low-confidence reports" icon={CheckCircle2} tone="border-sky-500/20 bg-sky-500/10 text-sky-300" />
          <StatCard label="Resolved Today" value={Math.max(resolvedCount, apiOnline ? 0 : 7)} detail="Closed response records" icon={ShieldCheck} tone="border-emerald-500/20 bg-emerald-500/10 text-emerald-300" />
        </section>

        <ReportForm
          onIncidentCreated={handleIncidentCreated}
          onResourcesRefresh={() => loadDashboardData({ silent: true })}
        />

        <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <DashboardMap incidents={displayIncidents} resources={displayResources} />
          <RecentAlerts incidents={displayIncidents} />
        </section>

        <IncidentDashboard
          actionStates={actionStates}
          apiOnline={apiOnline}
          incidents={displayIncidents}
          isLoading={isDashboardLoading}
          onAdvanceStatus={handleAdvanceStatus}
          onConfirmDispatch={handleConfirmDispatch}
          onMergeDuplicate={handleMergeDuplicate}
          suggestionsByIncidentId={suggestionsByIncidentId}
        />

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr_1fr]">
          <TrendChart />
          <TypeBreakdown incidents={displayIncidents} />
          <ResourceAvailability resources={displayResources} />
        </section>
      </>
    );
  }

  function renderActiveView() {
    const sharedIncidentProps = {
      actionStates,
      apiOnline,
      isLoading: isDashboardLoading,
      onAdvanceStatus: handleAdvanceStatus,
      onConfirmDispatch: handleConfirmDispatch,
      onMergeDuplicate: handleMergeDuplicate,
      suggestionsByIncidentId
    };

    switch (activeView) {
      case "alerts":
        return <AlertsView incidents={displayIncidents} {...sharedIncidentProps} />;
      case "incidents":
        return <IncidentsView incidents={displayIncidents} {...sharedIncidentProps} />;
      case "reports":
        return (
          <ReportsView
            apiOnline={apiOnline}
            incidents={displayIncidents}
            onIncidentCreated={handleIncidentCreated}
            onResourcesRefresh={() => loadDashboardData({ silent: true })}
          />
        );
      case "map":
        return <MapOnlyView incidents={displayIncidents} resources={displayResources} />;
      case "resources":
        return (
          <ResourcesView
            actionStates={resourceActionStates}
            apiOnline={apiOnline}
            onStatusChange={patchResourceStatus}
            onTrackingUpdate={patchResourceTracking}
            resources={displayResources}
          />
        );
      case "shelters":
        return <SheltersView />;
      case "analytics":
        return (
          <AnalyticsView
            assignedCount={assignedCount}
            criticalCount={criticalCount}
            incidents={displayIncidents}
            resources={displayResources}
            reviewCount={reviewCount}
          />
        );
      case "settings":
        return (
          <SettingsView
            apiOnline={apiOnline}
            isLoading={isDashboardLoading}
            onRefresh={() => loadDashboardData()}
          />
        );
      case "test":
        return <TestView apiOnline={apiOnline} />;
      default:
        return renderOverview();
    }
  }

  const activeMeta = viewMeta[activeView] || viewMeta.overview;

  return (
    <main className="min-h-screen bg-[#050b13] text-slate-100">
      <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
        <Sidebar
          activeView={activeView}
          apiOnline={apiOnline}
          counts={navCounts}
          onViewChange={setActiveView}
        />
        <div className="min-w-0">
          <Header
            alertCount={newAlertCount}
            apiOnline={apiOnline}
            onAlertsClick={() => setActiveView("alerts")}
            subtitle={activeMeta.subtitle}
            title={activeMeta.title}
          />
          <div className="space-y-5 p-5 lg:p-6">
            {dashboardError ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {dashboardError}
              </div>
            ) : null}

            {renderActiveView()}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;