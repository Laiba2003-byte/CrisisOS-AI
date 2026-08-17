import { severityRank, severityStyles, typeStyles } from "../data/dashboardData.js";

export function formatTime(value) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function statusLabel(value = "new") {
  return value.replace(/_/g, " ");
}

export function getSeverityStyle(severity) {
  return severityStyles[severity] || severityStyles.low;
}

export function getTypeStyle(type) {
  return typeStyles[type] || typeStyles.other;
}

export function sortIncidents(incidents) {
  return [...incidents].sort((a, b) => {
    const severityDifference =
      (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function confidenceLabel(value) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "--";
}